// @ts-ignore: Deno URL imports are valid in the Supabase runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RepoData {
  url: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  languages: string[];
  commits: number;
  lastCommit: string;
  readme: string;
}

// ── Fallback evaluation ────────────────────────────────────────────────────────
function fallbackEvaluation() {
  return {
    score: 55,
    level: "Intermediate",
    strengths: ["Has public repositories", "Project structure exists"],
    weaknesses: ["Add detailed READMEs", "Improve commit frequency"],
    verdict: "Developer shows initiative with public projects. Focus on documentation and consistent contribution patterns.",
  };
}

// ── Safe JSON extractor ────────────────────────────────────────────────────────
function extractJSON(raw: string): any | null {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.substring(start, end + 1)); } catch (_) {}
  }
  return null;
}

// ── Fetch GitHub repo data ─────────────────────────────────────────────────────
async function fetchRepoData(repoUrl: string): Promise<RepoData | null> {
  try {
    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) return null;
    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, "");

    const headers: Record<string, string> = { "User-Agent": "VeriSkill-App" };

    // Fetch repo metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoRes.ok) {
      console.warn(`Repo ${owner}/${repoName} not accessible: ${repoRes.status}`);
      return null;
    }
    const repoData = await repoRes.json();

    // Check if private
    if (repoData.private) {
      return null;
    }

    // Fetch languages
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/languages`, { headers });
    const langData = langRes.ok ? await langRes.json() : {};
    const languages = Object.keys(langData).slice(0, 6);

    // Fetch commit count (first page gives us up to 30, use pagination header trick)
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`,
      { headers }
    );
    let commitCount = 0;
    if (commitsRes.ok) {
      const linkHeader = commitsRes.headers.get("Link") || "";
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      commitCount = match ? parseInt(match[1]) : 1;
    }

    // Fetch README
    let readme = "";
    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/readme`,
      { headers: { ...headers, Accept: "application/vnd.github.v3.raw" } }
    );
    if (readmeRes.ok) {
      const rawReadme = await readmeRes.text();
      readme = rawReadme.substring(0, 1500); // Limit to 1500 chars
    }

    return {
      url: repoUrl,
      name: repoData.name,
      description: repoData.description || "",
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      languages,
      commits: commitCount,
      lastCommit: repoData.pushed_at || "",
      readme,
    };
  } catch (err) {
    console.error("fetchRepoData error:", err);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const urls: string[] = (body?.repos || []).filter((u: string) => u?.trim());

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "No repo URLs provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // @ts-ignore: Deno is available in Supabase Edge runtime
    const apiKey = Deno.env.get("GROQ_API_KEY");

    // Fetch all repo data in parallel
    const repoDataResults = await Promise.all(urls.slice(0, 4).map(fetchRepoData));
    const validRepos = repoDataResults.filter((r): r is RepoData => r !== null);

    if (validRepos.length === 0) {
      return new Response(JSON.stringify({
        error: "No accessible public repositories found. Ensure repos are public.",
        repos_checked: urls,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build AI prompt
    const repoSummaries = validRepos.map((r, i) => `
### Repo ${i + 1}: ${r.name}
- Description: ${r.description || "None"}
- Stars: ${r.stars} | Forks: ${r.forks}
- Languages: ${r.languages.join(", ") || "Unknown"}
- Commits: ${r.commits}
- Last Active: ${r.lastCommit ? new Date(r.lastCommit).toDateString() : "Unknown"}
- README Preview: ${r.readme ? r.readme.substring(0, 400) : "No README"}
`).join("\n");

    // Total commit activity score (0-100)
    const totalCommits = validRepos.reduce((s, r) => s + r.commits, 0);
    const avgStars = validRepos.reduce((s, r) => s + r.stars, 0) / validRepos.length;

    let evaluation = fallbackEvaluation();

    if (apiKey) {
      const prompt = `You are a senior engineering recruiter evaluating a developer's GitHub portfolio.

Analyze the following repositories and provide a comprehensive developer evaluation.

${repoSummaries}

Evaluate based on:
1. Code complexity and real-world relevance
2. Tech stack diversity and depth
3. Commit consistency and project activity
4. README quality and documentation
5. Project impact (stars, forks)

Return ONLY valid JSON (no markdown, no explanation):

{
  "score": <0-100 integer>,
  "level": "<Beginner|Intermediate|Advanced>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "verdict": "<2-3 sentence honest developer summary>"
}`;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 800,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const raw = groqData?.choices?.[0]?.message?.content || "";
        const parsed = extractJSON(raw);
        if (parsed?.score !== undefined && parsed?.level) {
          evaluation = parsed;
        }
      }
    }

    // Apply commit activity bonus/penalty
    const commitBonus = Math.min(Math.floor(totalCommits / 20), 15);
    const starBonus = Math.min(Math.floor(avgStars * 2), 10);
    const finalScore = Math.min(100, Math.max(0, evaluation.score + commitBonus + starBonus));

    return new Response(JSON.stringify({
      ...evaluation,
      score: finalScore,
      repos: validRepos.map(r => ({
        name: r.name,
        url: r.url,
        description: r.description,
        stars: r.stars,
        forks: r.forks,
        languages: r.languages,
        commits: r.commits,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("evaluate-github error:", err);
    return new Response(JSON.stringify(fallbackEvaluation()), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
