import { callGemini, corsHeaders } from "../_shared/gemini.ts";

interface ProjectEvaluation {
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

interface RepoInput {
  url: string;
  readme: string;
  description: string;
  languages: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { repos } = (await req.json()) as { repos: RepoInput[] };

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return new Response(JSON.stringify({ error: "At least one repo is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (repos.length > 4) {
      return new Response(JSON.stringify({ error: "Maximum 4 repos allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const repoSummaries = repos
      .map(
        (r, i) => `
PROJECT ${i + 1}: ${r.url}
Description: ${r.description || "(none)"}
Languages: ${r.languages?.join(", ") || "(unknown)"}
README (first 2000 chars):
${(r.readme || "(no README)").slice(0, 2000)}
`
      )
      .join("\n---\n");

    const prompt = `
You are a senior engineering manager evaluating a developer's web development portfolio.

PROJECTS SUBMITTED:
${repoSummaries}

Evaluate the overall web development skill level based on:
- Project complexity and ambition
- Technology choices and diversity
- Code organization (inferred from README and structure)
- Documentation quality
- Real-world applicability

Return ONLY valid JSON matching this schema:
{
  "score": <number 0-10, overall portfolio score>,
  "confidence": <"Low" | "Medium" | "High">,
  "feedback": "<3-4 sentence holistic assessment of the developer's web dev capability>",
  "skill_dna": "<1-2 sentence summary for a skill passport>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "project_breakdown": [
    {
      "name": "<repo name>",
      "score": <number 0-10>,
      "summary": "<1 sentence assessment of this specific project>"
    }
  ]
}

Be fair but rigorous. Reward real projects with clear documentation.
Penalize repos with no README or minimal content.
Return only the JSON object.
    `.trim();

    const evaluation = await callGemini<ProjectEvaluation>(prompt);

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
