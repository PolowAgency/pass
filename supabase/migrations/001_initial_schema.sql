-- Profiles (extension auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  uploads_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cours
CREATE TABLE IF NOT EXISTS cours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  exam_date DATE,
  file_url TEXT,
  file_type TEXT,
  raw_content TEXT,
  status TEXT DEFAULT 'processing',
  prep_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiches
CREATE TABLE IF NOT EXISTS fiches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cours_id UUID REFERENCES cours(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  key_concepts TEXT[],
  difficulty TEXT DEFAULT 'medium',
  memorized BOOLEAN DEFAULT false,
  review_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions QCM
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cours_id UUID REFERENCES cours(id) ON DELETE CASCADE,
  fiche_id UUID REFERENCES fiches(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions QCM
CREATE TABLE IF NOT EXISTS qcm_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cours_id UUID REFERENCES cours(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach messages
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_cours" ON cours FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_fiches" ON fiches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_questions" ON questions FOR ALL USING (
  cours_id IN (SELECT id FROM cours WHERE user_id = auth.uid())
);
CREATE POLICY "own_sessions" ON qcm_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_messages" ON coach_messages FOR ALL USING (auth.uid() = user_id);

-- Storage bucket for course files
INSERT INTO storage.buckets (id, name, public) VALUES ('cours-files', 'cours-files', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "user_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cours-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'cours-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "user_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'cours-files' AND auth.uid()::text = (storage.foldername(name))[1]);
