/**
 * SkillResults — Reusable score & feedback display
 *
 * Used by DSAModule and WebDevModule after evaluation completes.
 */

import { motion } from "motion/react";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

interface SkillResultsProps {
  skillName: string;
  score: number;
  confidence: "Low" | "Medium" | "High";
  feedback: string;
  skillDna: string;
  strengths: string[];
  improvements: string[];
  /** Extra breakdown sections (e.g. DSA sub-scores, project list) */
  breakdownItems?: { label: string; value: number; color: string }[];
  onBack: () => void;
}

export const SkillResults = ({
  skillName,
  score,
  confidence,
  feedback,
  skillDna,
  strengths,
  improvements,
  breakdownItems,
  onBack,
}: SkillResultsProps) => {
  const confidenceColor =
    confidence === "High"
      ? "text-green-400 bg-green-400/10 border-green-400/20"
      : confidence === "Medium"
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : "text-red-400 bg-red-400/10 border-red-400/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8"
    >
      <div className="glass rounded-[3rem] p-10 border border-brand-primary/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary" />

        {/* Trophy */}
        <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-8 border border-brand-primary/20">
          <Trophy className="w-12 h-12 text-brand-primary text-glow" />
        </div>

        <h2 className="text-3xl font-display font-bold mb-1 text-center">
          {skillName} — Verified
        </h2>
        <p className="text-zinc-500 text-sm text-center mb-8">{skillDna}</p>

        {/* Confidence badge */}
        <div className="flex justify-center mb-8">
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${confidenceColor}`}
          >
            Confidence: {confidence}
          </span>
        </div>

        {/* Score breakdown */}
        {Array.isArray(breakdownItems) && breakdownItems.length > 0 && (
          <div className="space-y-5 mb-10">
            {breakdownItems.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-zinc-300">{item.label}</span>
                  <span className="font-mono text-white">
                    {item.value}/10
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value * 10}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Final Score */}
        <div className="bg-zinc-950/50 rounded-3xl p-8 border border-white/5 mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">
            Final Score
          </div>
          <div className="text-6xl font-display font-bold text-white text-glow">
            {score.toFixed(1)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">out of 10</div>
        </div>

        {/* Feedback */}
        <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
          <p className="text-sm text-zinc-300 leading-relaxed">{feedback}</p>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="glass rounded-2xl p-5 border border-green-500/10">
            <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
            </h4>
            <ul className="space-y-2">
              {Array.isArray(strengths) && strengths.map((s, i) => (
                <li key={i} className="text-sm text-zinc-400">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-5 border border-amber-500/10">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> To Improve
            </h4>
            <ul className="space-y-2">
              {Array.isArray(improvements) && improvements.map((imp, i) => (
                <li key={i} className="text-sm text-zinc-400">
                  • {imp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full py-5 rounded-[2rem] bg-white text-black font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-5 h-5" />
          Back to Skills
        </button>
      </div>
    </motion.div>
  );
};
