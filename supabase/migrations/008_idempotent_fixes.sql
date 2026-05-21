-- Migration 008 — Rendre toutes les colonnes et index idempotents
-- Protège contre les ré-exécutions accidentelles

-- profiles — colonnes manquantes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reviewed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reset_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_chest_opened_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Rookie';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_messages_today INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_messages_reset_at TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS uploads_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reminder_time TEXT DEFAULT '20:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_streak_alert BOOLEAN DEFAULT TRUE;

-- fiches — colonnes manquantes
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS next_review DATE;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS ease_factor NUMERIC(4,2) DEFAULT 2.5;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS sm2_repetitions INTEGER DEFAULT 0;
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS image_url TEXT;

-- xp_events — colonnes manquantes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xp_events') THEN
    CREATE TABLE xp_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      source_type TEXT,
      source_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_xp ON xp_events FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE xp_events ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE xp_events ADD COLUMN IF NOT EXISTS source_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_unique_source
  ON xp_events (user_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

-- badges — idempotent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
    CREATE TABLE badges (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, badge_id)
    );
    ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_badges ON badges FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- S'assurer que tous les triggers nécessaires existent
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, onboarding_completed)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
