import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY.trim();

console.log("FINAL URL USED:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "recruiter";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  college: string | null;   // students only
  company: string | null;   // recruiters only
  created_at: string;
}
