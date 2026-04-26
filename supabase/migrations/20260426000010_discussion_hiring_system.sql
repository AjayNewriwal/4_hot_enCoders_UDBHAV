-- ── DISCUSSION + RECRUITER HIRING SYSTEM ─────────────────────────────────────

-- 1. posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'recruiter')),
  type TEXT NOT NULL CHECK (type IN ('INTERVIEW', 'HIRING', 'TIP')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  skill_tag TEXT,
  company TEXT,
  job_role TEXT,
  min_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- 3. user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'recruiter')),
  company TEXT,
  experience_years INT
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- posts: anyone can read, authenticated users can insert own
CREATE POLICY "Read all posts" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own post" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own post" ON posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own post" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- applications: users manage own, recruiters see own-post applicants
CREATE POLICY "Manage own applications" ON applications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Read applications on own posts" ON applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = applications.post_id AND posts.user_id = auth.uid()));
CREATE POLICY "Recruiter update applications" ON applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = applications.post_id AND posts.user_id = auth.uid()));

-- user_roles: anyone can read, own record only for writes
CREATE POLICY "Read all user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own role" ON user_roles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
