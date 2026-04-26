-- ── RECRUITER INTERFACE ────────────────────────────────────────────────────────

-- 1. recruiters table (stores recruiter preferences)
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  hiring_skills TEXT[] DEFAULT '{}',
  min_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. recruiter_actions table (shortlisting/contacting candidates)
CREATE TABLE IF NOT EXISTS recruiter_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('shortlist', 'contacted', 'hired', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recruiter_id, candidate_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_actions ENABLE ROW LEVEL SECURITY;

-- recruiters: read/write own record
CREATE POLICY "Manage own recruiter profile" ON recruiters FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- recruiter_actions: manage own actions
CREATE POLICY "Manage own recruiter actions" ON recruiter_actions FOR ALL TO authenticated
  USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);

-- Ensure user_profiles are readable by recruiters (and everyone authenticated)
-- Note: A policy "Allow select own profile" or similar might exist. We ensure global read for authenticated:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Read all profiles'
  ) THEN
    CREATE POLICY "Read all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Ensure user_skills are readable globally for the dashboard search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_skills' AND policyname = 'Read all skills'
  ) THEN
    CREATE POLICY "Read all skills" ON user_skills FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
