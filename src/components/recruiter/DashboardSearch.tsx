import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Loader2, Award, Building, UserCircle, Zap, BookmarkPlus } from "lucide-react";
import { motion } from "motion/react";

interface Candidate {
  user_id: string;
  name: string;
  college_id: string;
  college_name: string;
  skill_name: string;
  score: number;
  level: string;
  verified: boolean;
}

export default function DashboardSearch({ onViewProfile }: { onViewProfile: (id: string) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState<string>("All");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  
  // Available skills to filter by (could be dynamic, hardcoding common ones for simplicity)
  const skills = ["All", "DSA", "Web Development", "Python", "React", "SQL"];

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recruiter's minimum score preference if we haven't overridden it locally
      let recruiterMinScore = minScoreFilter;
      if (minScoreFilter === 0) {
        const { data: recruiterData } = await supabase
          .from("recruiters")
          .select("min_score")
          .eq("id", user.id)
          .maybeSingle();
        
        if (recruiterData?.min_score) {
          recruiterMinScore = recruiterData.min_score;
          setMinScoreFilter(recruiterMinScore);
        }
      }

      // We need to fetch students with their skills.
      // Since we want the highest score per skill, and supabase JS doesn't do complex JOIN aggregates easily,
      // we'll query user_skills, then join user_profiles to ensure they are students.
      
      let query = supabase
        .from("user_skills")
        .select(`
          user_id,
          skill_name,
          score,
          level,
          verified,
          user_profiles!inner (
            name,
            role,
            college_id,
            colleges ( name )
          )
        `)
        .eq("user_profiles.role", "student")
        .gte("score", recruiterMinScore)
        .order("score", { ascending: false })
        .limit(20); // Performance limit

      if (selectedSkill !== "All") {
        query = query.eq("skill_name", selectedSkill);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const formatted: Candidate[] = (data || []).map((item: any) => ({
        user_id: item.user_id,
        skill_name: item.skill_name,
        score: item.score,
        level: item.level,
        verified: item.verified,
        name: item.user_profiles.name || "Anonymous Student",
        college_id: item.user_profiles.college_id,
        college_name: item.user_profiles.colleges?.name || "Unknown College",
      }));

      // Remove duplicates (highest score per user) if "All" is selected
      const uniqueCandidates = Array.from(new Map(formatted.map(c => [c.user_id, c])).values());

      setCandidates(uniqueCandidates);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [selectedSkill, minScoreFilter]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function handleShortlist(candidateId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Upsert to handle unique constraint gracefully if they click multiple times
      await supabase.from("recruiter_actions").upsert({
        recruiter_id: user.id,
        candidate_id: candidateId,
        action_type: "shortlist"
      }, { onConflict: "recruiter_id,candidate_id" });
      
      // Visual feedback could be added here
    } catch (err) {
      console.error("Shortlist error:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Candidate Search</h2>
          <p className="text-sm text-zinc-500">Discover AI-verified talent matching your criteria.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-zinc-950/50 rounded-2xl px-4 py-3 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white appearance-none"
          >
            {skills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <div className="flex items-center gap-2 bg-zinc-950/50 rounded-2xl px-4 py-3 border border-white/10">
            <span className="text-xs text-zinc-500">Min Score:</span>
            <input 
              type="number" 
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(parseInt(e.target.value) || 0)}
              className="w-12 bg-transparent text-white text-sm font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="glass p-8 rounded-[2.5rem] border border-red-500/20 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass p-16 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center">
          <Search className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white">No candidates found</h3>
          <p className="text-sm text-zinc-500 mt-1">Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((candidate, idx) => (
            <motion.div
              key={`${candidate.user_id}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onViewProfile(candidate.user_id)}
              className="glass p-6 rounded-[2rem] border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                    {candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{candidate.name}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3" /> {candidate.college_name}
                    </p>
                  </div>
                </div>
                {candidate.verified && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Verified
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Top Skill</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{candidate.skill_name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      candidate.score >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      candidate.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {candidate.score}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleShortlist(candidate.user_id, e)}
                  className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-brand-primary/20 hover:text-brand-primary transition-all"
                >
                  <BookmarkPlus className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
