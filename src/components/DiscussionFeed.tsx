import type React from "react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Briefcase, Lightbulb, Users, Plus, X, ChevronDown,
  Building, Star, Send, CheckCircle, XCircle, Clock, Loader2,
  AlertCircle, Filter, Award, Tag, Sparkles, UserCheck
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type PostType = "INTERVIEW" | "HIRING" | "TIP";

interface Post {
  id: string;
  user_id: string;
  role: "student" | "recruiter";
  type: PostType;
  title: string;
  content: string;
  skill_tag: string | null;
  company: string | null;
  job_role: string | null;
  min_score: number | null;
  created_at: string;
  user_profiles?: { username: string | null; name: string | null } | null;
}

interface Application {
  id: string;
  post_id: string;
  user_id: string;
  status: "applied" | "shortlisted" | "rejected";
  created_at: string;
  user_profiles?: { username: string | null; name: string | null } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<PostType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  INTERVIEW: { label: "Interview Exp", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  HIRING: { label: "Hiring", icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  TIP: { label: "Tip", icon: <Lightbulb className="w-3.5 h-3.5" />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreatePostModal({
  currentRole, onClose, onCreated
}: {
  currentRole: "student" | "recruiter";
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<PostType>(currentRole === "recruiter" ? "HIRING" : "INTERVIEW");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [skillTag, setSkillTag] = useState("");
  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [minScore, setMinScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes: PostType[] = currentRole === "recruiter"
    ? ["INTERVIEW", "HIRING", "TIP"]
    : ["INTERVIEW", "TIP"];

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const payload: any = {
        user_id: user.id,
        role: currentRole,
        type,
        title: title.trim(),
        content: content.trim(),
        skill_tag: skillTag.trim() || null,
      };

      if (type === "HIRING") {
        payload.company = company.trim() || null;
        payload.job_role = jobRole.trim() || null;
        payload.min_score = minScore ? parseInt(minScore) : null;
      }

      const { error } = await supabase.from("posts").insert(payload);
      if (error) throw error;
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass w-full max-w-lg rounded-[2.5rem] border border-white/10 p-8 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Create Post</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {allowedTypes.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                type === t
                  ? `${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].bg} border-current`
                  : "text-zinc-500 bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <input
          placeholder="Post title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white placeholder:text-zinc-600"
        />
        <textarea
          placeholder="Share your experience, tip, or job details..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none resize-none text-white placeholder:text-zinc-600"
        />
        <input
          placeholder="Skill tag (e.g. DSA, React, System Design)"
          value={skillTag}
          onChange={e => setSkillTag(e.target.value)}
          className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white placeholder:text-zinc-600"
        />

        {type === "HIRING" && (
          <div className="space-y-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Hiring Details</p>
            <input
              placeholder="Company name"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-zinc-950/50 rounded-xl p-3 text-sm border border-white/10 focus:border-green-500/50 focus:outline-none text-white placeholder:text-zinc-600"
            />
            <input
              placeholder="Job role (e.g. Backend Engineer)"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              className="w-full bg-zinc-950/50 rounded-xl p-3 text-sm border border-white/10 focus:border-green-500/50 focus:outline-none text-white placeholder:text-zinc-600"
            />
            <input
              type="number"
              placeholder="Minimum skill score (0–100)"
              value={minScore}
              onChange={e => setMinScore(e.target.value)}
              className="w-full bg-zinc-950/50 rounded-xl p-3 text-sm border border-white/10 focus:border-green-500/50 focus:outline-none text-white placeholder:text-zinc-600"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Posting..." : "Publish Post"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Applicants Panel ──────────────────────────────────────────────────────────
function ApplicantsPanel({ post, onClose }: { post: Post; onClose: () => void }) {
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("applications")
      .select("*, user_profiles(username, name)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplicants((data ?? []) as Application[]);
        setLoading(false);
      });
  }, [post.id]);

  async function updateStatus(appId: string, status: "shortlisted" | "rejected") {
    await supabase.from("applications").update({ status }).eq("id", appId);
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="glass w-full max-w-lg rounded-[2.5rem] border border-white/10 p-8 shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Applicants</h3>
            <p className="text-xs text-zinc-500">{post.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
        ) : applicants.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicants.map(app => (
              <div key={app.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-white">
                    {app.user_profiles?.name || app.user_profiles?.username || "Anonymous"}
                  </div>
                  <div className={`text-[10px] font-bold uppercase mt-1 ${
                    app.status === "shortlisted" ? "text-green-400" :
                    app.status === "rejected" ? "text-red-400" : "text-zinc-500"
                  }`}>{app.status}</div>
                </div>
                {app.status === "applied" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(app.id, "shortlisted")}
                      className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, "rejected")}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
                {app.status !== "applied" && (
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase border ${
                    app.status === "shortlisted"
                      ? "text-green-400 bg-green-500/10 border-green-500/20"
                      : "text-red-400 bg-red-500/10 border-red-500/20"
                  }`}>{app.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  currentRole,
  myScore,
  myApplications,
  onApply,
  onViewApplicants,
}: {
  post: Post;
  currentUserId: string | null;
  currentRole: "student" | "recruiter" | null;
  myScore: number;
  myApplications: Record<string, string>;
  onApply: (postId: string) => Promise<void>;
  onViewApplicants: (post: Post) => void;
}) {
  const isRecruiterPost = post.role === "recruiter";
  const cfg = TYPE_CONFIG[post.type];
  const isOwner = post.user_id === currentUserId;
  const hasApplied = Boolean(myApplications[post.id]);
  const appStatus = myApplications[post.id];
  const isEligible = post.min_score === null || myScore >= (post.min_score ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-[2rem] border p-6 space-y-4 hover:border-white/10 transition-all ${
        isRecruiterPost
          ? "border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent"
          : "border-white/5 bg-white/[0.01]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-lg border flex items-center gap-1 ${cfg.color} ${cfg.bg}`}>
              {cfg.icon} {cfg.label}
            </span>
            {/* Recruiter badge */}
            {isRecruiterPost && (
              <span className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-lg border text-green-400 bg-green-500/10 border-green-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Recruiter{post.company ? ` · ${post.company}` : ""}
              </span>
            )}
            {/* Skill tag */}
            {post.skill_tag && (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/5 bg-white/5">
                <Tag className="w-3 h-3" /> {post.skill_tag}
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-lg leading-tight">{post.title}</h4>
        </div>
        <div className="text-[10px] text-zinc-600 shrink-0 flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
        </div>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">
          {(post.user_profiles?.name || post.user_profiles?.username || "?")[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-zinc-500">
          {post.user_profiles?.name || post.user_profiles?.username || "Anonymous"}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-zinc-400 leading-relaxed">{post.content}</p>

      {/* Hiring Details Card */}
      {post.type === "HIRING" && (
        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/15 space-y-2">
          {post.job_role && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-zinc-300 font-medium">{post.job_role}</span>
              {post.company && <span className="text-zinc-500">at {post.company}</span>}
            </div>
          )}
          {post.min_score !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-zinc-400">Min. Score Required:</span>
              <span className="font-bold text-white">{post.min_score}/100</span>
              {/* Eligibility badge */}
              {currentRole === "student" && (
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase ${
                  isEligible
                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                    : "text-red-400 bg-red-500/10 border-red-500/20"
                }`}>
                  {isEligible ? "✓ Eligible" : "✗ Improve skill"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {/* Student: Apply button */}
        {currentRole === "student" && post.type === "HIRING" && !isOwner && (
          hasApplied ? (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
              appStatus === "shortlisted" ? "text-green-400 bg-green-500/10 border-green-500/20" :
              appStatus === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/20" :
              "text-zinc-400 bg-white/5 border-white/10"
            }`}>
              {appStatus === "shortlisted" ? "🎉 Shortlisted" : appStatus === "rejected" ? "✗ Rejected" : "✓ Applied"}
            </span>
          ) : (
            <button
              onClick={() => onApply(post.id)}
              disabled={!isEligible}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-black text-xs font-bold hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {isEligible ? "Apply Now" : "Not Eligible"}
            </button>
          )
        )}

        {/* Recruiter: view applicants button */}
        {isOwner && post.type === "HIRING" && (
          <button
            onClick={() => onViewApplicants(post)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-xs text-zinc-400 font-bold hover:text-white hover:border-white/20 transition-all"
          >
            <Users className="w-3.5 h-3.5" /> View Applicants
          </button>
        )}

        {/* Non-hiring */}
        {post.type !== "HIRING" && <div />}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DiscussionFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"student" | "recruiter" | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [myApplications, setMyApplications] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<PostType | "ALL">("ALL");
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get role from user_profiles
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("role, skill_rating")
      .eq("user_id", user.id)
      .limit(1);
    const profile = profileData?.[0];
    const role = (profile?.role as "student" | "recruiter") ?? "student";
    setCurrentRole(role);
    setMyScore(profile?.skill_rating ?? 0);

    // Load posts with author info
    const { data: postsData } = await supabase
      .from("posts")
      .select("*, user_profiles(username, name)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((postsData ?? []) as Post[]);

    // Load my applications
    const { data: appsData } = await supabase
      .from("applications")
      .select("post_id, status")
      .eq("user_id", user.id);
    const appMap: Record<string, string> = {};
    (appsData ?? []).forEach(a => { appMap[a.post_id] = a.status; });
    setMyApplications(appMap);

    setLoading(false);
  }

  async function handleApply(postId: string) {
    if (!currentUserId) return;
    setApplyingId(postId);
    try {
      const { error } = await supabase.from("applications").insert({
        post_id: postId,
        user_id: currentUserId,
        status: "applied",
      });
      if (!error) {
        setMyApplications(prev => ({ ...prev, [postId]: "applied" }));
      }
    } finally {
      setApplyingId(null);
    }
  }

  const filtered = filter === "ALL" ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-6 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-brand-primary" /> Community Hub
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Share insights, land jobs, grow together.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Post
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "INTERVIEW", "HIRING", "TIP"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
              filter === f
                ? "bg-brand-primary text-black border-transparent"
                : "glass border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {f === "ALL" ? "All Posts" : TYPE_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center glass rounded-[2rem] border border-white/5">
          <Sparkles className="w-12 h-12 text-zinc-700 mb-4" />
          <h4 className="text-lg font-bold text-zinc-400">No posts yet</h4>
          <p className="text-zinc-600 text-sm mt-1">Be the first to share something great.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(post => (
              <div key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  currentRole={currentRole}
                  myScore={myScore}
                  myApplications={myApplications}
                  onApply={handleApply}
                  onViewApplicants={setViewingPost}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && currentRole && (
          <CreatePostModal
            currentRole={currentRole}
            onClose={() => setShowCreate(false)}
            onCreated={loadAll}
          />
        )}
        {viewingPost && (
          <ApplicantsPanel post={viewingPost} onClose={() => setViewingPost(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
