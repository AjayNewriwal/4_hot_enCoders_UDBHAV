import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, Target, AlertTriangle, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

export default function SkillGapAI() {
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setErrorMsg("User not logged in");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "analyze-skill-gap",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (error) {
        setErrorMsg("Failed to load skill analysis");
        console.error(error);
        return;
      }

      setData(data);
    } catch (err: any) {
      setErrorMsg("Failed to load skill analysis");
      console.error(err);
    }
  }

  if (errorMsg) {
    return (
      <div className="p-8 glass rounded-[2rem] border border-red-500/20 bg-red-500/5 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h3>
        <p className="text-red-400/80">{errorMsg}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[2rem] border border-white/5">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold mb-2">AI Analyzing Your Skills...</h3>
        <p className="text-zinc-500 text-sm">Crunching data from your recent attempts.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-secondary/10 rounded-2xl border border-brand-secondary/20">
          <Target className="w-6 h-6 text-brand-secondary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Skill Gap Analysis</h2>
          <p className="text-zinc-400 text-sm">Personalized insights based on your performance data.</p>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
        <p className="text-lg text-zinc-300 leading-relaxed font-medium">
          {data.summary}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
          <h3 className="text-red-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" /> Weak Areas
          </h3>
          <ul className="space-y-3">
            {data.weak_areas?.map((w: string, idx: number) => (
              <li key={idx} className="flex gap-3 text-sm text-zinc-300 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass p-6 rounded-3xl border border-green-500/20 bg-green-500/5">
          <h3 className="text-green-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" /> Strengths
          </h3>
          <ul className="space-y-3">
            {data.strengths?.map((s: string, idx: number) => (
              <li key={idx} className="flex gap-3 text-sm text-zinc-300 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-brand-primary/20 bg-brand-primary/5">
        <h3 className="text-brand-primary font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" /> Recommended Action Plan
        </h3>
        <div className="grid gap-3">
          {data.recommendations?.map((r: string, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-zinc-300 flex items-start gap-3">
              <span className="font-mono text-brand-primary font-bold">{idx + 1}.</span>
              {r}
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5">
        <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4" /> Difficulty Breakdown
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(data.difficulty_analysis || {}).map(([k, v]: any) => (
            <div key={k} className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5">
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                k === 'easy' ? 'text-green-400' : 
                k === 'medium' ? 'text-blue-400' : 'text-amber-400'
              }`}>
                {k}
              </div>
              <p className="text-sm text-zinc-400">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
