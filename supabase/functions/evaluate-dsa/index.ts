import { callGemini, corsHeaders } from "../_shared/gemini.ts";

interface DSAEvaluation {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, userCode, userExplanation } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: "Missing question data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const evaluation = await callGemini<DSAEvaluation>(prompt);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
