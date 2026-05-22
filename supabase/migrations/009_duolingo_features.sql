-- Migration 009 — Fonctionnalités Duolingo : Hearts, Gems, Leagues, Weekly XP

-- profiles — nouvelles colonnes de gameplay
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_hearts INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_heart_refill_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_xp_reset_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_streak_days INTEGER DEFAULT 0;

-- leagues — classement hebdomadaire par ligue
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leagues') THEN
    CREATE TABLE leagues (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      league TEXT NOT NULL DEFAULT 'bronze',
      week_start DATE NOT NULL,
      weekly_xp INTEGER DEFAULT 0,
      rank INTEGER,
      promoted BOOLEAN DEFAULT false,
      demoted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, week_start)
    );
    ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_league ON leagues FOR ALL USING (auth.uid() = user_id);
    -- lecture publique des classements (pour afficher le leaderboard)
    CREATE POLICY read_league ON leagues FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leagues_week_start_idx ON leagues (week_start, weekly_xp DESC);
CREATE INDEX IF NOT EXISTS leagues_user_week_idx ON leagues (user_id, week_start);

-- gem_transactions — historique pour audit et debug
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gem_transactions') THEN
    CREATE TABLE gem_transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE gem_transactions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_gems ON gem_transactions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fonction : perdre un cœur (appelée côté serveur sur mauvaise réponse QCM)
CREATE OR REPLACE FUNCTION lose_heart(p_user_id UUID)
RETURNS TABLE(hearts_left INTEGER, is_dead BOOLEAN) AS $$
DECLARE
  v_hearts INTEGER;
  v_plan TEXT;
BEGIN
  SELECT hearts, plan INTO v_hearts, v_plan FROM profiles WHERE id = p_user_id;
  -- Plan premium : invincible
  IF v_plan IN ('premium', 'exam') THEN
    RETURN QUERY SELECT v_hearts, false;
    RETURN;
  END IF;
  IF v_hearts > 0 THEN
    v_hearts := v_hearts - 1;
    UPDATE profiles SET hearts = v_hearts WHERE id = p_user_id;
  END IF;
  RETURN QUERY SELECT v_hearts, (v_hearts = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : regagner des cœurs (via gems ou refill automatique 4h)
CREATE OR REPLACE FUNCTION refill_heart(p_user_id UUID, p_use_gems BOOLEAN DEFAULT false)
RETURNS TABLE(hearts_left INTEGER, gems_left INTEGER, success BOOLEAN) AS $$
DECLARE
  v_hearts INTEGER;
  v_max_hearts INTEGER;
  v_gems INTEGER;
  v_last_refill TIMESTAMPTZ;
BEGIN
  SELECT hearts, max_hearts, gems, last_heart_refill_at
  INTO v_hearts, v_max_hearts, v_gems, v_last_refill
  FROM profiles WHERE id = p_user_id;

  IF v_hearts >= v_max_hearts THEN
    RETURN QUERY SELECT v_hearts, v_gems, false;
    RETURN;
  END IF;

  IF p_use_gems THEN
    IF v_gems < 10 THEN
      RETURN QUERY SELECT v_hearts, v_gems, false;
      RETURN;
    END IF;
    v_gems := v_gems - 10;
    v_hearts := LEAST(v_hearts + 1, v_max_hearts);
    UPDATE profiles SET hearts = v_hearts, gems = v_gems WHERE id = p_user_id;
    INSERT INTO gem_transactions (user_id, amount, reason) VALUES (p_user_id, -10, 'refill_heart');
  ELSE
    -- Refill auto : 1 cœur toutes les 4h
    IF v_last_refill IS NULL OR NOW() - v_last_refill >= INTERVAL '4 hours' THEN
      v_hearts := LEAST(v_hearts + 1, v_max_hearts);
      UPDATE profiles SET hearts = v_hearts, last_heart_refill_at = NOW() WHERE id = p_user_id;
    ELSE
      RETURN QUERY SELECT v_hearts, v_gems, false;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT v_hearts, v_gems, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction award_xp v3 : étend la v2 avec weekly_xp + max_streak_days
-- Signature identique à la v2 (005_gamification_v2.sql) pour éviter les conflits
DROP FUNCTION IF EXISTS award_xp(uuid, integer, text, text, text);
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_reason      TEXT,
  p_source_type TEXT DEFAULT NULL,
  p_source_id   TEXT DEFAULT NULL
)
RETURNS TABLE(r_xp INTEGER, r_level INTEGER, r_leveled_up BOOLEAN) AS $$
DECLARE
  new_xp        INTEGER;
  new_level     INTEGER;
  old_level     INTEGER;
  v_weekly_reset DATE;
  v_streak      INTEGER;
BEGIN
  -- Anti-double-award
  IF p_source_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM xp_events
      WHERE user_id = p_user_id AND source_type = p_source_type AND source_id = p_source_id
    ) THEN
      SELECT p.xp, p.level INTO new_xp, new_level FROM profiles p WHERE p.id = p_user_id;
      RETURN QUERY SELECT new_xp, new_level, FALSE;
      RETURN;
    END IF;
  END IF;

  -- Reset daily reviewed si nouveau jour
  UPDATE profiles SET daily_reviewed = 0, daily_reset_at = CURRENT_DATE
  WHERE id = p_user_id AND daily_reset_at < CURRENT_DATE;

  SELECT p.level, p.streak_days, p.weekly_xp_reset_at
  INTO old_level, v_streak, v_weekly_reset
  FROM profiles p WHERE p.id = p_user_id;

  -- Weekly XP : reset si nouvelle semaine
  IF v_weekly_reset IS NULL OR date_trunc('week', NOW()::DATE) > v_weekly_reset THEN
    UPDATE profiles SET weekly_xp = p_amount, weekly_xp_reset_at = date_trunc('week', NOW()::DATE)
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET weekly_xp = weekly_xp + p_amount WHERE id = p_user_id;
  END IF;

  -- XP total + max_streak
  UPDATE profiles
  SET xp = profiles.xp + p_amount,
      max_streak_days = GREATEST(max_streak_days, v_streak)
  WHERE id = p_user_id
  RETURNING profiles.xp INTO new_xp;

  -- Log
  INSERT INTO xp_events (user_id, amount, reason, source_type, source_id)
  VALUES (p_user_id, p_amount, p_reason, p_source_type, p_source_id)
  ON CONFLICT (user_id, source_type, source_id) WHERE source_id IS NOT NULL DO NOTHING;

  -- Calcul niveau
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

  UPDATE profiles SET
    level = new_level,
    title = CASE new_level
      WHEN 1 THEN 'Rookie' WHEN 2 THEN 'Débutant' WHEN 3 THEN 'Studieux'
      WHEN 4 THEN 'Grinder' WHEN 5 THEN 'Brain' WHEN 6 THEN 'Monster'
      WHEN 7 THEN 'Exam Killer' WHEN 8 THEN 'Genius' WHEN 9 THEN 'Legend'
      ELSE 'Memory God'
    END
  WHERE id = p_user_id;

  RETURN QUERY SELECT new_xp, new_level, (new_level > old_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : award gems
CREATE OR REPLACE FUNCTION award_gems(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET gems = gems + p_amount WHERE id = p_user_id;
  INSERT INTO gem_transactions (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert league entry pour la semaine courante
CREATE OR REPLACE FUNCTION upsert_league_entry(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_week DATE := date_trunc('week', NOW()::DATE);
  v_weekly_xp INTEGER;
  v_league TEXT;
BEGIN
  SELECT weekly_xp INTO v_weekly_xp FROM profiles WHERE id = p_user_id;

  -- Ligue basée sur XP total (promotion progressive)
  SELECT COALESCE(
    (SELECT league FROM leagues WHERE user_id = p_user_id ORDER BY week_start DESC LIMIT 1),
    'bronze'
  ) INTO v_league;

  INSERT INTO leagues (user_id, league, week_start, weekly_xp)
  VALUES (p_user_id, v_league, v_week, v_weekly_xp)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
