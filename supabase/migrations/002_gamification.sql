-- XP & Level system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reviewed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reset_at DATE DEFAULT CURRENT_DATE;

-- Spaced repetition on fiches
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS next_review DATE DEFAULT CURRENT_DATE;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS ease_factor FLOAT DEFAULT 2.5;

-- XP transactions log
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_xp" ON xp_events FOR ALL USING (auth.uid() = user_id);

-- Function: award XP and auto-level up
CREATE OR REPLACE FUNCTION award_xp(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS void AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Reset daily reviewed count if new day
  UPDATE profiles
  SET daily_reviewed = 0, daily_reset_at = CURRENT_DATE
  WHERE id = p_user_id AND daily_reset_at < CURRENT_DATE;

  -- Award XP
  UPDATE profiles SET xp = xp + p_amount WHERE id = p_user_id
  RETURNING xp INTO new_xp;

  -- Log event
  INSERT INTO xp_events (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);

  -- Compute level (thresholds: 1=0, 2=100, 3=250, 4=500, 5=1000, 6=2000, 7=4000, 8=7000, 9=12000, 10=20000)
  new_level := CASE
    WHEN new_xp >= 20000 THEN 10
    WHEN new_xp >= 12000 THEN 9
    WHEN new_xp >= 7000  THEN 8
    WHEN new_xp >= 4000  THEN 7
    WHEN new_xp >= 2000  THEN 6
    WHEN new_xp >= 1000  THEN 5
    WHEN new_xp >= 500   THEN 4
    WHEN new_xp >= 250   THEN 3
    WHEN new_xp >= 100   THEN 2
    ELSE 1
  END;

  UPDATE profiles SET level = new_level WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  last_active_date DATE;
BEGIN
  SELECT last_active INTO last_active_date FROM profiles WHERE id = p_user_id;

  IF last_active_date IS NULL OR last_active_date < CURRENT_DATE - 1 THEN
    -- Reset streak
    UPDATE profiles SET streak_days = 1, last_active = CURRENT_DATE WHERE id = p_user_id;
  ELSIF last_active_date = CURRENT_DATE - 1 THEN
    -- Increment streak
    UPDATE profiles SET streak_days = streak_days + 1, last_active = CURRENT_DATE WHERE id = p_user_id;
  ELSIF last_active_date = CURRENT_DATE THEN
    -- Already active today, do nothing
    NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: compute next_review date based on spaced repetition
CREATE OR REPLACE FUNCTION compute_next_review(review_count INTEGER)
RETURNS DATE AS $$
BEGIN
  RETURN CURRENT_DATE + CASE
    WHEN review_count = 0 THEN 1
    WHEN review_count = 1 THEN 3
    WHEN review_count = 2 THEN 7
    WHEN review_count = 3 THEN 14
    ELSE 30
  END;
END;
$$ LANGUAGE plpgsql;

-- Update existing fiches to have next_review set
UPDATE fiches SET next_review = CURRENT_DATE WHERE next_review IS NULL;
