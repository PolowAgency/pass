-- Migration 011 — Leaderboard + Referral system

-- ── Referral ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Génère un code pour les profils existants (8 chars, uppercase)
UPDATE profiles
SET referral_code = UPPER(LEFT(MD5(id::text || 'pass_ref_2024'), 8))
WHERE referral_code IS NULL;

-- Trigger : génère un code automatiquement à la création du profil
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(LEFT(MD5(NEW.id::text || 'pass_ref_2024'), 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Fonction : valider et appliquer un code de parrainage
CREATE OR REPLACE FUNCTION claim_referral(p_user_id UUID, p_code TEXT)
RETURNS TABLE(success BOOLEAN, reason TEXT) AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Déjà parrainé ?
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND referred_by IS NOT NULL) THEN
    RETURN QUERY SELECT false, 'already_referred'::TEXT;
    RETURN;
  END IF;

  -- Code valide ?
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = UPPER(TRIM(p_code)) AND id != p_user_id;

  IF v_referrer_id IS NULL THEN
    RETURN QUERY SELECT false, 'invalid_code'::TEXT;
    RETURN;
  END IF;

  -- Lier
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_user_id;
  UPDATE profiles SET referral_count = referral_count + 1 WHERE id = v_referrer_id;

  -- Récompenses
  PERFORM award_gems(p_user_id,    30, 'referral_reward');
  PERFORM award_gems(v_referrer_id, 30, 'referral_bonus');

  RETURN QUERY SELECT true, 'ok'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Leaderboard ───────────────────────────────────────────────────────────────
-- Retourne le top 50 hebdo + la position du user courant (SECURITY DEFINER = bypass RLS)
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  rank          BIGINT,
  user_id       UUID,
  display_name  TEXT,
  level         INTEGER,
  streak_days   INTEGER,
  weekly_xp     INTEGER,
  is_current    BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.weekly_xp DESC, p.xp DESC) AS rk,
      p.id,
      COALESCE(SPLIT_PART(p.full_name, ' ', 1), 'Étudiant') AS dname,
      p.level,
      p.streak_days,
      p.weekly_xp,
      (p.id = p_user_id) AS is_me
    FROM profiles p
    WHERE p.weekly_xp > 0
  )
  SELECT rk, id, dname, level, streak_days, weekly_xp, is_me
  FROM ranked
  WHERE rk <= 50 OR is_me = true
  ORDER BY rk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
