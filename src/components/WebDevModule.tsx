/**
 * WebDevModule — GitHub project evaluation flow
 *
 * Steps: repo URLs → fetch metadata → AI evaluation → results
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  Globe,
  Github,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  evaluateProject,
  saveSkillResult,
  type ProjectEvaluation,
} from "../lib/skillApi";
import { useAuth } from "../hooks/useAuth";
import { SkillResults } from "./SkillResults";

type Phase = "input" | "fetching" | "evaluating" | "results";

interface RepoEntry {
  url: string;
  valid: boolean;
}

interface WebDevModuleProps {
  onBack: () => void;
}

// ── GitHub helpers ────────────────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function fetchRepoMeta(owner: string, repo: string) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  const [repoRes, readmeRes, langsRes] = await Promise.allSettled([
    fetch(base),
    fetch(`${base}/readme`, { headers: { Accept: "application/vnd.github.v3.raw" } }),
    fetch(`${base}/languages`),
  ]);

  const repoData = repoRes.status === "fulfilled" && repoRes.value.ok ? await repoRes.value.json() : null;
  const readmeText = readmeRes.status === "fulfilled" && readmeRes.value.ok ? await readmeRes.value.text() : "";
  const langsData = langsRes.status === "fulfilled" && langsRes.value.ok ? await langsRes.value.json() : {};

  return {
    url: `https://github.com/${owner}/${repo}`,
    description: repoData?.description ?? "",
    readme: readmeText.slice(0, 3000), // Cap to avoid huge payloads
    languages: Object.keys(langsData),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const WebDevModule = ({ onBack }: WebDevModuleProps) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("input");
  const [repos, setRepos] = useState<RepoEntry[]>([{ url: "", valid: true }]);
  const [evaluation, setEvaluation] = useState<ProjectEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRepo = () => {
    if (repos.length < 4) setRepos([...repos, { url: "", valid: true }]);
  };

  const removeRepo = (idx: number) => {
    setRepos(repos.filter((_, i) => i !== idx));
  };

  const updateRepo = (idx: number, url: string) => {
    const copy = [...repos];
    copy[idx] = { url, valid: url === "" || !!parseGitHubUrl(url) };
    setRepos(copy);
  };

  const validRepos = repos.filter((r) => r.url.trim() && parseGitHubUrl(r.url));
  const canSubmit = validRepos.length > 0 && repos.every((r) => r.valid);

  // ── Submit flow ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    setPhase("fetching");

    try {
      // 1. Fetch metadata from GitHub
      const metaPromises = validRepos.map((r) => {
        const parsed = parseGitHubUrl(r.url)!;
        return fetchRepoMeta(parsed.owner, parsed.repo);
      });

      const repoMeta = await Promise.all(metaPromises);

      // 2. Send to Edge Function for evaluation
      setPhase("evaluating");
      const result = await evaluateProject({ repos: repoMeta });
      setEvaluation(result);

      // 3. Save to DB
      if (user) {
        await saveSkillResult({
          user_id: user.id,
          skill_type: "webdev",
          score: result.score,
          confidence: result.confidence,
          feedback: result.feedback,
          skill_dna: result.skill_dna,
          raw_data: result as unknown as Record<string, unknown>,
        });
      }

      setPhase("results");
    } catch (e) {
      setError((e as Error).message);
      setPhase("input");
    }
  };

  // ── Input Phase ─────────────────────────────────────────────────────────────
  if (phase === "input") {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Skills
        </button>

        <div>
          <h2 className="text-3xl font-display font-bold">Web Dev Verification</h2>
          <p className="text-zinc-500 mt-1">
            Submit up to 4 GitHub repositories. We'll fetch README, description &
            languages, then evaluate your portfolio with AI.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="space-y-4">
          {repos.map((repo, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-grow relative group">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="url"
                  placeholder="https://github.com/user/repo"
                  value={repo.url}
                  onChange={(e) => updateRepo(idx, e.target.value)}
                  className={`w-full bg-white/[0.03] p-4 pl-12 rounded-2xl focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all text-white placeholder:text-zinc-600 ${
                    repo.valid
                      ? "border border-white/10"
                      : "border border-red-500/50"
                  }`}
                />
                {!repo.valid && (
                  <p className="text-xs text-red-400 mt-1 px-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Invalid GitHub URL
                  </p>
                )}
              </div>
              {repos.length > 1 && (
                <button
                  onClick={() => removeRepo(idx)}
                  className="p-3 rounded-xl glass border border-white/10 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {repos.length < 4 && (
          <button
            onClick={addRepo}
            className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add another repository
          </button>
        )}

        <div className="glass rounded-2xl p-5 border border-white/5 text-xs text-zinc-500 space-y-1">
          <p>• Public repos only — we fetch README, description, and language stats</p>
          <p>• No code is cloned or deeply parsed</p>
          <p>• Maximum 4 repositories per evaluation</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Globe className="w-5 h-5" />
          Evaluate Portfolio ({validRepos.length} repo{validRepos.length !== 1 ? "s" : ""})
        </motion.button>
      </div>
    );
  }

  // ── Loading Phase ───────────────────────────────────────────────────────────
  if (phase === "fetching" || phase === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          {phase === "fetching" ? "Fetching Repo Data..." : "AI is Evaluating Your Portfolio..."}
        </h3>
        <p className="text-zinc-500 text-sm">This takes a few seconds.</p>
      </div>
    );
  }

  // ── Results Phase ───────────────────────────────────────────────────────────
  if (phase === "results" && evaluation) {
    return (
      <div className="space-y-8">
        <SkillResults
          skillName="Web Dev"
          score={evaluation.score}
          confidence={evaluation.confidence}
          feedback={evaluation.feedback}
          skillDna={evaluation.skill_dna}
          strengths={evaluation.strengths}
          improvements={evaluation.improvements}
          breakdownItems={evaluation.project_breakdown?.map((p) => ({
            label: p.name,
            value: p.score,
            color: "bg-brand-primary",
          }))}
          onBack={onBack}
        />

        {/* Per-project summaries */}
        {evaluation.project_breakdown?.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4 pb-12">
            <h3 className="text-lg font-bold">Project Breakdown</h3>
            {evaluation.project_breakdown.map((p, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="font-mono text-brand-primary font-bold text-sm">{p.score}/10</span>
                </div>
                <p className="text-zinc-500 text-sm">{p.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
