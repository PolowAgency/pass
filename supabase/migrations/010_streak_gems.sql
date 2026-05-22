-- Migration 010 — Gems sur milestones de streak + achat streak freeze

-- update_streak_on_activity v2 : award gems aux milestones 7j / 30j
CREATE OR REPLACE FUNCTION update_streak_on_activity(p_user_id UUID)
RETURNS TABLE(streak_days INTEGER, streak_increased BOOLEAN) AS $$
DECLARE
  last_act_date DATE;
  cur_streak    INTEGER;
  new_streak    INTEGER;
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
    UPDATE profiles SET last_activity_at = NOW() WHERE id = p_user_id;

  ELSIF last_act_date = CURRENT_DATE - 1 THEN
    UPDATE profiles SET
      streak_days      = streak_days + 1,
      last_activity_at = NOW(),
      last_active      = CURRENT_DATE,
      max_streak_days  = GREATEST(max_streak_days, streak_days + 1)
    WHERE id = p_user_id;
    increased := TRUE;

  ELSIF last_act_date IS NULL OR last_act_date < CURRENT_DATE - 1 THEN
    IF v_freeze > 0 AND cur_streak > 0 THEN
      UPDATE profiles SET
        streak_freeze_count = streak_freeze_count - 1,
        last_activity_at    = NOW(),
        last_active         = CURRENT_DATE
      WHERE id = p_user_id;
    ELSE
      UPDATE profiles SET
        streak_days      = 1,
        last_activity_at = NOW(),
        last_active      = CURRENT_DATE
      WHERE id = p_user_id;
    END IF;
    increased := TRUE;
  END IF;

  -- Titre selon niveau
  UPDATE profiles SET title = CASE level
    WHEN 1 THEN 'Rookie' WHEN 2 THEN 'Débutant' WHEN 3 THEN 'Studieux'
    WHEN 4 THEN 'Grinder' WHEN 5 THEN 'Brain' WHEN 6 THEN 'Monster'
    WHEN 7 THEN 'Exam Killer' WHEN 8 THEN 'Genius' WHEN 9 THEN 'Legend'
    ELSE 'Memory God'
  END WHERE id = p_user_id;

  -- Gems aux milestones (seulement quand le streak vient d'augmenter)
  IF increased THEN
    SELECT profiles.streak_days INTO new_streak FROM profiles WHERE id = p_user_id;
    IF new_streak = 7 THEN
      PERFORM award_gems(p_user_id, 10, 'streak_7');
    ELSIF new_streak = 30 THEN
      PERFORM award_gems(p_user_id, 30, 'streak_30');
    ELSIF new_streak = 100 THEN
      PERFORM award_gems(p_user_id, 100, 'streak_100');
    ELSIF new_streak % 30 = 0 AND new_streak > 30 THEN
      -- Tous les 30j après le premier mois : 15 gems
      PERFORM award_gems(p_user_id, 15, 'streak_' || new_streak);
    END IF;
  END IF;

  RETURN QUERY SELECT profiles.streak_days, increased FROM profiles WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Achat streak freeze via gems
CREATE OR REPLACE FUNCTION buy_streak_freeze(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, gems_left INTEGER, freezes INTEGER, reason TEXT) AS $$
DECLARE
  v_gems    INTEGER;
  v_freezes INTEGER;
  v_cost    CONSTANT INTEGER := 15;
  v_max     CONSTANT INTEGER := 5;
BEGIN
  SELECT gems, streak_freeze_count INTO v_gems, v_freezes
  FROM profiles WHERE id = p_user_id;

  IF v_freezes >= v_max THEN
    RETURN QUERY SELECT false, v_gems, v_freezes, 'max_freezes'::TEXT;
    RETURN;
  END IF;

  IF v_gems < v_cost THEN
    RETURN QUERY SELECT false, v_gems, v_freezes, 'not_enough_gems'::TEXT;
    RETURN;
  END IF;

  UPDATE profiles
  SET gems = gems - v_cost,
      streak_freeze_count = streak_freeze_count + 1
  WHERE id = p_user_id;

  INSERT INTO gem_transactions (user_id, amount, reason)
  VALUES (p_user_id, -v_cost, 'buy_streak_freeze');

  SELECT gems, streak_freeze_count INTO v_gems, v_freezes
  FROM profiles WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_gems, v_freezes, 'ok'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
