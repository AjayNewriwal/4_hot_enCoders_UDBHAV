/**
 * DSAModule — Full DSA verification flow
 *
 * Steps: difficulty → question → code + explanation → evaluation → results
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Code,
  Clock,
  ChevronLeft,
  Zap,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  generateDSAQuestion,
  evaluateDSA,
  saveSkillResult,
  updateSkillScore,
  type DSAQuestion,
  type DSAEvaluation,
  type Difficulty,
} from "../lib/skillApi";
import { useAuth } from "../hooks/useAuth";
import { SkillResults } from "./SkillResults";

type Phase = "difficulty" | "loading-question" | "testing" | "evaluating" | "results";

interface DSAModuleProps {
  onBack: () => void;
}

export const DSAModule = ({ onBack }: DSAModuleProps) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("difficulty");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [question, setQuestion] = useState<DSAQuestion | null>(null);
  const [userCode, setUserCode] = useState("");
  const [userExplanation, setUserExplanation] = useState("");
  const [evaluation, setEvaluation] = useState<DSAEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer
  useEffect(() => {
    if (phase !== "testing" || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const timeLimits: Record<Difficulty, number> = {
    Beginner: 20 * 60,
    Intermediate: 30 * 60,
    Expert: 45 * 60,
  };

  // ── Generate question ───────────────────────────────────────────────────────
  const handleStartTest = async (diff: Difficulty) => {
    setDifficulty(diff);
    setPhase("loading-question");
    setError(null);
    try {
      const q = await generateDSAQuestion(diff);
      setQuestion(q);
      setTimeLeft(timeLimits[diff]);
      setPhase("testing");
    } catch (e) {
      setError((e as Error).message);
      setPhase("difficulty");
    }
  };

  // ── Evaluate submission ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!question) return;
    setPhase("evaluating");
    setError(null);
    try {
      const result = await evaluateDSA({ question, userCode, userExplanation });
      setEvaluation(result);

      // Save to DB
      if (user) {
        await saveSkillResult({
          user_id: user.id,
          skill_type: "dsa",
          score: result.score,
          confidence: result.confidence,
          feedback: result.feedback,
          skill_dna: result.skill_dna,
          raw_data: result as unknown as Record<string, unknown>,
        });

        // Update Leaderboard Score based on difficulty
        const points = difficulty === "Beginner" ? 10 : difficulty === "Intermediate" ? 25 : 50;
        await updateSkillScore(user.id, "DSA", points);
      }

      setPhase("results");
    } catch (e) {
      setError((e as Error).message);
      setPhase("testing");
    }
  };

  // ── Difficulty Selection ────────────────────────────────────────────────────
  if (phase === "difficulty") {
    const levels: { diff: Difficulty; color: string; desc: string; time: string }[] = [
      { diff: "Beginner", color: "text-green-400", desc: "Arrays, strings, basic loops", time: "20 min" },
      { diff: "Intermediate", color: "text-blue-400", desc: "Trees, hash maps, sliding window", time: "30 min" },
      { diff: "Expert", color: "text-amber-400", desc: "Graphs, DP, advanced structures", time: "45 min" },
    ];

    return (
      <div className="space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Skills
        </button>

        <div>
          <h2 className="text-3xl font-display font-bold">DSA Verification</h2>
          <p className="text-zinc-500 mt-1">Choose difficulty. You'll receive an AI-generated coding challenge.</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {levels.map((l) => (
            <motion.div
              key={l.diff}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between cursor-pointer hover:border-brand-primary/20 transition-all"
              onClick={() => handleStartTest(l.diff)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <Zap className={`w-6 h-6 ${l.color}`} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-zinc-900 border border-white/5 ${l.color}`}>
                    {l.diff}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{l.diff}</h3>
                <p className="text-zinc-500 text-sm mb-2">{l.desc}</p>
                <p className="text-zinc-600 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {l.time}</p>
              </div>
              <button className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-zinc-100 transition-all mt-6">
                Start
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading-question" || phase === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          {phase === "loading-question" ? "Generating Question..." : "AI is Evaluating..."}
        </h3>
        <p className="text-zinc-500 text-sm">This takes a few seconds. Hang tight.</p>
      </div>
    );
  }

  // ── Testing ─────────────────────────────────────────────────────────────────
  if (phase === "testing" && question) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header bar */}
        <div className="glass p-6 rounded-3xl border border-brand-primary/20 flex items-center justify-between sticky top-28 z-20 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-zinc-900 border border-white/10">
              <Code className="text-brand-primary w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">{question.title}</h3>
              <p className="text-xs text-zinc-500">{difficulty} • DSA Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${timeLeft < 300 ? "text-red-500 animate-pulse" : "text-brand-primary"}`} />
            <span className={`font-mono text-2xl font-bold ${timeLeft < 300 ? "text-red-500" : "text-white"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}

        {/* Problem statement */}
        <section className="space-y-6">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            Problem Statement
          </h4>
          <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
            <p className="text-zinc-300 leading-relaxed">{question.problem_statement}</p>

            {Array.isArray(question.examples) && question.examples.map((ex, i) => (
              <div key={i} className="bg-zinc-950/50 rounded-2xl p-4 border border-white/5 font-mono text-sm space-y-1">
                <div><span className="text-zinc-500">Input: </span><span className="text-brand-primary">{ex.input}</span></div>
                <div><span className="text-zinc-500">Output: </span><span className="text-white">{ex.output}</span></div>
                {ex.explanation && <div className="text-zinc-600 text-xs mt-1">{ex.explanation}</div>}
              </div>
            ))}

            <div className="flex flex-wrap gap-2 mt-4">
              {Array.isArray(question.constraints) && question.constraints.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded bg-zinc-900 border border-white/5 text-zinc-500 font-mono">{c}</span>
              ))}
            </div>

            {Array.isArray(question.hints) && question.hints.length > 0 && (
              <p className="text-xs text-zinc-600 italic">Hint: {question.hints[0]}</p>
            )}
          </div>
        </section>

        {/* Code editor */}
        <section className="space-y-6">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            Your Solution
          </h4>
          <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
            <textarea
              className="w-full h-64 bg-zinc-950/50 rounded-2xl p-6 font-mono text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all text-brand-primary placeholder:text-zinc-700 resize-none"
              placeholder="// Write your solution here..."
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
            />
          </div>
        </section>

        {/* Explanation */}
        <section className="space-y-6">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            Explain Your Approach
          </h4>
          <div className="glass p-8 rounded-3xl border border-white/5">
            <input
              type="text"
              placeholder="e.g. Using a hash map for O(n) lookup..."
              className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all text-white placeholder:text-zinc-700"
              value={userExplanation}
              onChange={(e) => setUserExplanation(e.target.value)}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pb-20">
          <button
            onClick={() => { if (confirm("Exit? Progress won't be saved.")) onBack(); }}
            className="flex-1 py-4 rounded-2xl glass border border-white/10 font-bold hover:text-red-400 transition-all"
          >
            Terminate
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] py-4 rounded-2xl bg-brand-primary text-black font-bold shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Submit for Evaluation
          </button>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (phase === "results" && evaluation) {
    return (
      <SkillResults
        skillName="DSA"
        score={evaluation.score}
        confidence={evaluation.confidence}
        feedback={evaluation.feedback}
        skillDna={evaluation.skill_dna}
        strengths={evaluation.strengths}
        improvements={evaluation.improvements}
        breakdownItems={[
          { label: "Correctness", value: evaluation.correctness, color: "bg-blue-400" },
          { label: "Optimization", value: evaluation.optimization, color: "bg-purple-400" },
          { label: "Code Quality", value: evaluation.code_quality, color: "bg-amber-400" },
          { label: "Explanation", value: evaluation.explanation_score, color: "bg-green-400" },
        ]}
        onBack={onBack}
      />
    );
  }

  return null;
};
