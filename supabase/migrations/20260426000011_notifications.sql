-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own notifications" ON notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to insert notification helper
CREATE OR REPLACE FUNCTION notify_user(p_user_id UUID, p_type TEXT, p_message TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message) VALUES (p_user_id, p_type, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
