import { useState, useEffect } from "react";
import type React from "react";
import { supabase } from "../lib/supabase";
import { Briefcase, Building, Code, Folder, Trophy, Activity, AlertTriangle, Loader2, ArrowRight, UserCircle, Calendar, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// InputField component outside to maintain focus
const InputField = ({ icon: Icon, label, placeholder, type = "text", value, name, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all text-white placeholder:text-zinc-700"
    />
  </div>
);

export default function CareerInput({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    role: "",
    company: "",
    skills: "",
    projects: "",
    leetcode: "",
    codeforces: "",
    weakTopics: "",
    userType: "", // "student" | "professional"
    currentYear: "",
    experience: "",
    username: "",
    collegeId: "",
  });
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("colleges").select("*").then(({ data }) => {
      if (data) setColleges(data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function submit() {
    if (!form.role || !form.skills || !form.userType) {
      alert("Please fill in Role, Skills, and User Type.");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error("User not logged in");
      }

      const payload = {
        user_id: userData.user.id,
        role: form.role || null,
        company: form.company || null,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        projects: form.projects ? form.projects.split(",").map(s => s.trim()).filter(Boolean) : [],
        weak_topics: form.weakTopics ? form.weakTopics.split(",").map(s => s.trim()).filter(Boolean) : [],
        leetcode_solved: form.leetcode ? Number(form.leetcode) : null,
        codeforces_rating: form.codeforces ? Number(form.codeforces) : null,
        user_type: form.userType || null,
        current_year: form.userType === "student" ? form.currentYear : null,
        experience_years: form.userType === "professional" ? Number(form.experience) : null,
        username: form.username || null,
        college_id: form.collegeId || null,
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert([payload], { onConflict: "user_id" });

      if (error) {
        console.error(error);
        throw error;
      }

      onDone();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Failed to save profile"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8"
    >
      <div className="glass rounded-[3rem] p-10 border border-brand-primary/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary" />
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-display font-bold mb-2">Career Profile</h2>
          <p className="text-zinc-500 text-sm">Tell AI about your goals and current status for a custom roadmap.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              name="role"
              icon={Briefcase} 
              label="Desired Role" 
              placeholder="e.g. Senior Frontend Engineer" 
              value={form.role}
              onChange={handleChange}
            />
            <InputField 
              name="company"
              icon={Building} 
              label="Target Company" 
              placeholder="e.g. Google, Stripe" 
              value={form.company}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              name="username"
              icon={UserCircle} 
              label="Public Username" 
              placeholder="e.g. tech_titan" 
              value={form.username}
              onChange={handleChange}
            />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Building className="w-3.5 h-3.5" /> My College
              </label>
              <select 
                name="collegeId" 
                value={form.collegeId} 
                onChange={handleChange}
                className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all text-white appearance-none cursor-pointer"
              >
                <option value="">Select College</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PART 4: User Type Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <UserCircle className="w-3.5 h-3.5" /> I am a...
            </label>
            <select 
              name="userType" 
              value={form.userType} 
              onChange={handleChange}
              className="w-full bg-zinc-950/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all text-white appearance-none cursor-pointer"
            >
              <option value="">Select Status</option>
              <option value="student">Student</option>
              <option value="professional">Working Professional</option>
            </select>
          </div>

          {/* PART 7: Conditional Fields */}
          <AnimatePresence mode="wait">
            {form.userType === "student" && (
              <motion.div 
                key="student-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InputField 
                  name="currentYear"
                  icon={GraduationCap} 
                  label="Current Year/Semester" 
                  placeholder="e.g. 3rd Year / 6th Sem" 
                  value={form.currentYear}
                  onChange={handleChange}
                />
              </motion.div>
            )}

            {form.userType === "professional" && (
              <motion.div 
                key="professional-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InputField 
                  name="experience"
                  icon={Calendar} 
                  label="Years of Experience" 
                  type="number"
                  placeholder="e.g. 5" 
                  value={form.experience}
                  onChange={handleChange}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField 
            name="skills"
            icon={Code} 
            label="Current Skills" 
            placeholder="React, TypeScript, Node.js (comma separated)" 
            value={form.skills}
            onChange={handleChange}
          />

          <InputField 
            name="projects"
            icon={Folder} 
            label="Key Projects" 
            placeholder="Portfolio, E-commerce App (comma separated)" 
            value={form.projects}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              name="leetcode"
              icon={Trophy} 
              label="LeetCode Solved" 
              placeholder="e.g. 150 (optional)" 
              value={form.leetcode}
              onChange={handleChange}
            />
            <InputField 
              name="codeforces"
              icon={Activity} 
              label="Codeforces Rating" 
              placeholder="e.g. 1200 (optional)" 
              value={form.codeforces}
              onChange={handleChange}
            />
          </div>

          <InputField 
            name="weakTopics"
            icon={AlertTriangle} 
            label="Weak Topics" 
            placeholder="Dynamic Programming, System Design (comma separated)" 
            value={form.weakTopics}
            onChange={handleChange}
          />

          <button 
            onClick={submit}
            disabled={loading}
            className="w-full mt-8 py-5 rounded-[2rem] bg-brand-primary text-black font-bold shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Generate AI Roadmap
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
