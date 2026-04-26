-- PART 3: ADD NEW FIELDS
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_type TEXT, -- "student" | "professional"
ADD COLUMN IF NOT EXISTS current_year TEXT,
ADD COLUMN IF NOT EXISTS experience_years INT;

-- PART 1: FIX SUPABASE RLS
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;

-- Allow insert for logged-in user
CREATE POLICY "Allow insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow select own profile
CREATE POLICY "Allow read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow update own profile
CREATE POLICY "Allow update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
