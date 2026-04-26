-- 1. DATABASE DESIGN
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Profiles (extend existing)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id),
ADD COLUMN IF NOT EXISTS username TEXT;

-- Skills leaderboard (1 skill per entry)
CREATE TABLE IF NOT EXISTS skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  skill TEXT NOT NULL,
  score INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. RLS POLICIES
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;

-- Colleges: Everyone can read
CREATE POLICY "Everyone can read colleges" ON colleges FOR SELECT TO authenticated USING (true);

-- Skill Scores: Users can insert/update their own scores
CREATE POLICY "Users can manage own scores" ON skill_scores
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Skill Scores: Everyone can read leaderboard
CREATE POLICY "Everyone can read scores" ON skill_scores FOR SELECT TO authenticated USING (true);

-- 3. Mock Data (Colleges)
INSERT INTO colleges (name) VALUES 
('IIT Bombay'), ('IIT Delhi'), ('BITS Pilani'), ('OIST Bhopal'), ('NIT Trichy')
ON CONFLICT (name) DO NOTHING;
