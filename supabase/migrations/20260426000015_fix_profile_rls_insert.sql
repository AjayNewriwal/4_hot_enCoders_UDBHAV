-- ── FIX USER PROFILES RLS FOR SIGNUP ──────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow select own profile" ON user_profiles;
DROP POLICY IF EXISTS "Read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;

-- 1. SELECT Policy (Global read for authenticated users)
-- Required so students can see leaderboards and recruiters can see students
CREATE POLICY "Read all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT Policy
-- Ensure users can only insert their own profile. We check both user_id and id
-- to be completely safe based on how the frontend might send it.
CREATE POLICY "Allow insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- 3. UPDATE Policy
-- Users can only update their own records.
CREATE POLICY "Allow update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);
