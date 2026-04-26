-- STEP 1: Clean duplicate user_profiles rows (keep latest per user_id)
DELETE FROM user_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, created_at DESC NULLS LAST
);

-- STEP 2: Add UNIQUE constraint so duplicates can never happen again
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS unique_user;

ALTER TABLE user_profiles
ADD CONSTRAINT unique_user UNIQUE (user_id);
