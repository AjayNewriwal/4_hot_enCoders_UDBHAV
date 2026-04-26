import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Clock, AlertTriangle, CheckCircle2, ChevronRight,
  Loader2, Shield, RefreshCw, Maximize, Minimize
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type QuestionType = "mcq" | "fill";

interface MCQ {
  type: "mcq";
  question: string;
  options: string[];
  correct: string;
}

interface Fill {
  type: "fill";
  question: string;
  answer: string;
}

type Question = MCQ | Fill;

type Phase = "select" | "loading" | "test" | "result";

const SKILLS = ["DSA", "Web Development", "SQL", "System Design", "Python", "JavaScript", "Machine Learning", "React", "Node.js", "OS & Networks"];
const DURATION = 20 * 60; // 20 minutes in seconds

// ── Anti-Cheat Hook ───────────────────────────────────────────────────────────
function useAntiCheat(
  active: boolean,
  onViolation: (count: number, type: string) => void
) {
  const violations = useRef(0);
  const fullscreenExits = useRef(0);

  useEffect(() => {
    if (!active) return;

    const handleVisibility = () => {
      if (document.hidden) {
        violations.current += 1;
        onViolation(violations.current, "tab_switch");
      }
    };

    const handleBlur = () => {
      violations.current += 1;
      onViolation(violations.current, "window_blur");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        fullscreenExits.current += 1;
        violations.current += 1;
        onViolation(violations.current, `fullscreen_exit_${fullscreenExits.current}`);
      }
    };

    const preventCopy = (e: Event) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("contextmenu", preventCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("contextmenu", preventCopy);
    };
  }, [active, onViolation]);

  return violations;
}

// ── Timer Component ───────────────────────────────────────────────────────────
function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const id = setInterval(() => setLeft(l => l - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const mins = Math.floor(left / 60).toString().padStart(2, "0");
  const secs = (left % 60).toString().padStart(2, "0");
  const pct = (left / seconds) * 100;
  const danger = left < 120;

  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border font-mono font-bold text-lg transition-all ${
      danger ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse" : "border-white/10 glass text-white"
    }`}>
      <Clock className="w-5 h-5" />
      {mins}:{secs}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SkillTest({ initialSkill, onClose }: { initialSkill?: string; onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>("select");
  const [skill, setSkill] = useState(initialSkill || "DSA");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenExitsRef = useRef(0);
  const testContainerRef = useRef<HTMLDivElement>(null);

  const handleViolation = useCallback((count: number, type: string) => {
    setViolations(count);
    const msg = type.startsWith("fullscreen_exit")
      ? `⚠️ Fullscreen exited (#${fullscreenExitsRef.current}). ${fullscreenExitsRef.current >= 2 ? "Auto-submitting..." : "Re-enter fullscreen or your score will be penalized."}`
      : type === "window_blur"
      ? `⚠️ Window focus lost (#${count}). Stay on this window.`
      : `⚠️ Tab switch detected (#${count}). Stay focused.`;
    setWarning(msg);
    setTimeout(() => setWarning(null), 5000);

    // 2 fullscreen exits = auto submit
    if (type.startsWith("fullscreen_exit") && fullscreenExitsRef.current >= 2) {
      setTimeout(() => submitTestRef.current?.(), 1500);
    }
  }, []);

  // We need a ref to submitTest to avoid stale closure in handleViolation
  const submitTestRef = useRef<() => void>();

  const violationsRef = useAntiCheat(phase === "test", handleViolation);

  // ── Client-side fallback questions ───────────────────────────────────────────
  function getClientFallback(): Question[] {
    return [
      { type: "mcq", question: `What is the time complexity of binary search?`, options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: "O(log n)" },
      { type: "mcq", question: `Which data structure follows LIFO order?`, options: ["Queue", "Array", "Stack", "Heap"], correct: "Stack" },
      { type: "mcq", question: `Which HTTP status code means "Not Found"?`, options: ["200", "301", "404", "500"], correct: "404" },
      { type: "mcq", question: `What does OOP stand for?`, options: ["Object Oriented Programming", "Open Optional Protocol", "Output Operation Process", "Object Oriented Protocol"], correct: "Object Oriented Programming" },
      { type: "mcq", question: `Which sorting algorithm has O(n log n) average time complexity?`, options: ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"], correct: "Merge Sort" },
      { type: "mcq", question: `What is a primary key in SQL?`, options: ["A unique identifier for a table row", "A foreign reference", "An index only", "A duplicate value"], correct: "A unique identifier for a table row" },
      { type: "mcq", question: `Which operator checks strict equality in JavaScript?`, options: ["==", "=", "===", "!="], correct: "===" },
      { type: "mcq", question: `What does API stand for?`, options: ["Application Programming Interface", "Applied Protocol Integration", "Automated Process Input", "Array Processing Index"], correct: "Application Programming Interface" },
      { type: "mcq", question: `Which data structure is used in BFS traversal?`, options: ["Stack", "Tree", "Queue", "Graph"], correct: "Queue" },
      { type: "mcq", question: `What is the output of 2 ** 10 in Python?`, options: ["20", "1024", "102", "210"], correct: "1024" },
      { type: "fill", question: `The programming concept of hiding internal details is called ________.`, answer: "encapsulation" },
      { type: "fill", question: `A ________ is a function that calls itself.`, answer: "recursive function" },
      { type: "fill", question: `In CSS, the property to make an element invisible but still occupy space is ________.`, answer: "visibility: hidden" },
      { type: "fill", question: `The process of converting a higher-level language to machine code is called ________.`, answer: "compilation" },
      { type: "fill", question: `A database index is used to speed up ________ operations.`, answer: "search" },
    ];
  }

  // Generate questions via Edge Function — NEVER crashes, always returns questions
  async function startTest() {
    setPhase("loading");
    setAiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("generate-dsa-question", {
        body: { skill, mode: "skill-test" },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (error) {
        console.warn("Edge function error, using fallback:", error);
        setQuestions(getClientFallback());
        setAnswers({});
        setCurrent(0);
        setViolations(0);
        setPhase("test");
        return;
      }

      // Try to parse questions from response
      let finalQuestions: Question[] | null = null;

      if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        finalQuestions = data.questions;
      } else {
        // Try extracting JSON from string response
        try {
          const raw = typeof data === "string" ? data : JSON.stringify(data);
          const start = raw.indexOf("{");
          const end = raw.lastIndexOf("}");
          if (start !== -1 && end !== -1) {
            const extracted = JSON.parse(raw.substring(start, end + 1));
            if (extracted?.questions?.length > 0) {
              finalQuestions = extracted.questions;
            }
          }
        } catch (_) {}
      }

      // Use fallback if AI returned nothing valid
      if (!finalQuestions || finalQuestions.length === 0) {
        console.warn("No valid questions from AI — using fallback");
        finalQuestions = getClientFallback();
      }

      setQuestions(finalQuestions.slice(0, 15));
      setAnswers({});
      setCurrent(0);
      setViolations(0);
      setPhase("test");
    } catch (e: any) {
      console.error("SkillTest startTest error:", e);
      // Always start the test — use client fallback
      setQuestions(getClientFallback());
      setAnswers({});
      setCurrent(0);
      setViolations(0);
      setPhase("test");
    }
  }

  function answer(idx: number, val: string) {
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }

  // Keep submitTestRef in sync
  useEffect(() => {
    submitTestRef.current = submitTest;
  });

  // Enter fullscreen when test starts
  useEffect(() => {
    if (phase === "test" && testContainerRef.current) {
      testContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    }
    if (phase !== "test") {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, [phase]);

  async function submitTest() {
    // MCQ: +2pts each, Fill: +3pts each
    let rawScore = 0;
    questions.forEach((q, i) => {
      const given = (answers[i] ?? "").trim().toLowerCase();
      const expected = (q.type === "mcq" ? q.correct : q.answer).trim().toLowerCase();
      if (given === expected) {
        rawScore += q.type === "mcq" ? 2 : 3;
      }
    });

    // Max raw score: 10*2 + 5*3 = 35
    const maxRaw = questions.reduce((s, q) => s + (q.type === "mcq" ? 2 : 3), 0);
    const baseScore = maxRaw > 0 ? Math.round((rawScore / maxRaw) * 100) : 0;

    // Penalty: 5 pts per violation, capped at 30
    const penalty = Math.min(violations * 5, 30);
    const finalScore = Math.max(0, baseScore - penalty);
    setScore(finalScore);

    // Exit fullscreen
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        // skill_scores (new detailed table with cheating_flags)
        supabase.from("skill_scores").insert({
          user_id: user.id,
          skill,
          score: finalScore,
          cheating_flags: violations,
          mode: "ai_test",
        }),
        // user_skills (profile-level aggregate)
        supabase.from("user_skills").upsert({
          user_id: user.id,
          skill_name: skill,
          score: finalScore,
          level: finalScore >= 80 ? "advanced" : finalScore >= 50 ? "intermediate" : "beginner",
          verified: violations === 0,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "user_id,skill_name" }),
      ]);

      // Update profile rating
      const { data: skills } = await supabase.from("user_skills").select("score").eq("user_id", user.id);
      if (skills && skills.length > 0) {
        const avg = Math.round(skills.reduce((s: number, sk: any) => s + sk.score, 0) / skills.length);
        await supabase.from("user_profiles").upsert({ user_id: user.id, skill_rating: avg }, { onConflict: "user_id" });
      }

      await supabase.from("user_activity").insert({
        user_id: user.id,
        message: `Completed ${skill} skill test — Score: ${finalScore}/100${violations > 0 ? ` (${violations} violations)` : ""}`,
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: finalScore >= 80 ? "badge" : "info",
        message: `${skill} test: ${finalScore}/100${penalty > 0 ? ` (−${penalty} penalty for ${violations} violation${violations > 1 ? "s" : ""})` : ""}`,
      });
    }

    setPhase("result");
  }

  const progress = questions.length > 0 ? ((Object.keys(answers).length) / questions.length) * 100 : 0;
  const q = questions[current];

  // ── PHASE: SELECT ─────────────────────────────────────────────────────────
  if (phase === "select") return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-20">
      <div className="glass rounded-[3rem] p-10 border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-5">
            <Zap className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Skill Verification Test</h2>
          <p className="text-zinc-500 text-sm">15 AI-generated questions • 20 minutes • Anti-cheat enabled</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">Select Skill to Test</label>
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map(s => (
                <button
                  key={s}
                  onClick={() => setSkill(s)}
                  className={`p-3 rounded-2xl border text-sm font-bold transition-all ${
                    skill === s
                      ? "border-brand-primary/50 bg-brand-primary/10 text-brand-primary"
                      : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Anti-Cheat Rules</h4>
            <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
              <li>Tab switching is detected and penalizes your score (−5pts each)</li>
              <li>Copy, paste, and right-click are disabled during the test</li>
              <li>Do not leave the window during the test</li>
            </ul>
          </div>

          {aiError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {aiError}
            </div>
          )}

          <button
            onClick={startTest}
            className="w-full py-4 rounded-2xl bg-brand-primary text-black font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:opacity-90 transition-all"
          >
            <Zap className="w-5 h-5" /> Start {skill} Test
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ── PHASE: LOADING ────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
      <h3 className="text-lg font-bold text-white">Generating {skill} Test...</h3>
      <p className="text-zinc-500 text-sm">AI is crafting personalized questions for you</p>
    </div>
  );

  // ── PHASE: RESULT ─────────────────────────────────────────────────────────
  if (phase === "result") return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto pb-20">
      <div className="glass rounded-[3rem] p-10 border border-white/10 text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${
          score >= 80 ? "border-green-500 bg-green-500/10" : score >= 50 ? "border-amber-500 bg-amber-500/10" : "border-red-500 bg-red-500/10"
        }`}>
          <span className={`text-3xl font-display font-black ${score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {score}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {score >= 80 ? "Excellent! 🎉" : score >= 50 ? "Good Job! 👍" : "Keep Practising 💪"}
        </h2>
        <p className="text-zinc-500 text-sm mb-2">{skill} Verification Complete</p>

        {violations > 0 && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            Anti-cheat penalty applied: −{Math.min(violations * 5, 30)} pts ({violations} violation{violations > 1 ? "s" : ""})
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Score", value: `${score}/100` },
            { label: "Level", value: score >= 80 ? "Advanced" : score >= 50 ? "Intermediate" : "Beginner" },
            { label: "Status", value: score >= 50 ? "Verified ✓" : "Not Verified" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-xs text-zinc-500 mb-1">{s.label}</div>
              <div className="font-bold text-sm text-white">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setPhase("select"); setQuestions([]); }}
            className="flex-1 py-3 rounded-2xl glass border border-white/10 text-sm font-bold text-zinc-400 flex items-center justify-center gap-2 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          {onClose && (
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-brand-primary text-black text-sm font-bold">
              Done
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ── PHASE: TEST ───────────────────────────────────────────────────────────
  return (
    <div
      ref={testContainerRef}
      className="fixed inset-0 z-40 bg-zinc-950 flex flex-col select-none"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
            {skill}
          </div>
          <div className="text-xs text-zinc-500">Question {current + 1} / {questions.length}</div>
        </div>
        <Timer seconds={DURATION} onExpire={submitTest} />
        <div className="flex items-center gap-3">
          {violations > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              <AlertTriangle className="w-3 h-3" /> {violations} violation{violations > 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Shield className="w-3.5 h-3.5 text-green-500" /> Anti-cheat active
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-900">
        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-brand-primary" />
      </div>

      {/* Warning banner */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-3 px-5 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> {warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-[2.5rem] p-8 border border-white/5"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-4 flex items-center gap-2">
                {q?.type === "mcq" ? "Multiple Choice" : "Fill in the Blank"}
              </div>
              <h3 className="text-xl font-bold text-white leading-relaxed mb-8">{q?.question}</h3>

              {q?.type === "mcq" && (
                <div className="space-y-3">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => answer(current, opt)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium ${
                        answers[current] === opt
                          ? "border-brand-primary/50 bg-brand-primary/10 text-brand-primary"
                          : "border-white/5 bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-mono text-xs text-zinc-500 mr-3">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q?.type === "fill" && (
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={answers[current] ?? ""}
                  onChange={e => answer(current, e.target.value)}
                  className="w-full bg-zinc-900/50 rounded-2xl p-4 text-sm border border-white/10 focus:border-brand-primary/50 focus:outline-none text-white placeholder:text-zinc-600"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Question mini-map */}
          <div className="flex flex-wrap gap-2 justify-center">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                  i === current ? "border-brand-primary bg-brand-primary/20 text-brand-primary" :
                  answers[i] !== undefined ? "border-green-500/30 bg-green-500/10 text-green-400" :
                  "border-white/5 bg-white/[0.02] text-zinc-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-6 py-5 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-6 py-3 rounded-2xl glass border border-white/10 text-sm font-bold text-zinc-400 disabled:opacity-30 hover:text-white transition-all"
        >
          ← Prev
        </button>

        <div className="text-xs text-zinc-600">
          {Object.keys(answers).length} / {questions.length} answered
        </div>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
            className="px-6 py-3 rounded-2xl bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-zinc-100 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submitTest}
            className="px-6 py-3 rounded-2xl bg-brand-primary text-black text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.3)] hover:opacity-90 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Submit Test
          </button>
        )}
      </div>
    </div>
  );
}
