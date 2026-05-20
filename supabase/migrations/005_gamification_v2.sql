-- ============================================================
-- MIGRATION 005 — Gamification v2
-- Fixes: daily_reviewed, streak, XP abuse, streak freeze
-- ============================================================

-- 1. Colonnes supplémentaires sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Rookie';

-- 2. XP events: source pour éviter le double-award
ALTER TABLE xp_events ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE xp_events ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Contrainte unique : un source ne peut être récompensé qu'une fois par user
CREATE UNIQUE INDEX IF NOT EXISTS xp_events_unique_source
  ON xp_events (user_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

-- 3. Fonction: increment daily_reviewed de façon atomique (+1 par fiche)
CREATE OR REPLACE FUNCTION increment_daily_reviewed(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Reset si nouveau jour
  UPDATE profiles
    SET daily_reviewed = 0, daily_reset_at = CURRENT_DATE
    WHERE id = p_user_id AND daily_reset_at < CURRENT_DATE;

  -- Incrément atomique de 1
  UPDATE profiles SET daily_reviewed = daily_reviewed + 1 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction: streak uniquement sur activité réelle
--    Remplace update_streak (qui était appelé au chargement de page)
CREATE OR REPLACE FUNCTION update_streak_on_activity(p_user_id UUID)
RETURNS TABLE(streak_days INTEGER, streak_increased BOOLEAN) AS $$
DECLARE
  last_act_date DATE;
  cur_streak    INTEGER;
  v_freeze      INTEGER;
  increased     BOOLEAN := FALSE;
BEGIN
  SELECT
    (last_activity_at AT TIME ZONE 'UTC')::DATE,
    profiles.streak_days,
    streak_freeze_count
  INTO last_act_date, cur_streak, v_freeze
  FROM profiles WHERE id = p_user_id;

  IF last_act_date = CURRENT_DATE THEN
    -- Déjà actif aujourd'hui → juste mettre à jour le timestamp
    UPDATE profiles SET last_activity_at = NOW() WHERE id = p_user_id;

  ELSIF last_act_date = CURRENT_DATE - 1 THEN
    -- Actif hier → incrément du streak
    UPDATE profiles SET
      streak_days      = streak_days + 1,
      last_activity_at = NOW(),
      last_active      = CURRENT_DATE
    WHERE id = p_user_id;
    increased := TRUE;

  ELSIF last_act_date IS NULL OR last_act_date < CURRENT_DATE - 1 THEN
    -- Inactif depuis 2+ jours → vérifie le freeze
    IF v_freeze > 0 AND cur_streak > 0 THEN
      -- Utilise un freeze (préserve le streak, seulement si streak > 0)
      UPDATE profiles SET
        streak_freeze_count = streak_freeze_count - 1,
        last_activity_at    = NOW(),
        last_active         = CURRENT_DATE
      WHERE id = p_user_id;
    ELSE
      -- Pas de freeze ou streak nul → démarre/repart à 1
      UPDATE profiles SET
        streak_days      = 1,
        last_activity_at = NOW(),
        last_active      = CURRENT_DATE
      WHERE id = p_user_id;
    END IF;
    increased := TRUE;
  END IF;

  -- Mise à jour du titre selon le niveau
  UPDATE profiles SET title = CASE level
    WHEN 1  THEN 'Rookie'
    WHEN 2  THEN 'Débutant'
    WHEN 3  THEN 'Studieux'
    WHEN 4  THEN 'Grinder'
    WHEN 5  THEN 'Brain'
    WHEN 6  THEN 'Monster'
    WHEN 7  THEN 'Exam Killer'
    WHEN 8  THEN 'Genius'
    WHEN 9  THEN 'Legend'
    ELSE         'Memory God'
  END
  WHERE id = p_user_id;

  RETURN QUERY SELECT profiles.streak_days, increased FROM profiles WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction: award_xp v2 avec source_id (idempotent si déjà récompensé)
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_reason     TEXT,
  p_source_type TEXT DEFAULT NULL,
  p_source_id   TEXT DEFAULT NULL
)
-- Colonnes préfixées r_ pour éviter l'ambiguïté avec les colonnes SQL
RETURNS TABLE(r_xp INTEGER, r_level INTEGER, r_leveled_up BOOLEAN) AS $$
DECLARE
  new_xp    INTEGER;
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- Anti-double-award: si source_id déjà logué, on skip
  IF p_source_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM xp_events
      WHERE user_id = p_user_id
        AND source_type = p_source_type
        AND source_id   = p_source_id
    ) THEN
      SELECT p.xp, p.level INTO new_xp, new_level
      FROM profiles p WHERE p.id = p_user_id;
      RETURN QUERY SELECT new_xp, new_level, FALSE;
      RETURN;
    END IF;
  END IF;

  -- Reset daily reviewed si nouveau jour
  UPDATE profiles
    SET daily_reviewed = 0, daily_reset_at = CURRENT_DATE
    WHERE id = p_user_id AND daily_reset_at < CURRENT_DATE;

  SELECT p.level INTO old_level FROM profiles p WHERE p.id = p_user_id;

  -- Ajout XP
  UPDATE profiles SET xp = profiles.xp + p_amount WHERE id = p_user_id
  RETURNING profiles.xp INTO new_xp;

  -- Log event (avec source si fourni)
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
      WHEN 1  THEN 'Rookie'
      WHEN 2  THEN 'Débutant'
      WHEN 3  THEN 'Studieux'
      WHEN 4  THEN 'Grinder'
      WHEN 5  THEN 'Brain'
      WHEN 6  THEN 'Monster'
      WHEN 7  THEN 'Exam Killer'
      WHEN 8  THEN 'Genius'
      WHEN 9  THEN 'Legend'
      ELSE         'Memory God'
    END
  WHERE id = p_user_id;

  RETURN QUERY SELECT new_xp, new_level, (new_level > old_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Migrer last_active existant vers last_activity_at
UPDATE profiles
  SET last_activity_at = last_active::TIMESTAMPTZ
  WHERE last_activity_at IS NULL AND last_active IS NOT NULL;

-- 7. Initialiser les titres existants
UPDATE profiles SET title = CASE level
  WHEN 1  THEN 'Rookie'
  WHEN 2  THEN 'Débutant'
  WHEN 3  THEN 'Studieux'
  WHEN 4  THEN 'Grinder'
  WHEN 5  THEN 'Brain'
  WHEN 6  THEN 'Monster'
  WHEN 7  THEN 'Exam Killer'
  WHEN 8  THEN 'Genius'
  WHEN 9  THEN 'Legend'
  ELSE         'Memory God'
END
WHERE title IS NULL OR title = 'Rookie';
