import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// ── Shared helper ─────────────────────────────────────────────────────────────
// Calls Gemini and returns parsed JSON. Throws on parse failure.
async function callGemini<T>(prompt: string): Promise<T> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });
  const text = response.text ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text.slice(0, 200));
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DSAQuestion {
  title: string;
  problem_statement: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  optimal_approach: string;   // revealed only after submission
  time_complexity: string;
  space_complexity: string;
}

export interface DSAEvaluation {
  score: number;              // 0–10
  confidence: "Low" | "Medium" | "High";
  correctness: number;        // 0–10
  optimization: number;       // 0–10
  code_quality: number;       // 0–10
  explanation_score: number;  // 0–10
  feedback: string;           // detailed paragraph
  skill_dna: string;          // 1–2 sentence summary for the passport
  strengths: string[];
  improvements: string[];
}

// ── DSA Flow ──────────────────────────────────────────────────────────────────

export type Difficulty = "Beginner" | "Intermediate" | "Expert";

export async function generateDSAQuestion(
  difficulty: Difficulty
): Promise<DSAQuestion> {
  const prompt = `
You are a senior software engineer conducting a DSA interview.
Generate ONE ${difficulty}-level DSA coding question.

Return ONLY valid JSON matching this exact schema:
{
  "title": "string",
  "problem_statement": "string (clear description, 2-4 sentences)",
  "examples": [
    { "input": "string", "output": "string", "explanation": "string" }
  ],
  "constraints": ["string"],
  "hints": ["string (1 helpful hint, no spoilers)"],
  "optimal_approach": "string (the ideal algorithm/technique name)",
  "time_complexity": "string (e.g. O(n log n))",
  "space_complexity": "string"
}

Difficulty guide:
- Beginner: arrays, strings, basic loops (e.g. Two Sum, Reverse Array)
- Intermediate: trees, hash maps, sliding window, binary search
- Expert: graphs, DP, advanced data structures

Do NOT include the solution code. Return only the JSON object.
  `.trim();

  return callGemini<DSAQuestion>(prompt);
}

export async function evaluateDSASolution({
  question,
  userCode,
  userExplanation,
}: {
  question: DSAQuestion;
  userCode: string;
  userExplanation: string;
}): Promise<DSAEvaluation> {
  const prompt = `
You are a senior software engineer evaluating a DSA interview submission.

PROBLEM:
Title: ${question.title}
Statement: ${question.problem_statement}
Optimal approach: ${question.optimal_approach}
Expected time complexity: ${question.time_complexity}
Expected space complexity: ${question.space_complexity}

CANDIDATE'S SUBMISSION:
Code:
\`\`\`
${userCode || "(no code provided)"}
\`\`\`

Explanation:
${userExplanation || "(no explanation provided)"}

Evaluate the submission across these dimensions and return ONLY valid JSON:
{
  "score": <number 0-10, overall weighted score>,
  "confidence": <"Low" | "Medium" | "High">,
  "correctness": <number 0-10>,
  "optimization": <number 0-10>,
  "code_quality": <number 0-10>,
  "explanation_score": <number 0-10>,
  "feedback": "<2-3 sentence detailed constructive feedback>",
  "skill_dna": "<1-2 sentence summary of this candidate's DSA ability, written for a skill passport>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Scoring guide:
- correctness: Does the logic solve the problem correctly?
- optimization: Is the time/space complexity close to optimal?
- code_quality: Is the code clean, readable, well-structured?
- explanation_score: Does the candidate demonstrate conceptual understanding?
- confidence: How certain are you about this score? (Low if code is blank/minimal)

Be fair but rigorous. Do NOT be lenient for empty or trivial submissions.
Return only the JSON object.
  `.trim();

  return callGemini<DSAEvaluation>(prompt);
}
