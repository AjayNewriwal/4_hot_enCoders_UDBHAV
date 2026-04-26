import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Search, Building, Loader2, Medal, User, ArrowUpRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Leaderboard() {
  const [skill, setSkill] = useState("DSA");
  const [data, setData] = useState<any[]>([]);
  const [collegeName, setCollegeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 500);
    return () => clearTimeout(timer);
  }, [skill]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("get-leaderboard", {
        body: { skill: skill || "DSA" },
        headers: { Authorization: `Bearer ${session.session?.access_token}` }
      });

      if (error) throw error;
      setData(data.rankings || []);
      setCollegeName(data.collegeName || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
    if (rank === 2) return "text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]";
    if (rank === 3) return "text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]";
    return "text-zinc-600";
  };

  const myRank = data.find(d => d.is_current_user);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div>
          <div className="flex items-center gap-2 text-brand-primary text-[10px] font-bold uppercase tracking-widest mb-1">
            <Building className="w-3 h-3" /> {collegeName || "Your Institution"}
          </div>
          <h2 className="text-3xl font-display font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" /> College Leaderboard
          </h2>
          <p className="text-zinc-500 text-sm mt-1">See how you stack up against your peers at {collegeName}.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            placeholder="Search Skill (e.g. DSA)"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="pl-12 pr-4 py-3 bg-zinc-950/50 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-primary/50 w-full sm:w-72"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{skill || "DSA"} Rankings</span>
          </div>
          {myRank && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Your Position: #{myRank.rank}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Student</th>
                <th className="px-8 py-6 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-8 py-6">
                        <div className="h-12 bg-white/5 rounded-2xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((row) => (
                    <motion.tr 
                      key={row.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`group transition-all ${row.is_current_user ? 'bg-brand-primary/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {row.rank <= 3 ? (
                            <Medal className={`w-6 h-6 ${getMedalColor(row.rank)}`} />
                          ) : (
                            <span className="w-6 text-center text-sm font-bold text-zinc-600">{row.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            row.is_current_user ? 'bg-brand-primary/20 border-brand-primary/30' : 'bg-zinc-900 border-white/5'
                          }`}>
                            <User className={`w-5 h-5 ${row.is_current_user ? 'text-brand-primary' : 'text-zinc-500'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 group-hover:text-white transition-colors flex items-center gap-2">
                              {row.username}
                              {row.is_current_user && <span className="text-[10px] bg-brand-primary text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">You</span>}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Verified Peer</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 group-hover:border-brand-primary/30 transition-all">
                          <span className="text-lg font-display font-bold text-brand-primary">{row.score}</span>
                          <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-brand-primary transition-colors" />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <Building className="w-16 h-16 text-zinc-800 mb-6" />
                        <h4 className="text-xl font-bold text-zinc-400">No rankings yet in your college</h4>
                        <p className="text-zinc-600 max-w-sm mx-auto mt-2 text-sm italic">
                          No one in {collegeName || "your college"} has attempted this skill yet. Be the first to claim the top spot!
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
