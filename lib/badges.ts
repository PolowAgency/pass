export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface BadgeDef {
  id: string
  name: string
  description: string
  emoji: string
  rarity: BadgeRarity
}

export const BADGES: BadgeDef[] = [
  // Streak
  { id: 'streak_1',    name: 'Premier pas',      description: 'Premier jour de révision',    emoji: '🌱', rarity: 'common' },
  { id: 'streak_3',    name: 'En route',          description: '3 jours de suite',            emoji: '🔥', rarity: 'common' },
  { id: 'streak_7',    name: 'Une semaine',        description: '7 jours de suite',            emoji: '💪', rarity: 'rare' },
  { id: 'streak_30',   name: 'Mois complet',       description: '30 jours de suite',           emoji: '🏆', rarity: 'epic' },
  { id: 'streak_100',  name: 'Inarrêtable',        description: '100 jours de suite',          emoji: '👑', rarity: 'legendary' },

  // Mémorisation
  { id: 'fiches_1',    name: 'Première fiche',     description: 'Première fiche mémorisée',    emoji: '⭐', rarity: 'common' },
  { id: 'fiches_10',   name: 'Décollage',           description: '10 fiches mémorisées',        emoji: '🚀', rarity: 'common' },
  { id: 'fiches_50',   name: 'En orbite',           description: '50 fiches mémorisées',        emoji: '🌍', rarity: 'rare' },
  { id: 'fiches_100',  name: 'Centurion',           description: '100 fiches mémorisées',       emoji: '💯', rarity: 'epic' },
  { id: 'fiches_500',  name: 'Encyclopédie',        description: '500 fiches mémorisées',       emoji: '📖', rarity: 'legendary' },

  // QCM
  { id: 'qcm_first',   name: 'Baptême du feu',      description: 'Premier QCM complété',        emoji: '🎯', rarity: 'common' },
  { id: 'qcm_perfect', name: 'Parfait',              description: 'Score 100% à un QCM',         emoji: '✨', rarity: 'rare' },
  { id: 'qcm_10',      name: 'Quiz master',          description: '10 QCM complétés',            emoji: '🧠', rarity: 'rare' },
  { id: 'qcm_50',      name: 'Machine à QCM',        description: '50 QCM complétés',            emoji: '⚡', rarity: 'epic' },

  // Upload
  { id: 'upload_1',    name: 'Première leçon',      description: 'Premier cours uploadé',       emoji: '📚', rarity: 'common' },
  { id: 'upload_5',    name: 'Bibliothèque',         description: '5 cours uploadés',            emoji: '🗂️', rarity: 'rare' },
  { id: 'upload_10',   name: 'Archives',             description: '10 cours uploadés',           emoji: '🏛️', rarity: 'epic' },

  // XP
  { id: 'xp_100',      name: 'Premier XP',          description: '100 XP gagnés',               emoji: '💫', rarity: 'common' },
  { id: 'xp_1000',     name: 'Entraîné',             description: '1 000 XP gagnés',             emoji: '🌟', rarity: 'rare' },
  { id: 'xp_10000',    name: 'Champion XP',          description: '10 000 XP gagnés',            emoji: '🏅', rarity: 'epic' },

  // Niveaux
  { id: 'level_5',     name: 'Mi-chemin',            description: 'Niveau 5 atteint',            emoji: '🎖️', rarity: 'rare' },
  { id: 'level_10',    name: 'Max level',            description: 'Niveau maximum atteint',      emoji: '🎓', rarity: 'legendary' },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]))

export const RARITY_COLORS: Record<BadgeRarity, { color: string; bg: string; border: string; shadow: string; label: string }> = {
  common:    { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', shadow: '#6B7280', label: 'Commun' },
  rare:      { color: '#3CEFFF', bg: 'rgba(60,239,255,0.1)',  border: 'rgba(60,239,255,0.3)',  shadow: '#0088AA', label: 'Rare' },
  epic:      { color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', shadow: '#7C3AED', label: 'Épique' },
  legendary: { color: '#C8FF00', bg: 'rgba(200,255,0,0.1)',   border: 'rgba(200,255,0,0.3)',   shadow: '#8AAB00', label: 'Légendaire' },
}

export async function checkAndAwardBadges(): Promise<BadgeDef[]> {
  try {
    const res = await fetch('/api/badges', { method: 'POST' })
    if (!res.ok) return []
    const { newBadges } = await res.json()
    return (newBadges ?? []).map((id: string) => BADGE_MAP[id]).filter(Boolean)
  } catch {
    return []
  }
}
