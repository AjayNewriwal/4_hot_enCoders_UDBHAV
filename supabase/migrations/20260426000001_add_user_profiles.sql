CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT,
    target_company TEXT,
    skills TEXT[],
    projects TEXT[],
    leetcode_count INT,
    codeforces_rating INT,
    weak_topics TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);
