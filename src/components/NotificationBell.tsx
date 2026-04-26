import type React from "react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Bell, Check, CheckCheck, Loader2, Info, Award, Briefcase, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  badge: <Award className="w-4 h-4 text-yellow-400" />,
  hiring: <Briefcase className="w-4 h-4 text-green-400" />,
  warning: <AlertCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifications();
    // Click outside to close
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markOneRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative p-2.5 rounded-xl glass border border-white/10 hover:border-brand-primary/30 transition-all"
      >
        <Bell className="w-5 h-5 text-zinc-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-black text-[9px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute right-0 top-12 w-80 glass rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h4 className="font-bold text-white text-sm">Notifications</h4>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-brand-primary font-bold flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs">All caught up!</p>
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-all hover:bg-white/5 ${!n.read ? "bg-brand-primary/5" : ""}`}
                >
                  <div className="mt-0.5 shrink-0 w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                    {ICON_MAP[n.type] ?? ICON_MAP.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!n.read ? "text-zinc-200" : "text-zinc-500"}`}>{n.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
