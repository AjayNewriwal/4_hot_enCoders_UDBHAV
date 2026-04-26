-- Skill scores table (detailed, with cheating flags)
CREATE TABLE IF NOT EXISTS skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  cheating_flags INT NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'ai_test', -- 'ai_test' | 'github'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own skill_scores" ON skill_scores FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GitHub / Project evaluations
CREATE TABLE IF NOT EXISTS project_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repos JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'Beginner',
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  verdict TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own project_evaluations" ON project_evaluations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
