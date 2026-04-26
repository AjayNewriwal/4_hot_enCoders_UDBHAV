import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Save, Building, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function RecruiterSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [companyName, setCompanyName] = useState("");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try to fetch existing recruiter settings
        const { data, error } = await supabase
          .from("recruiters")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setCompanyName(data.company_name || "");
          setMinScore(data.min_score || 0);
        } else {
          // Create default record if it doesn't exist
          await supabase.from("recruiters").insert({ id: user.id });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: "Failed to load settings." });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("recruiters")
        .upsert({
          id: user.id,
          company_name: companyName,
          min_score: minScore
        });

      if (error) throw error;
      setMessage({ type: 'success', text: "Settings saved successfully." });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-brand-secondary/5 to-transparent mb-6">
        <h2 className="text-2xl font-bold text-white">Recruiter Preferences</h2>
        <p className="text-sm text-zinc-500 mt-1">Configure your company profile and candidate filtering criteria.</p>
      </div>

      <form onSubmit={handleSave} className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-primary" /> Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Google, Microsoft, Startup Inc."
            className="w-full bg-zinc-950/50 rounded-2xl px-4 py-3 border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white placeholder:text-zinc-600 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-primary" /> Minimum Candidate Score
          </label>
          <p className="text-xs text-zinc-500 mb-2">Candidates below this score will be hidden from your default search results.</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value))}
              className="flex-1 accent-brand-primary h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-16 px-3 py-2 bg-zinc-950 rounded-xl border border-white/10 text-center font-bold text-white">
              {minScore}
            </div>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-bold border ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <div className="pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-black font-bold hover:bg-brand-primary/90 transition-all w-full md:w-auto"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Preferences</>}
          </button>
        </div>
      </form>
    </div>
  );
}
