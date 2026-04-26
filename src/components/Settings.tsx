import type React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { User, Building, GraduationCap, Save, Loader2, CheckCircle2, AlertCircle, Link, Github, Linkedin, Globe, Edit3 } from "lucide-react";

interface ProfileData {
  username: string;
  name: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
  role: string;
  college_id: string;
}

interface College {
  id: string;
  name: string;
}

export default function Settings() {
  const [form, setForm] = useState<ProfileData>({
    username: "", name: "", bio: "", github: "", linkedin: "", portfolio: "", role: "", college_id: "",
  });
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setEmail(user.email ?? "");

    const [profileRes, collegesRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("colleges").select("id, name").order("name"),
    ]);

    const profile = profileRes.data?.[0];
    if (profile) {
      setForm({
        username: profile.username ?? "",
        name: profile.name ?? "",
        bio: profile.bio ?? "",
        github: profile.github ?? "",
        linkedin: profile.linkedin ?? "",
        portfolio: profile.portfolio ?? "",
        role: profile.role ?? "student",
        college_id: profile.college_id ?? "",
      });
    }
    setColleges((collegesRes.data ?? []) as College[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        username: form.username.trim() || null,
        name: form.name.trim() || null,
        bio: form.bio.trim() || null,
        github: form.github.trim() || null,
        linkedin: form.linkedin.trim() || null,
        portfolio: form.portfolio.trim() || null,
        role: form.role || "student",
        college_id: form.college_id || null,
      }, { onConflict: "user_id" });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  const inputClass = "w-full bg-zinc-950/50 rounded-2xl px-4 py-3.5 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white placeholder:text-zinc-600 transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
          <Edit3 className="w-6 h-6 text-brand-primary" /> Account Settings
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Update your public profile and preferences.</p>
      </div>

      {/* Account Info */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4 text-brand-primary" /> Account Info
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Email (read-only)</label>
            <input value={email} readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Username</label>
              <input name="username" value={form.username} onChange={handleChange} placeholder="@handle" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="A short description about yourself..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Role & College */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-secondary" /> Role & Institution
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">I am a...</label>
            <select name="role" value={form.role} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="student">Student</option>
              <option value="recruiter">Recruiter / Professional</option>
            </select>
          </div>
          {form.role === "student" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">College / University</label>
              <select name="college_id" value={form.college_id} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="">Select College</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            <Link className="w-4 h-4 text-amber-400" /> Social Links
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { name: "github", icon: <Github className="w-4 h-4" />, placeholder: "https://github.com/yourhandle" },
            { name: "linkedin", icon: <Linkedin className="w-4 h-4" />, placeholder: "https://linkedin.com/in/yourhandle" },
            { name: "portfolio", icon: <Globe className="w-4 h-4" />, placeholder: "https://yourportfolio.dev" },
          ].map(({ name, icon, placeholder }) => (
            <div key={name}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2 flex items-center gap-1.5">
                {icon} {name.charAt(0).toUpperCase() + name.slice(1)}
              </label>
              <input
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
          saved
            ? "bg-green-500 text-white"
            : "bg-white text-black hover:bg-zinc-100"
        } disabled:opacity-60`}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </motion.div>
  );
}
