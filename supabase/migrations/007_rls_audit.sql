-- Migration 007 — RLS audit complet
-- Renforce les policies manquantes ou trop permissives

-- ── fiche_images storage bucket ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('fiche-images', 'fiche-images', true, 5242880)
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fiche_images_insert'
  ) THEN
    EXECUTE 'CREATE POLICY fiche_images_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''fiche-images'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fiche_images_select'
  ) THEN
    EXECUTE 'CREATE POLICY fiche_images_select ON storage.objects FOR SELECT USING (bucket_id = ''fiche-images'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fiche_images_delete'
  ) THEN
    EXECUTE 'CREATE POLICY fiche_images_delete ON storage.objects FOR DELETE USING (bucket_id = ''fiche-images'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- ── xp_events : policy déjà présente (migration 002) ─────────────────
-- On renforce : pas de SELECT cross-user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'xp_events' AND policyname = 'own_xp_select'
  ) THEN
    EXECUTE 'CREATE POLICY own_xp_select ON xp_events FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ── rate_limits (nouvelle table pour /api/generate) ───────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action     TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count      INTEGER DEFAULT 1,
  UNIQUE (user_id, action, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'own_rate_limits') THEN
    EXECUTE 'CREATE POLICY own_rate_limits ON rate_limits FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ── Vérification que toutes les tables critiques ont RLS activé ───────
DO $$ BEGIN
  -- S'assure que RLS est actif (idempotent)
  ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cours         ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fiches        ENABLE ROW LEVEL SECURITY;
  ALTER TABLE questions     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE qcm_sessions  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE xp_events     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE badges        ENABLE ROW LEVEL SECURITY;
END $$;

-- ── fiches : ajouter next_review et ease_factor si manquants ─────────
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS next_review DATE;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS ease_factor NUMERIC(4,2) DEFAULT 2.5;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS sm2_repetitions INTEGER DEFAULT 0;

-- ── profiles : colonnes manquantes ───────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_chest_opened_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reviewed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reset_at DATE;
