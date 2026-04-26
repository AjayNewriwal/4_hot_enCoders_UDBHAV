/**
 * Skill API Client
 *
 * Calls Supabase Edge Functions for skill evaluation.
 * Generic `evaluateSkill()` dispatches to the correct function by skill type.
 */

import { supabase } from "./supabase";
import type { SkillType } from "./skillConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Difficulty = "Beginner" | "Intermediate" | "Expert";

export interface DSAQuestion {
  title: string;
  problem_statement: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  optimal_approach: string;
  time_complexity: string;
  space_complexity: string;
}

export interface DSAEvaluation {
  score: number;
  confidence: "Low" | "Medium" | "High";
  correctness: number;
  optimization: number;
  code_quality: number;
  explanation_score: number;
  feedback: string;
  skill_dna: string;
  strengths: string[];
  improvements: string[];
}

export interface ProjectEvaluation {
  score: number;
  confidence: "Low" | "Medium" | "High";
  feedback: string;
  skill_dna: string;
  strengths: string[];
  improvements: string[];
  project_breakdown: {
    name: string;
    score: number;
    summary: string;
  }[];
}

export interface SkillResult {
  user_id: string;
  skill_type: SkillType;
  score: number;
  confidence: "Low" | "Medium" | "High";
  feedback: string;
  skill_dna: string;
  raw_data: Record<string, unknown>;
}

// ── Edge Function Calls ───────────────────────────────────────────────────────

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(`Edge Function "${name}" failed: ${error.message}`);
  return data as T;
}

/** Generate a DSA question at the given difficulty */
export async function generateDSAQuestion(difficulty: Difficulty): Promise<DSAQuestion> {
  const { data: user } = await supabase.auth.getUser();
  console.log("USER:", user);

  const map: any = {
    Beginner: "easy",
    Intermediate: "medium",
    Expert: "hard"
  };

  const mappedDifficulty = map[difficulty];

  const { data, error } = await supabase.functions.invoke(
    "generate-dsa-question",
    {
      body: { difficulty: mappedDifficulty }
    }
  );

  console.log("FUNCTION RESPONSE DATA:", data);
  console.log("FUNCTION ERROR:", error);

  if (error) {
    console.error("Supabase Invoke Error:", error);
    throw new Error(`Connection failed: ${error.message}`);
  }

  // Handle custom 200 error responses from Edge Function
  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Received empty response from server.");
  }

  return {
    title: data.title || "DSA Challenge",
    problem_statement: data.description || "No description provided.",
    constraints: Array.isArray(data.constraints) ? data.constraints : typeof data.constraints === 'string' ? [data.constraints] : [],
    examples: [
      {
        input: data.sample_input || "N/A",
        output: data.sample_output || "N/A"
      }
    ],
    hints: [],
    optimal_approach: "",
    time_complexity: "",
    space_complexity: ""
  } as DSAQuestion;
}

/** Evaluate a DSA submission */
export async function evaluateDSA(payload: {
  question: DSAQuestion;
  userCode: string;
  userExplanation: string;
}): Promise<DSAEvaluation> {
  return invokeFunction<DSAEvaluation>("evaluate-dsa", payload);
}

/** Evaluate Web Dev projects from GitHub repos */
export async function evaluateProject(payload: {
  repos: { url: string; readme: string; description: string; languages: string[] }[];
}): Promise<ProjectEvaluation> {
  return invokeFunction<ProjectEvaluation>("evaluate-project", payload);
}

// ── Generic Skill Evaluator ───────────────────────────────────────────────────

/**
 * Generic entry point: dispatches to the correct evaluator by skill type.
 * New skills just need a new case here + a matching Edge Function.
 */
export async function evaluateSkill(
  skillType: SkillType,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const functionMap: Record<string, string> = {
    dsa: "evaluate-dsa",
    webdev: "evaluate-project",
    // Future: sql: "evaluate-sql", ml: "evaluate-ml", etc.
  };

  const fnName = functionMap[skillType];
  if (!fnName) throw new Error(`No evaluator registered for skill: ${skillType}`);

  return invokeFunction<Record<string, unknown>>(fnName, payload);
}

// ── Save Result ───────────────────────────────────────────────────────────────

/** Persist a skill evaluation result to the database */
export async function saveSkillResult(result: SkillResult): Promise<void> {
  const { error } = await supabase.from("skill_results").insert(result);
  if (error) throw new Error(`Failed to save skill result: ${error.message}`);
}

/** Fetch all skill results for the current user */
export async function getMySkillResults(): Promise<SkillResult[]> {
  const { data, error } = await supabase
    .from("skill_results")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch skill results: ${error.message}`);
  return (data ?? []) as SkillResult[];
}

/** Update the leaderboard score for a user and skill (Atomic Increment) */
export async function updateSkillScore(userId: string, skill: string, points: number) {
  // We use an RPC call for atomic increment to avoid race conditions
  const { data, error } = await supabase.rpc('increment_skill_score', {
    p_user_id: userId,
    p_skill: skill.toUpperCase(),
    p_points: points
  });

  if (error) {
    console.error("Failed to update skill score:", error);
  }
  return { data, error };
}
