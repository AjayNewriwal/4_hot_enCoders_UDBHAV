-- Fix RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow select own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;

-- Allow authenticated users to read their own profile
CREATE POLICY "Allow select own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
