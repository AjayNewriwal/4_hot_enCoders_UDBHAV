import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, BookmarkCheck, Mail, Building, MoreVertical, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface ShortlistCandidate {
  id: string; // recruiter_actions id
  candidate_id: string;
  name: string;
  college_name: string;
  action_type: string;
  created_at: string;
}

export default function ShortlistPage({ onViewProfile }: { onViewProfile: (id: string) => void }) {
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ total: 0, contacted: 0 });

  useEffect(() => {
    loadShortlist();
  }, []);

  async function loadShortlist() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from("recruiter_actions")
        .select(`
          id,
          candidate_id,
          action_type,
          created_at,
          user_profiles!recruiter_actions_candidate_id_fkey (
            name,
            colleges (name)
          )
        `)
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        candidate_id: item.candidate_id,
        action_type: item.action_type,
        created_at: item.created_at,
        name: item.user_profiles?.name || "Unknown Candidate",
        college_name: item.user_profiles?.colleges?.name || "Unknown College",
      }));

      setCandidates(formatted);
      setStats({
        total: formatted.length,
        contacted: formatted.filter(c => c.action_type === 'contacted').length
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function markContacted(actionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await supabase.from("recruiter_actions").update({ action_type: "contacted" }).eq("id", actionId);
      
      // Optimistic update
      setCandidates(prev => prev.map(c => c.id === actionId ? { ...c, action_type: "contacted" } : c));
      setStats(s => ({ ...s, contacted: s.contacted + 1 }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookmarkCheck className="w-6 h-6 text-brand-primary" /> Shortlisted Candidates
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Manage and contact your saved talent.</p>
        </div>

        <div className="flex gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Saved</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-brand-primary">{stats.contacted}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Contacted</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="glass p-8 rounded-[2.5rem] border border-red-500/20 text-center text-red-400">
          {error}
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass p-16 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center">
          <BookmarkCheck className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-white">Your shortlist is empty</h3>
          <p className="text-sm text-zinc-500 mt-1">Go to Discover to find and save candidates.</p>
        </div>
      ) : (
        <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Candidate</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Saved On</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {candidates.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => onViewProfile(c.candidate_id)}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{c.name}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {c.college_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-zinc-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      c.action_type === 'contacted' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {c.action_type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {c.action_type !== 'contacted' && (
                      <button 
                        onClick={(e) => markContacted(c.id, e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 text-xs font-bold transition-all mr-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Contacted
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
