import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, Compass, AlertCircle, ListChecks, ArrowLeft, ShieldCheck, Zap, Target } from "lucide-react";
import { motion } from "motion/react";

export default function CareerAnalysis({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) throw new Error("No session found. Please log in again.");

      const { data, error } = await supabase.functions.invoke("analyze-career", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;
      
      console.log("Career Data:", data); // DEBUG LOG
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setData(data);
    } catch (err: any) {
      console.error("ANALYSIS_ERROR:", err);
      setError(err.message || "Failed to load career analysis");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[2rem] border border-white/5 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 border border-brand-primary/20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Loading Career Analysis...</h3>
        <p className="text-zinc-500 text-sm">Consulting with our AI career strategist. This takes a few seconds.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 glass rounded-[2rem] border border-red-500/20 bg-red-500/5 text-center max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Unavailable</h3>
        <p className="text-red-400/80 mb-6">{error || "No data received from strategist"}</p>
        <button onClick={onBack} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all text-white">
          Update Profile & Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Edit Profile
      </button>

      {/* Hero Summary */}
      <div className="glass rounded-[3rem] p-10 border border-brand-secondary/30 bg-gradient-to-br from-brand-secondary/5 via-transparent to-brand-primary/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-secondary/10 rounded-2xl border border-brand-secondary/20">
              <Compass className="w-6 h-6 text-brand-secondary" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white leading-tight">Career Strategy</h2>
              <p className="text-brand-secondary font-mono text-[10px] font-bold uppercase tracking-widest mt-1">Status: {data?.interview_readiness || "Evaluating"}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/5">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocol Verified</span>
          </div>
        </div>
        <p className="text-xl text-zinc-300 leading-relaxed font-medium">
          {data?.summary || "No summary provided by the strategist."}
        </p>
      </div>

      {/* Scorecard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data?.scorecard || {}).map(([key, value]: any) => (
          <div key={key} className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.02] text-center">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{key.replace('_', ' ')}</div>
            <div className="text-3xl font-display font-bold text-brand-primary">{value || 0}<span className="text-zinc-600 text-sm">/10</span></div>
            <div className="mt-3 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(value || 0) * 10}%` }}
                className="h-full bg-brand-primary"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Priority Gaps */}
      {data?.priority_gaps && data.priority_gaps.length > 0 && (
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-bold flex items-center gap-3 mb-8 text-white">
            <Target className="w-5 h-5 text-red-500" /> Critical Interview Gaps
          </h3>
          <div className="grid gap-4">
            {data.priority_gaps.map((gap: any, i: number) => (
              <div key={i} className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                gap?.priority === 'Critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter ${
                      gap?.priority === 'Critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {gap?.priority || "Note"}
                    </span>
                    <h4 className="font-bold text-zinc-200">{gap?.gap || "Optimization"}</h4>
                  </div>
                  <p className="text-sm text-zinc-500">{gap?.reason || "Further analysis required."}</p>
                </div>
                <div className="shrink-0 p-2 bg-zinc-900 rounded-xl border border-white/5">
                  <Zap className={`w-4 h-4 ${gap?.priority === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adaptive Roadmap */}
      {data?.roadmap && data.roadmap.length > 0 && (
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
              <ListChecks className="w-6 h-6 text-brand-primary" /> Personalized Execution Plan
            </h3>
          </div>

          <div className="space-y-12 relative">
            <div className="absolute top-0 bottom-0 left-6 w-px bg-white/5" />
            {data.roadmap.map((phase: any, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-16"
              >
                <div className="absolute left-0 w-12 h-12 rounded-2xl bg-zinc-900 border border-brand-primary/30 flex flex-col items-center justify-center z-10">
                  <span className="text-[10px] font-bold text-brand-primary leading-none">{phase?.duration || "N/A"}</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">{phase?.phase || "New Phase"}</h4>
                    <p className="text-brand-primary text-sm font-medium">{phase?.focus || "Focus area"}</p>
                  </div>
                  
                  <div className="grid gap-3">
                    {phase?.tasks?.map((task: string, tIdx: number) => (
                      <div key={tIdx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-primary/10 transition-all flex items-start gap-4 group">
                        <div className="mt-1 w-4 h-4 rounded-full border border-brand-primary/30 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pb-10">
        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em]">Strategy Engine Layer v4.1 • Verified Output</p>
      </div>
    </motion.div>
  );
}
