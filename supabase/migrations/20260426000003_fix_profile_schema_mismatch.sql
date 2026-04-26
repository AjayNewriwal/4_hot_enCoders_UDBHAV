-- STEP 1: FIX DATABASE SCHEMA
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS projects TEXT[],
ADD COLUMN IF NOT EXISTS weak_topics TEXT[],
ADD COLUMN IF NOT EXISTS leetcode_solved INT,
ADD COLUMN IF NOT EXISTS codeforces_rating INT,
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS current_year TEXT,
ADD COLUMN IF NOT EXISTS experience_years INT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- STEP 2: FIX RLS POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;

CREATE POLICY "Allow insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
