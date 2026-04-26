import type React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import {
  User, Star, Flame, Eye, Github, Linkedin, Globe, Share2,
  ShieldCheck, Trophy, Clock, Zap, BookOpen, ChevronRight,
  Award, TrendingUp, Activity, Lock, CheckCircle2, AlertCircle,
  Loader2, Edit3, ExternalLink
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Profile {
  username: string | null;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  skill_rating: number;
  streak: number;
  profile_views: number;
  role: string | null;
  college_id: string | null;
  colleges?: { name: string } | null;
}

interface Skill {
  id: string;
  skill_name: string;
  score: number;
  level: string;
  verified: boolean;
  expires_at: string | null;
}

interface Badge {
  id: string;
  badge_name: string;
  unlocked: boolean;
}

interface RatingPoint {
  week: string;
  rating: number;
}

interface ActivityItem {
  id: string;
  message: string;
  created_at: string;
}

// ── Badge definitions ─────────────────────────────────────────────────────────
const ALL_BADGES = [
  { name: "Week Warrior", icon: "🔥", desc: "7-day streak", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
  { name: "Expert", icon: "⚡", desc: "Score > 90 in any skill", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
  { name: "First Step", icon: "👣", desc: "Complete your first skill", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
  { name: "Profile Pro", icon: "✨", desc: "Complete your profile", color: "from-brand-primary/20 to-blue-500/20 border-brand-primary/30" },
  { name: "Leaderboard Climber", icon: "📈", desc: "Enter the top 10", color: "from-purple-500/20 to-violet-500/20 border-purple-500/30" },
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: "text-green-400 bg-green-400/10 border-green-400/20",
  intermediate: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  advanced: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data }: { data: RatingPoint[] }) {
  const max = Math.max(...data.map(d => d.rating), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.rating / max) * 80}px` }}
            className="w-full rounded-t-lg bg-gradient-to-t from-brand-primary to-brand-secondary min-h-[4px]"
          />
          <span className="text-[8px] text-zinc-600 font-mono truncate w-full text-center">{d.week}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, glow }: { icon: React.ReactNode; label: string; value: string | number; glow?: string }) {
  return (
    <div className={`glass p-5 rounded-2xl border border-white/5 flex flex-col items-center gap-2 text-center hover:border-brand-primary/20 transition-all group ${glow || ""}`}>
      <div className="text-zinc-500 group-hover:text-brand-primary transition-colors">{icon}</div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
    </div>
  );
}

// ── Weekly Challenge (Static) ─────────────────────────────────────────────────
function WeeklyChallenge({ onSolve }: { onSolve: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (7 - end.getDay()));
      end.setHours(23, 59, 59, 0);
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass p-6 rounded-3xl border border-brand-secondary/20 bg-gradient-to-br from-brand-secondary/5 to-transparent">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary mb-1">Weekly Challenge</div>
          <h4 className="text-lg font-bold text-white">Implement LRU Cache</h4>
          <p className="text-sm text-zinc-500 mt-1">Design and implement a data structure for LRU cache. Difficulty: Medium.</p>
        </div>
        <div className="p-2 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 shrink-0">
          <Trophy className="w-5 h-5 text-brand-secondary" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Resets in <span className="text-white font-bold">{timeLeft}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
            <Star className="w-3 h-3" /> +50 pts
          </div>
          <button
            onClick={onSolve}
            className="px-4 py-2 rounded-xl bg-brand-secondary text-black text-xs font-bold hover:opacity-90 transition-all"
          >
            Solve Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GamifiedProfile({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [history, setHistory] = useState<RatingPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [collegeRank, setCollegeRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      setCurrentUserId(user.id);

      // ── SAFE FETCH: limit(1) never throws on 0 or many rows ──
      const { data: profileRows, error: profileFetchError } = await supabase
        .from("user_profiles")
        .select("*, colleges(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (profileFetchError) {
        console.error("Profile fetch error:", profileFetchError);
        throw new Error(profileFetchError.message);
      }

      let profileData = profileRows && profileRows.length > 0 ? profileRows[0] : null;

      // ── AUTO-CREATE profile if none exists (upsert prevents duplicates) ──
      if (!profileData) {
        console.log("No profile found — creating default profile...");
        const defaultProfile = {
          user_id: user.id,
          name: user.user_metadata?.name || "New User",
          username: "user_" + user.id.slice(0, 6),
          bio: null,
          skill_rating: 0,
          streak: 0,
          profile_views: 0,
        };
        const { data: upserted, error: upsertError } = await supabase
          .from("user_profiles")
          .upsert(defaultProfile, { onConflict: "user_id" })
          .select("*, colleges(name)")
          .limit(1);

        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
          // Render with local fallback — don't crash the page
          profileData = { ...defaultProfile, colleges: null } as any;
        } else {
          profileData = upserted && upserted.length > 0 ? upserted[0] : ({ ...defaultProfile, colleges: null } as any);
        }
      }

      setProfile(profileData as Profile);

      // Calculate college rank
      if (profileData?.college_id) {
        const { data: rankers } = await supabase
          .from("user_profiles")
          .select("user_id, skill_rating")
          .eq("college_id", profileData.college_id)
          .order("skill_rating", { ascending: false });
        if (rankers) {
          const rank = rankers.findIndex(r => r.user_id === user.id) + 1;
          setCollegeRank(rank > 0 ? rank : null);
        }
      }

      // Increment profile views (fire and forget)
      supabase.rpc("increment_profile_views", { p_user_id: user.id }).then(() => {});

      // Fetch remaining data in parallel (all safe — return empty arrays on failure)
      const [skillsRes, badgesRes, historyRes, activityRes] = await Promise.all([
        supabase.from("user_skills").select("*").eq("user_id", user.id).order("score", { ascending: false }),
        supabase.from("user_badges").select("*").eq("user_id", user.id),
        supabase.from("rating_history").select("week, rating").eq("user_id", user.id).order("created_at", { ascending: true }).limit(8),
        supabase.from("user_activity").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setSkills((skillsRes.data ?? []) as Skill[]);

      // Merge user badges with ALL_BADGES definitions
      const userBadgeNames = new Set((badgesRes.data ?? []).filter(b => b.unlocked).map((b: any) => b.badge_name));
      const mergedBadges = ALL_BADGES.map(b => ({
        id: b.name,
        badge_name: b.name,
        unlocked: userBadgeNames.has(b.name),
      }));
      setBadges(mergedBadges);

      // Synthesize rating history if none exists
      if (historyRes.data && historyRes.data.length > 0) {
        setHistory(historyRes.data);
      } else {
        const sr = profileData?.skill_rating ?? 0;
        const synthetic = ["Wk1", "Wk2", "Wk3", "Wk4", "Wk5", "Wk6", "Wk7", "Now"].map((w, i) => ({
          week: w,
          rating: Math.max(0, Math.round(sr * (i + 1) / 8))
        }));
        setHistory(synthetic);
      }

      setActivity((activityRes.data ?? []) as ActivityItem[]);
    } catch (e: any) {
      console.error("Profile load error:", e);
      setError(e.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      <p className="text-zinc-500 text-sm font-medium">Loading your profile...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Profile Unavailable</h3>
      <p className="text-zinc-500 text-sm mb-6">{error || "Your profile data could not be loaded."}</p>
    </div>
  );

  const badgeDefs: Record<string, { icon: string; color: string }> = Object.fromEntries(
    ALL_BADGES.map(b => [b.name, { icon: b.icon, color: b.color }])
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6 pb-24">

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <div className="glass rounded-[3rem] p-8 md:p-12 border border-white/5 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-primary/30 to-brand-secondary/30 border border-brand-primary/20 flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-brand-primary" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-display font-bold text-white">{profile.name || profile.username || "Anonymous"}</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                  @{profile.username || "user"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                {profile.role && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 opacity-60" /> {profile.role}
                  </span>
                )}
                {profile.colleges?.name && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 opacity-60" /> {profile.colleges.name}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-xl">{profile.bio}</p>
              )}
              {/* Social Links */}
              <div className="flex flex-wrap gap-3">
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                    <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3 opacity-40" />
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-3 h-3 opacity-40" />
                  </a>
                )}
                {profile.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                    <Globe className="w-3.5 h-3.5" /> Portfolio <ExternalLink className="w-3 h-3 opacity-40" />
                  </a>
                )}
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs text-zinc-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                  <Share2 className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>

            {/* Edit hint */}
            <button
              onClick={() => onNavigate?.("career")}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-white/10 text-xs text-zinc-500 hover:text-white hover:border-white/20 transition-all">
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Star className="w-5 h-5" />} label="Skill Rating" value={profile.skill_rating || 0} />
        <StatCard icon={<Trophy className="w-5 h-5" />} label="College Rank" value={collegeRank ? `#${collegeRank}` : "—"} />
        <StatCard icon={<Flame className="w-5 h-5" />} label="Day Streak" value={`${profile.streak || 0}🔥`} />
        <StatCard icon={<Eye className="w-5 h-5" />} label="Profile Views" value={profile.profile_views || 0} />
      </div>

      {/* ── SKILLS + BADGES ROW ───────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Verified Skills */}
        <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" /> Verified Skills
            </h3>
            <button
              onClick={() => onNavigate?.("add-skills")}
              className="text-[10px] font-bold uppercase text-brand-primary flex items-center gap-1 hover:opacity-80">
              + Verify <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
            {skills.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No verified skills yet
              </div>
            ) : skills.map(skill => (
              <div key={skill.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{skill.skill_name}</span>
                    {skill.verified
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      : <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase ${LEVEL_COLORS[skill.level] || "text-zinc-400 bg-white/5 border-white/10"}`}>
                    {skill.level}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-primary shrink-0">{skill.score}/100</span>
                </div>
                {skill.expires_at && (
                  <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires {new Date(skill.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Achievement Badges
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
            {ALL_BADGES.map(badgeDef => {
              const unlocked = badges.find(b => b.badge_name === badgeDef.name)?.unlocked ?? false;
              return (
                <div key={badgeDef.name}
                  className={`p-4 rounded-2xl border bg-gradient-to-br transition-all ${unlocked ? badgeDef.color : "from-white/[0.02] to-white/[0.01] border-white/5 opacity-40"}`}>
                  <div className="text-2xl mb-2">{badgeDef.icon}</div>
                  <div className="font-bold text-xs text-white mb-0.5">{badgeDef.name}</div>
                  <div className="text-[10px] text-zinc-500">{badgeDef.desc}</div>
                  {unlocked
                    ? <div className="mt-2 text-[10px] text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Unlocked</div>
                    : <div className="mt-2 text-[10px] text-zinc-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RATING HISTORY + ACTIVITY ROW ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Rating History Chart */}
        <div className="glass rounded-[2.5rem] border border-white/5 p-6">
          <h3 className="font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-primary" /> Rating History
          </h3>
          {history.length > 0
            ? <BarChart data={history} />
            : <div className="py-8 text-center text-zinc-500 text-sm">No rating history yet</div>}
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-secondary" /> Recent Activity
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {activity.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No activity yet. Start solving!
              </div>
            ) : activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{a.message}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WEEKLY CHALLENGE ────────────────────────────────────────────────── */}
      <WeeklyChallenge onSolve={() => onNavigate?.("add-skills")} />

    </motion.div>
  );
}
