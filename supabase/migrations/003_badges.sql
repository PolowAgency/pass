-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Un user ne voit QUE ses propres badges
CREATE POLICY "own_badges_select" ON badges
  FOR SELECT USING (auth.uid() = user_id);

-- Un user ne peut insérer QUE des badges pour lui-même (corrigé — pas de "true")
CREATE POLICY "own_badges_insert" ON badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permet de retirer un badge en cas de correction
CREATE POLICY "own_badges_delete" ON badges
  FOR DELETE USING (auth.uid() = user_id);

-- Index de performance pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS badges_user_id_idx ON badges(user_id);
CREATE INDEX IF NOT EXISTS badges_awarded_at_idx ON badges(user_id, awarded_at DESC);

-- Onboarding flag sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Limite messages coach (plan gratuit)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_messages_today INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_messages_reset_at DATE DEFAULT CURRENT_DATE;
