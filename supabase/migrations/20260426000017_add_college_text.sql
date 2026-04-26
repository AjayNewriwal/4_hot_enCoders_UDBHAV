-- Add 'college' column as plain text to store the dynamic university name from Hipolabs API
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS college TEXT;
