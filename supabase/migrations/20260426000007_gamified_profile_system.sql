-- GAMIFIED PROFILE SYSTEM

-- Extend user_profiles with new columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS github TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS portfolio TEXT,
  ADD COLUMN IF NOT EXISTS skill_rating INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views INT DEFAULT 0;

-- user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  score INT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, skill_name)
);

-- user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_name)
);

-- rating_history table
CREATE TABLE IF NOT EXISTS rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  rating INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- user_skills policies
CREATE POLICY "Own skills full access" ON user_skills FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Read any user skills" ON user_skills FOR SELECT TO authenticated
  USING (true);

-- user_badges policies
CREATE POLICY "Own badges full access" ON user_badges FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Read any user badges" ON user_badges FOR SELECT TO authenticated
  USING (true);

-- rating_history policies
CREATE POLICY "Own rating history full access" ON rating_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_activity policies
CREATE POLICY "Own activity full access" ON user_activity FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
