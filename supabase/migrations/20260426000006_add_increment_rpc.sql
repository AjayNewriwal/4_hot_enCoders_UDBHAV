CREATE OR REPLACE FUNCTION increment_skill_score(
  p_user_id UUID,
  p_skill TEXT,
  p_points INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO skill_scores (user_id, skill, score, updated_at)
  VALUES (p_user_id, p_skill, p_points, NOW())
  ON CONFLICT (user_id, skill)
  DO UPDATE SET 
    score = skill_scores.score + p_points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
