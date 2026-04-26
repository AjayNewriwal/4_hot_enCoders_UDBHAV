import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, ArrowLeft, Building, Mail, Award, CheckCircle2, BookmarkPlus, Zap } from "lucide-react";
import { motion } from "motion/react";

interface Profile {
  user_id: string;
  name: string;
  college_id: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
  skill_rating: number;
}

interface Skill {
  skill_name: string;
  score: number;
  level: string;
  verified: boolean;
}

export default function CandidateProfileView({ candidateId, onBack }: { candidateId: string; onBack: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collegeName, setCollegeName] = useState<string>("Unknown College");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*, colleges(name)")
          .eq("user_id", candidateId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) throw new Error("Candidate profile not found");

        setProfile(profileData);
        setCollegeName(profileData.colleges?.name || "Unknown College");

        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("*")
          .eq("user_id", candidateId)
          .order("score", { ascending: false });

        setSkills(skillsData || []);

        // Check if already shortlisted
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: action } = await supabase
            .from("recruiter_actions")
            .select("id")
            .eq("recruiter_id", user.id)
            .eq("candidate_id", candidateId)
            .eq("action_type", "shortlist")
            .maybeSingle();
            
          if (action) setShortlisted(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [candidateId]);

  async function handleShortlist() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("recruiter_actions").upsert({
        recruiter_id: user.id,
        candidate_id: candidateId,
        action_type: "shortlist"
      }, { onConflict: "recruiter_id,candidate_id" });

      setShortlisted(true);
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="glass p-8 rounded-[2.5rem] border border-red-500/20 text-center">
      <p className="text-red-400">{error || "Profile missing."}</p>
      <button onClick={onBack} className="mt-4 text-sm text-zinc-400 hover:text-white">← Back to Search</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-all">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl text-white font-bold shrink-0 shadow-xl border border-white/10">
            {profile.name?.charAt(0) || "U"}
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-4">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {collegeName}</span>
              <span className="flex items-center gap-1.5 text-brand-primary font-bold"><Award className="w-4 h-4" /> {profile.skill_rating} Avg Rating</span>
            </div>
            {profile.bio && <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">{profile.bio}</p>}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            <button 
              onClick={handleShortlist}
              disabled={shortlisted}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                shortlisted 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {shortlisted ? <><CheckCircle2 className="w-4 h-4" /> Shortlisted</> : <><BookmarkPlus className="w-4 h-4" /> Shortlist</>}
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all">
              <Mail className="w-4 h-4" /> Contact
            </button>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-primary" /> Verified Skills
        </h3>
        
        {skills.length === 0 ? (
          <p className="text-sm text-zinc-500">No verified skills yet.</p>
        ) : (
          <div className="grid gap-4">
            {skills.map((skill, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{skill.skill_name}</span>
                    {skill.verified && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 uppercase tracking-wider font-bold">Verified</span>
                    )}
                  </div>
                  <span className={`text-sm font-bold ${
                    skill.score >= 80 ? 'text-green-400' : skill.score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {skill.score}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.score}%` }}
                    className={`h-full ${skill.score >= 80 ? 'bg-green-500' : skill.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
