-- Migration 006 — Images dans les fiches
ALTER TABLE fiches ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Bucket pour les images de fiches (créer manuellement dans Supabase Storage si nécessaire)
-- Nom: fiche-images, public: true, max size: 5MB
