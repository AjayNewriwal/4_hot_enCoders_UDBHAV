import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Search, BookmarkCheck, Settings, LogOut, ChevronRight, UserCircle } from "lucide-react";
import DashboardSearch from "./DashboardSearch";
import ShortlistPage from "./ShortlistPage";
import RecruiterSettings from "./RecruiterSettings";
import CandidateProfileView from "./CandidateProfileView";

type Tab = "search" | "shortlist" | "settings";

export default function RecruiterLayout({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  // When a candidate is selected, we overlay the profile view
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-6rem)] gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 space-y-2 sticky top-24">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">Recruiter Portal</div>
          
          <button
            onClick={() => { setActiveTab("search"); setSelectedCandidate(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "search" && !selectedCandidate
                ? "bg-brand-primary text-black"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Search className="w-5 h-5" /> Discover
          </button>
          
          <button
            onClick={() => { setActiveTab("shortlist"); setSelectedCandidate(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "shortlist" && !selectedCandidate
                ? "bg-brand-primary text-black"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookmarkCheck className="w-5 h-5" /> Shortlist
          </button>

          <button
            onClick={() => { setActiveTab("settings"); setSelectedCandidate(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === "settings" && !selectedCandidate
                ? "bg-brand-primary text-black"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>

          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {selectedCandidate ? (
            <motion.div
              key="candidate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CandidateProfileView
                candidateId={selectedCandidate}
                onBack={() => setSelectedCandidate(null)}
              />
            </motion.div>
          ) : activeTab === "search" ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DashboardSearch onViewProfile={setSelectedCandidate} />
            </motion.div>
          ) : activeTab === "shortlist" ? (
            <motion.div
              key="shortlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ShortlistPage onViewProfile={setSelectedCandidate} />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RecruiterSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
