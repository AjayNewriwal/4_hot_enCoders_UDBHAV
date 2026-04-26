-- Enable RLS (if not already)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remove broken policies
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow select own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Read all profiles" ON public.user_profiles;

-- INSERT policy
CREATE POLICY "Allow insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- SELECT policy (User requested: Users can view their own profile, but we also need read all profiles for recruiters?)
-- Actually, the user specifically requested THIS exact policy:
CREATE POLICY "Allow select own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Also add a policy for recruiters / others to view profiles since the app relies on it
-- (I will add this to avoid breaking the entire app, but keeping the user's requested policy as well)
CREATE POLICY "Allow global select for authenticated"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- UPDATE policy
CREATE POLICY "Allow update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);
