/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Target, 
  Trophy, 
  UserCircle, 
  Briefcase, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  BarChart3,
  Search,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  LogIn,
  LayoutDashboard,
  LogOut,
  Bell,
  Settings as SettingsIcon,
  User,
  MessageSquare,
  PlusCircle,
  Star,
  Activity,
  Award,
  Plus,
  Clock,
  Code,
  FileText,
  CheckCheck,
  XCircle,
  ChevronLeft,
  GraduationCap,
  Compass,
  Loader2
} from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { supabase, type UserRole } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { SkillCards } from "./components/SkillCards";
import { DSAModule } from "./components/DSAModule";
import { WebDevModule } from "./components/WebDevModule";
import SkillTest from "./components/SkillTest";
import GitHubEvaluator from "./components/GitHubEvaluator";
import CareerInput from "./components/CareerInput";
import CareerAnalysis from "./components/CareerAnalysis";
import Leaderboard from "./components/Leaderboard";
import GamifiedProfile from "./components/GamifiedProfile";
import DiscussionFeed from "./components/DiscussionFeed";
import Settings from "./components/Settings";
import NotificationBell from "./components/NotificationBell";
import RecruiterLayout from "./components/recruiter/RecruiterLayout";
import type { SkillType } from "./lib/skillConfig";

// --- Types ---
type Page = "landing" | "login" | "signup" | "student-dashboard" | "recruiter-dashboard";

// --- Components ---

const Navbar = ({ onNavigate, currentPage }: { onNavigate: (page: Page) => void, currentPage: Page }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => onNavigate("landing")}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          VeriSkill
        </span>
      </div>
      
      {currentPage === "landing" && (
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How it works</a>
          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
          <a href="#pricing" className="hover:text-brand-primary transition-colors">Enterprise</a>
        </div>
      )}

      {currentPage !== "student-dashboard" && currentPage !== "recruiter-dashboard" ? (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("login")}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => onNavigate("signup")}
            className="px-5 py-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-sm font-semibold hover:bg-brand-primary hover:text-black transition-all"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={async () => { await supabase.auth.signOut(); onNavigate("landing"); }}
            className="p-2 rounded-xl glass text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </nav>
);

const AuthPage = ({ mode, onNavigate, initialRole = "student" }: { mode: "login" | "signup", onNavigate: (page: Page) => void, initialRole?: UserRole, key?: string }) => {
  type AuthField = "name" | "email" | "password" | "college" | "company";
  type FieldErrors = Partial<Record<AuthField, string>>;

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // College Autocomplete State
  const [collegeQuery, setCollegeQuery] = useState("");
  const [collegeResults, setCollegeResults] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [isSearchingCollege, setIsSearchingCollege] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collegeQuery || selectedCollege === collegeQuery) {
      setCollegeResults([]);
      setShowCollegeDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingCollege(true);
      setShowCollegeDropdown(true);
      try {
        const res = await fetch(`http://universities.hipolabs.com/search?country=India&name=${encodeURIComponent(collegeQuery)}`);
        const data = await res.json();
        const unique = Array.from(new Set(data.map((item: any) => item.name))).slice(0, 10) as string[];
        setCollegeResults(unique);
      } catch (err) {
        console.error("College search failed", err);
        setCollegeResults([]);
      } finally {
        setIsSearchingCollege(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [collegeQuery, selectedCollege]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<AuthField, boolean>>>({});

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (mode === "signup" && !name.trim()) {
      errors.name = "Full name is required.";
    }

    if (!normalizedEmail) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (mode === "signup" && password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (mode === "signup" && role === "student" && !selectedCollege) {
      errors.college = "College / University is required for students.";
    }

    if (mode === "signup" && role === "recruiter" && !company.trim()) {
      errors.company = "Company is required for recruiters.";
    }

    return errors;
  };

  const fieldErrors = useMemo(() => validateForm(), [mode, role, name, email, password, selectedCollege, company]);
  const formIsValid = Object.keys(fieldErrors).length === 0;
  const shouldShowFieldError = (field: AuthField) => Boolean(touchedFields[field] && fieldErrors[field]);
  const getInputClassName = (field: AuthField) =>
    `w-full bg-white/[0.03] p-4 pl-12 rounded-2xl focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all text-white placeholder:text-zinc-600 ${
      shouldShowFieldError(field) ? "border border-red-500/50" : "border border-white/10"
    }`;
  const touchField = (field: AuthField) => setTouchedFields((prev) => ({ ...prev, [field]: true }));

  useEffect(() => {
    if (mode !== "signup") return;
    setRole(initialRole);
    if (initialRole === "student") {
      setCompany("");
    } else {
      setCollegeQuery("");
      setSelectedCollege("");
    }
  }, [initialRole, mode]);

  // Clears the field that belongs to the OTHER role so it
  // can never leak into the submit payload.
  const handleRoleChange = (r: UserRole) => {
    setRole(r);
    if (r === "student") {
      setCompany("");
    } else {
      setCollegeQuery("");
      setSelectedCollege("");
    }
    setError(null);
    setSuccessMessage(null);
    setTouchedFields((prev) => ({ ...prev, college: false, company: false }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    setTouchedFields({
      name: mode === "signup",
      email: true,
      password: true,
      college: mode === "signup" && role === "student",
      company: mode === "signup" && role === "recruiter",
    });
    if (!formIsValid) {
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        // 1. Create auth user
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              company
            }
          }
        });
        if (signUpError) throw signUpError;

        // Strictly fetch user object per requirements
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("Signup successful, but failed to retrieve session for profile creation.");
        }
        
        const user = userData.user;

        // 2. Insert profile row
        const profileData = {
          id: user.id, // Mandatory requirement
          user_id: user.id, // Keeping schema compat
          username: name,
          name: name,
          role,
          college: role === "student" ? selectedCollege : null,
          target_company: role === "recruiter" ? company : null,
        };

        console.log("Attempting to insert profile payload:", profileData);

        let { error: profileError } = await supabase.from("user_profiles").insert(profileData);
        
        // Fallback retry if the first insert fails
        if (profileError) {
          console.warn("Profile insert failed. Retrying in 1s...", profileError);
          console.warn("auth.uid() at failure:", user.id);
          
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const retryRes = await supabase.from("user_profiles").insert(profileData);
          profileError = retryRes.error;
        }

        if (profileError) {
          console.error("Final Profile Insert Error:", profileError);
          throw new Error("Profile creation failed: " + profileError.message);
        }

        setSuccessMessage("Account created successfully. Redirecting to your dashboard...");

        // 3. Route based on role
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onNavigate(role === "student" ? "student-dashboard" : "recruiter-dashboard");
      } else {
        // Login
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;

        // Fetch profile to determine role
        const { data: profileRows, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (profileError) throw profileError;
        const profile = profileRows?.[0];
        onNavigate(profile?.role === "student" ? "student-dashboard" : "recruiter-dashboard");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6 mesh-gradient"
    >
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-zinc-500 text-sm">
            {mode === "login" ? "Enter your credentials to access your profile" : "Join the global protocol for skill verification"}
          </p>
        </div>

        <div className="space-y-4">

          {/* Role selector — signup only */}
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {(["student", "recruiter"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-sm transition-all ${
                      role === r
                        ? "bg-brand-primary/10 border-brand-primary/50 text-brand-primary"
                        : "bg-white/[0.02] border-white/10 text-zinc-500 hover:bg-white/5"
                    }`}
                  >
                    {r === "student"
                      ? <><GraduationCap className="w-4 h-4" /> Student</>
                      : <><Briefcase className="w-4 h-4" /> Recruiter</>
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name — signup only */}
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  onBlur={() => touchField("name")}
                  className={getInputClassName("name")}
                />
              </div>
              {shouldShowFieldError("name") && (
                <p className="text-xs text-red-400 px-1">{fieldErrors.name}</p>
              )}
            </div>
          )}

          {/*
            ONE stable block for the contextual field (college or company).
            The containing div is always in the DOM so the email / password
            fields below never jump position when role switches.
            key={role} on the <input> forces a clean remount (resets cursor
            position and autocomplete state) without layout shift.
          */}
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                {role === "student" ? "College / University" : "Company"}
              </label>
              <div className="relative group">
                {role === "student" ? (
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="Search your college..."
                      value={collegeQuery}
                      onChange={(e) => {
                        setCollegeQuery(e.target.value);
                        if (selectedCollege) setSelectedCollege("");
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      onFocus={() => {
                        if (collegeResults.length > 0 || collegeQuery) setShowCollegeDropdown(true);
                      }}
                      onBlur={() => {
                        touchField("college");
                        setTimeout(() => setShowCollegeDropdown(false), 200);
                      }}
                      className={getInputClassName("college")}
                    />
                    {showCollegeDropdown && collegeQuery && !selectedCollege && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto">
                        {isSearchingCollege ? (
                          <div className="p-4 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                            Searching...
                          </div>
                        ) : collegeResults.length === 0 ? (
                          <div className="p-4 text-center text-sm text-zinc-500">No colleges found</div>
                        ) : (
                          collegeResults.map((collegeName, idx) => (
                            <div
                              key={idx}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCollegeQuery(collegeName);
                                setSelectedCollege(collegeName);
                                setShowCollegeDropdown(false);
                              }}
                              className="px-4 py-3 text-sm text-zinc-300 hover:bg-brand-primary/20 hover:text-white cursor-pointer transition-colors"
                            >
                              {collegeName}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
                    <input
                      key={role}
                      type="text"
                      placeholder="e.g. Google"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      onBlur={() => touchField("company")}
                      className={getInputClassName("company")}
                    />
                  </>
                )}
              </div>
              {role === "student" && shouldShowFieldError("college") && (
                <p className="text-xs text-red-400 px-1">{fieldErrors.college}</p>
              )}
              {role === "recruiter" && shouldShowFieldError("company") && (
                <p className="text-xs text-red-400 px-1">{fieldErrors.company}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                onBlur={() => touchField("email")}
                className={getInputClassName("email")}
              />
            </div>
            {shouldShowFieldError("email") && (
              <p className="text-xs text-red-400 px-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                onBlur={() => touchField("password")}
                className={getInputClassName("password")}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {shouldShowFieldError("password") && (
              <p className="text-xs text-red-400 px-1">{fieldErrors.password}</p>
            )}
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-xs font-medium text-brand-primary hover:underline">Forgot password?</button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {successMessage}
            </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !formIsValid}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 mt-4 shadow-lg active:shadow-inner transition-all hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="w-5 h-5" />
            ) : null}
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </motion.button>
        </div>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          {mode === "login" ? "Don't have an account?" : "Already verified?"}{" "}
          <button 
            type="button"
            onClick={() => onNavigate(mode === "login" ? "signup" : "login")}
            className="text-brand-primary font-bold hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

// ── Add Skills Tab — routes between skill cards and individual modules ────────
const AddSkillsTab = ({ onBackToDashboard }: { onBackToDashboard: () => void }) => {
  const [activeSkill, setActiveSkill] = useState<SkillType | null>(null);

  const handleBack = () => setActiveSkill(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {activeSkill === null && (
        <SkillCards onSelectSkill={(id) => setActiveSkill(id)} />
      )}
      {activeSkill === "dsa" && <DSAModule onBack={handleBack} />}
      {activeSkill === "webdev" && <WebDevModule onBack={handleBack} />}
    </motion.div>
  );
};

// ── Student Dashboard ──────────────
const Dashboard = ({ onBackToLanding }: { onBackToLanding?: () => void }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("name, username")
        .eq("user_id", user.id)
        .limit(1);
      const profile = data?.[0];
      setUserName(profile?.name || profile?.username || user.email?.split("@")[0] || "");
    }
    loadUser();
  }, []);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { name: "Add Skills", icon: PlusCircle, key: "add-skills" },
    { name: "Skill Test", icon: Zap, key: "skill-test" },
    { name: "Leaderboard", icon: Trophy, key: "leaderboard" },
    { name: "Career Path", icon: Compass, key: "career" },
    { name: "Profile", icon: User, key: "profile" },
    { name: "Discussions", icon: MessageSquare, key: "discussions" },
  ];

  // ── CareerTab: auto-detects profile existence, never uses .single() ──────────
  function CareerTab() {
    const [status, setStatus] = useState<"loading" | "input" | "analysis">("loading");

    useEffect(() => {
      async function check() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setStatus("input"); return; }

        const { data } = await supabase
          .from("user_profiles")
          .select("id, role")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        // If profile has a career role field, go to analysis; else show input form
        const profile = data?.[0];
        setStatus(profile?.role ? "analysis" : "input");
      }
      check();
    }, []);

    if (status === "loading") return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );

    return (
      <div className="space-y-8">
        {status === "input" ? (
          <CareerInput onDone={() => setStatus("analysis")} />
        ) : (
          <CareerAnalysis onBack={() => setStatus("input")} />
        )}
      </div>
    );
  }

  const stats = [
    { label: "Verified Skills", value: "12", icon: CheckCircle2, color: "text-brand-primary", glow: "shadow-[0_0_15px_rgba(0,242,255,0.2)]" },
    { label: "Average Score", value: "88.4", icon: Award, color: "text-brand-secondary", glow: "shadow-[0_0_15px_rgba(112,0,255,0.2)]" },
    { label: "Trust Score", value: "99.2%", icon: ShieldCheck, color: "text-green-400", glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto"
    >
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass rounded-[2rem] p-4 border border-white/10 sticky top-28">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-medium ${
                    activeTab === item.key 
                      ? "bg-brand-primary/10 text-brand-primary shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === "settings"
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow space-y-8">
          {activeTab === "dashboard" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Top Welcome Card */}
              <div className="relative glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 overflow-hidden bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                      Welcome back, {userName || "Warrior"}.
                    </h2>
                    <p className="text-zinc-400 max-w-md">Track your verified skills, climb the leaderboard, and land your dream role.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab("skill-test")}
                    className="px-8 py-4 rounded-2xl bg-brand-primary text-black font-bold flex items-center gap-2 shadow-[0_0_25px_rgba(0,242,255,0.4)]"
                  >
                    <Zap className="w-5 h-5" />
                    Start Skill Test
                  </motion.button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -5 }}
                    className={`glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 ${stat.glow}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-3xl font-display font-bold">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Leaderboard Preview */}
                <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard Rank
                    </h3>
                    <button onClick={() => setActiveTab("Leaderboard")} className="text-sm font-bold text-brand-primary hover:underline">View All</button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { name: "You (Alex R.)", rank: "42", score: "842", active: true },
                      { name: "Sarah Chen", rank: "41", score: "845", active: false },
                      { name: "Marcus Webb", rank: "43", score: "839", active: false },
                    ].sort((a, b) => parseInt(a.rank) - parseInt(b.rank)).map((player) => (
                      <div 
                        key={player.name}
                        className={`flex items-center justify-between p-4 rounded-2xl border ${
                          player.active ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                            player.rank === "42" ? "bg-brand-primary text-black" : "bg-zinc-800 text-zinc-500"
                          }`}>
                            {player.rank}
                          </span>
                          <span className={`font-bold ${player.active ? "text-white" : "text-zinc-400"}`}>
                            {player.name}
                          </span>
                        </div>
                        <span className="font-mono text-brand-primary font-bold">{player.score}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-4 rounded-2xl bg-zinc-950/50 border border-white/5 text-center">
                    <p className="text-xs text-zinc-500">You are <span className="text-white font-bold">128 points</span> away from Tier 1 status.</p>
                  </div>
                </div>

                {/* Skill Gap Analysis Preview */}
                <div className="glass rounded-[2rem] p-8 border border-white/5 bg-gradient-to-tr from-brand-secondary/5 to-transparent">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Target className="w-5 h-5 text-brand-secondary" /> Skill Gap Analysis
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest bg-zinc-900 px-2 py-1 rounded">Target: Senior Architect</span>
                  </div>

                  <div className="space-y-6">
                    {[
                      { skill: "GraphQL", current: 40, target: 85, color: "bg-pink-500" },
                      { skill: "Kubernetes", current: 20, target: 70, color: "bg-blue-500" },
                      { skill: "System Design", current: 65, target: 90, color: "bg-brand-secondary" },
                    ].map((item) => (
                      <div key={item.skill} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold flex items-center gap-2">
                            {item.skill} 
                            {item.current < 30 && <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                          </span>
                          <span className="text-zinc-500 font-mono">{item.current}% / {item.target}%</span>
                        </div>
                        <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
                          {/* Target marker */}
                          <div className="absolute top-0 bottom-0 border-l border-white/20 z-10" style={{ left: `${item.target}%` }} />
                          
                          {/* Current progress */}
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.current}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full ${item.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => setActiveTab("Skill Gap")} className="w-full mt-8 py-3 rounded-xl glass border border-white/10 text-xs font-bold hover:bg-white/5 transition-all text-zinc-400">
                    Explore Learning Paths
                  </button>
                </div>
              </div>

              {/* Recent Activity / Verified Skills */}
              <div className="glass rounded-[2rem] p-8 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Verified Expertise</h3>
                  <PlusCircle onClick={() => setActiveTab("Add Skills")} className="w-6 h-6 text-brand-primary cursor-pointer hover:rotate-90 transition-transform" />
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  {[
                    { name: "React Architecture", level: "Expert", score: "98", date: "Oct 24" },
                    { name: "Cloud Infra (AWS)", level: "Advanced", score: "78", date: "Oct 18" },
                    { name: "Node.js Performance", level: "Expert", score: "94", date: "Oct 12" },
                    { name: "UI/UX Engineering", level: "Intermediate", score: "62", date: "Sep 28" }
                  ].map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-primary/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-500 group-hover:text-brand-primary group-hover:scale-110 transition-all">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm">{skill.name}</h5>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{skill.level}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white mb-0.5">{skill.score}/100</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest">{skill.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "add-skills" && (
            <AddSkillsTab onBackToDashboard={() => setActiveTab("dashboard")} />
          )}

          {activeTab === "career" && (
            <CareerTab />
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard />
          )}

          {activeTab === "profile" && (
            <GamifiedProfile onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === "discussions" && (
            <DiscussionFeed />
          )}

          {activeTab === "settings" && (
            <Settings />
          )}

          {activeTab === "skill-test" && (
            <SkillTest onClose={() => setActiveTab("dashboard")} />
          )}

          {activeTab !== "dashboard" && activeTab !== "add-skills" && activeTab !== "career" && activeTab !== "leaderboard" && activeTab !== "profile" && activeTab !== "discussions" && activeTab !== "settings" && activeTab !== "skill-test" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{activeTab} section is under development</h3>
              <p className="text-zinc-500 max-w-sm">The protocol is currently expanding its verification layers. Check back soon for this module.</p>
              <button 
                onClick={() => setActiveTab("dashboard")}
                className="mt-8 px-6 py-3 rounded-2xl glass border border-white/5 text-sm font-bold hover:text-brand-primary"
              >
                Back to Overview
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Hero = ({ onNavigate, onSignupWithRole }: { onNavigate: (page: Page) => void, onSignupWithRole: (role: UserRole) => void }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden mesh-gradient">
      {}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-secondary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        style={{ opacity, scale }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            Next-Gen Employability Protocol
          </span>
        </motion.div>

        <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]">
          Stop claiming skills.<br />
          <span className="bg-gradient-to-r from-brand-primary via-white to-brand-secondary bg-clip-text text-transparent text-glow">
            Start proving them.
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          The first verification layer for the global workforce. Build an immutable 
          proof-of-skill profile that top recruiters actually trust.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSignupWithRole("student")}
            className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <UserCircle className="w-5 h-5" />
            I&apos;m an Employee
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSignupWithRole("recruiter")}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass border border-white/10 font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
          >
            <Briefcase className="w-5 h-5 text-brand-primary" />
            I&apos;m a Recruiter
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-20 relative w-full max-w-5xl aspect-video glass rounded-3xl overflow-hidden shadow-2xl p-4"
      >
        <div className="w-full h-full bg-zinc-950/50 rounded-2xl flex items-center justify-center border border-white/5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
              <Zap className="text-brand-primary w-8 h-8" />
            </div>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Dashboard Preview</p>
          </div>
        </div>
        
        {/* Decorative dots for glassmorphism look */}
        <div className="absolute top-8 left-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/40" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
          <div className="w-2 h-2 rounded-full bg-green-500/40" />
        </div>
      </motion.div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      title: "Verify Identity",
      desc: "Connect your professional accounts and undergo biometrics for a secure baseline.",
      icon: ShieldCheck,
      color: "text-blue-400"
    },
    {
      title: "Live Assessment",
      desc: "Complete production-grade challenges monitored by AI to validate your actual expertise.",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      title: "Immutable Credential",
      desc: "Receive a cryptographically signed VeriSkill score shared across our global network.",
      icon: Trophy,
      color: "text-purple-400"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">How it works</h2>
        <p className="text-zinc-500 max-w-xl">From registration to verification in less than 48 hours. Secure, unbiased, and objective.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group p-8 rounded-3xl glass border border-white/5 hover:border-brand-primary/20 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}>
              <step.icon className={`w-6 h-6 ${step.color}`} />
            </div>
            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">The Ecosystem</h2>
            <p className="text-zinc-500 max-w-xl">Tools designed for both growth and discovery. No more CV filtering nightmares.</p>
          </div>
          <button className="flex items-center gap-2 text-brand-primary font-semibold hover:gap-3 transition-all">
            View All Features <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-12 gap-6 h-full md:h-[600px]">
          {/* Skill Verification - Large Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-8 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[2.5rem] p-10 border border-white/5 flex flex-col justify-between overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-primary/5 blur-[80px] -mr-40 -mt-40 pointer-events-none" />
            <div>
              <div className="p-3 bg-brand-primary/10 rounded-2xl w-fit mb-6 border border-brand-primary/20">
                <ShieldCheck className="text-brand-primary w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Deep Skill Verification</h3>
              <p className="text-zinc-400 max-w-md">Our protocol uses AI-proctored live environments to ensure that candidate performance is genuine and reproducible.</p>
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              {["Full-Stack Dev", "Cloud Architecture", "Data Science"].map(tag => (
                <span key={tag} className="px-4 py-2 rounded-full glass text-xs font-mono text-brand-primary flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Skill Gap Analysis */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="flex-1 glass rounded-[2.5rem] p-8 border border-white/5"
            >
              <div className="p-3 bg-brand-secondary/10 rounded-2xl w-fit mb-4 border border-brand-secondary/20">
                <BarChart3 className="text-brand-secondary w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gap Analysis</h3>
              <p className="text-zinc-500 text-sm">Adaptive learning paths that bridge your current skill levels to industry standards.</p>
            </motion.div>

            {/* Global Leaderboard */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="flex-1 bg-white/[0.03] rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-400/10 rounded-2xl w-fit border border-amber-400/20">
                  <Trophy className="text-amber-400 w-6 h-6" />
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">+12k</div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Elite Alpha</h3>
                <p className="text-zinc-500 text-sm">Join the top 1% of verified professionals globally.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
      <div className="max-w-xs">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-primary to-brand-secondary rounded flex items-center justify-center">
            <ShieldCheck className="text-white w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg">VeriSkill</span>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          Decentralizing talent verification for the modern economy. Proof is everything.
        </p>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center cursor-pointer hover:bg-white/10">
            <Search className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center cursor-pointer hover:bg-white/10">
            <Target className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
        <div>
          <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
          <ul className="space-y-4 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-brand-primary">Protocol</a></li>
            <li><a href="#" className="hover:text-brand-primary">Assessments</a></li>
            <li><a href="#" className="hover:text-brand-primary">Credential API</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
          <ul className="space-y-4 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-brand-primary">Documentation</a></li>
            <li><a href="#" className="hover:text-brand-primary">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-brand-primary">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-zinc-600 text-xs text-center">
        © 2026 VeriSkill Protocol. All rights reserved. Built for the era of meritocracy.
      </p>
      <div className="flex items-center gap-6">
        <span className="text-[10px] text-zinc-600 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> System Online
        </span>
      </div>
    </div>
  </footer>
);

export default function App() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [signupRole, setSignupRole] = useState<UserRole>("student");

  // Restore session: if already logged in, send to correct dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      const target = profile.role === "recruiter" ? "recruiter-dashboard" : "student-dashboard";
      // Only redirect if currently on a public page (avoid redirect loops)
      if (currentPage === "landing" || currentPage === "login" || currentPage === "signup") {
        setCurrentPage(target);
      }
    }
  }, [loading, user, profile]);

  const handleNavigate = (page: Page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "signup") {
      setSignupRole("student");
    }
    setCurrentPage(page);
  };

  const handleSignupWithRole = (role: UserRole) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSignupRole(role);
    setCurrentPage("signup");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleNavigate("landing");
  };

  // Full-screen loading spinner while Supabase checks the session
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-brand-primary/30 scroll-smooth">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      <AnimatePresence mode="wait">
        {currentPage === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero onNavigate={handleNavigate} onSignupWithRole={handleSignupWithRole} />
            <HowItWorks />
            <Features />
            <Footer />
          </motion.div>
        )}

        {currentPage === "login" && (
          <AuthPage key="login" mode="login" onNavigate={handleNavigate} />
        )}

        {currentPage === "signup" && (
          <AuthPage key="signup" mode="signup" onNavigate={handleNavigate} initialRole={signupRole} />
        )}

        {currentPage === "student-dashboard" && (
          <Dashboard onBackToLanding={handleLogout} />
        )}

        {currentPage === "recruiter-dashboard" && (
          <motion.div key="recruiter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24 px-6 max-w-7xl mx-auto">
            <RecruiterLayout onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

