CREATE TABLE IF NOT EXISTS user_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);
