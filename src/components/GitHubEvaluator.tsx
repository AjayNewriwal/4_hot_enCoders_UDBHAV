import { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  Github, Link, AlertCircle, CheckCircle2, Loader2, Star, GitFork,
  TrendingUp, TrendingDown, Award, BarChart3, Zap, X, Plus, RefreshCw,
  Code, Globe, Activity
} from "lucide-react";

interface RepoResult {
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  languages: string[];
  commits: number;
}

interface EvaluationResult {
  score: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  strengths: string[];
  weaknesses: string[];
  verdict: string;
  repos: RepoResult[];
}

function isValidGitHubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(url.trim());
}

const LEVEL_CONFIG = {
  Beginner: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", glow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]" },
  Intermediate: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", glow: "shadow-[0_0_20px_rgba(96,165,250,0.15)]" },
  Advanced: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", glow: "shadow-[0_0_20px_rgba(74,222,128,0.2)]" },
};

export default function GitHubEvaluator() {
  const [repos, setRepos] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  function setRepo(idx: number, val: string) {
    setRepos(prev => prev.map((r, i) => (i === idx ? val : r)));
  }

  const filledRepos = repos.filter(r => r.trim() !== "");
  const invalidUrls = filledRepos.filter(r => !isValidGitHubUrl(r));

  async function handleEvaluate() {
    setError(null);
    setResult(null);
    setSavedMsg(false);

    if (filledRepos.length === 0) {
      setError("Add at least one GitHub repository URL.");
      return;
    }

    if (invalidUrls.length > 0) {
      setError(`Invalid GitHub URL(s): ${invalidUrls.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke("evaluate-github", {
        body: { repos: filledRepos },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.score === undefined) throw new Error("Invalid evaluation response");

      setResult(data as EvaluationResult);

      // Auto-save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        await Promise.all([
          supabase.from("project_evaluations").insert({
            user_id: user.id,
            repos: data.repos ?? filledRepos,
            score: data.score,
            level: data.level,
            strengths: data.strengths,
            weaknesses: data.weaknesses,
            verdict: data.verdict,
          }),
          supabase.from("skill_scores").insert({
            user_id: user.id,
            skill: "GitHub Portfolio",
            score: data.score,
            cheating_flags: 0,
            mode: "github",
          }),
          // Update profile rating
          supabase.from("user_skills").upsert({
            user_id: user.id,
            skill_name: "GitHub Portfolio",
            score: data.score,
            level: data.level?.toLowerCase() ?? "intermediate",
            verified: true,
            expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: "user_id,skill_name" }),
          supabase.from("notifications").insert({
            user_id: user.id,
            type: data.score >= 75 ? "badge" : "info",
            message: `GitHub Portfolio evaluated — Score: ${data.score}/100 (${data.level})`,
          }),
        ]);
        setSavedMsg(true);
      }
    } catch (e: any) {
      setError(e.message ?? "Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setRepos(["", "", "", ""]);
    setSavedMsg(false);
  }

  const cfg = result ? LEVEL_CONFIG[result.level] ?? LEVEL_CONFIG.Intermediate : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-20 space-y-6"
    >
      {/* Header */}
      <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-gradient-to-br from-brand-secondary/5 to-transparent">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center">
            <Github className="w-6 h-6 text-brand-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">GitHub Portfolio Evaluation</h2>
            <p className="text-zinc-500 text-sm">AI-powered analysis of your public repositories</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* URL Inputs */}
            <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
                  <Link className="w-4 h-4 text-brand-primary" /> Repository URLs (max 4)
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {repos.map((repo, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-600 w-4">{idx + 1}.</span>
                      <Github className={`w-4 h-4 ${repo && isValidGitHubUrl(repo) ? "text-green-400" : "text-zinc-600"}`} />
                    </div>
                    <input
                      type="url"
                      placeholder={`https://github.com/username/repo-${idx + 1}`}
                      value={repo}
                      onChange={e => setRepo(idx, e.target.value)}
                      className={`w-full bg-zinc-950/50 rounded-2xl pl-14 pr-4 py-3.5 text-sm border focus:outline-none text-white placeholder:text-zinc-600 transition-all ${
                        repo && !isValidGitHubUrl(repo)
                          ? "border-red-500/40 focus:border-red-500/60"
                          : repo && isValidGitHubUrl(repo)
                          ? "border-green-500/30 focus:border-green-500/50"
                          : "border-white/10 focus:border-brand-primary/50"
                      }`}
                    />
                    {repo && !isValidGitHubUrl(repo) && (
                      <div className="flex items-center gap-1.5 mt-1 px-4 text-[10px] text-red-400">
                        <AlertCircle className="w-3 h-3" /> Must be a valid public GitHub URL
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info callout */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15">
              <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-500 space-y-1">
                <p className="text-blue-400 font-bold">Evaluation Criteria</p>
                <p>Code quality · Tech stack depth · Commit consistency · Documentation · Real-world relevance</p>
                <p className="text-zinc-600">Only public repositories are evaluated. Private repos will be skipped.</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleEvaluate}
              disabled={loading || filledRepos.length === 0 || invalidUrls.length > 0}
              className="w-full py-4 rounded-2xl bg-brand-secondary text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(112,0,255,0.25)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Repositories...</>
              ) : (
                <><Zap className="w-5 h-5" /> Evaluate GitHub Portfolio</>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Score Card */}
            <div className={`glass rounded-[2.5rem] p-8 border text-center ${cfg?.bg} ${cfg?.glow}`}>
              <div className={`text-6xl font-display font-black mb-2 ${cfg?.color}`}>{result.score}</div>
              <div className="text-zinc-500 text-sm mb-3">/ 100</div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border font-bold text-sm ${cfg?.bg} ${cfg?.color}`}>
                <Award className="w-4 h-4" /> {result.level} Developer
              </div>
              <p className="text-zinc-400 text-sm mt-4 max-w-lg mx-auto leading-relaxed">{result.verdict}</p>
              {savedMsg && (
                <div className="flex items-center justify-center gap-2 mt-3 text-green-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to your profile
                </div>
              )}
            </div>

            {/* Strengths + Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-[2rem] p-6 border border-green-500/15 bg-green-500/[0.03]">
                <h4 className="font-bold text-green-400 text-sm flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" /> Strengths
                </h4>
                <ul className="space-y-2">
                  {(result.strengths ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-[2rem] p-6 border border-red-500/15 bg-red-500/[0.03]">
                <h4 className="font-bold text-red-400 text-sm flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4" /> Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {(result.weaknesses ?? []).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                      <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Repos Analyzed */}
            {result.repos && result.repos.length > 0 && (
              <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                  <h4 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-4 h-4 text-brand-primary" /> Repositories Analyzed
                  </h4>
                </div>
                <div className="divide-y divide-white/5">
                  {result.repos.map((repo, i) => (
                    <div key={i} className="p-5 hover:bg-white/[0.02] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-brand-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Github className="w-3.5 h-3.5" /> {repo.name}
                          </a>
                          {repo.description && (
                            <p className="text-zinc-500 text-xs mt-1 truncate">{repo.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {repo.languages.slice(0, 4).map(l => (
                              <span key={l} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400">{l}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{repo.stars}</span>
                          <span className="flex items-center gap-1"><GitFork className="w-3 h-3 text-zinc-500" />{repo.forks}</span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-400" />{repo.commits} commits</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-2xl glass border border-white/10 text-sm font-bold text-zinc-400 flex items-center justify-center gap-2 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Evaluate New Repos
              </button>
              <button
                onClick={() => window.open("https://github.com", "_blank")}
                className="flex-1 py-3 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-secondary/20 transition-all"
              >
                <Github className="w-4 h-4" /> Open GitHub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
