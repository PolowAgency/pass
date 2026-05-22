export const XP_REWARDS = {
  memorize_fiche: 15,
  complete_qcm_perfect: 50,  // >= 80%
  complete_qcm_good: 30,     // >= 60%
  complete_qcm_ok: 15,       // >= 40%
  complete_qcm_bad: 5,       // < 40%
  upload_cours: 25,
} as const

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000]

export const LEVEL_TITLES = [
  'Rookie', 'Débutant', 'Studieux', 'Grinder',
  'Brain', 'Monster', 'Exam Killer', 'Genius', 'Legend', 'Memory God',
]

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXpForNextLevel(xp: number): { current: number; needed: number; pct: number } {
  const level = getLevel(xp)
  if (level >= 10) return { current: xp, needed: xp, pct: 100 }
  const from = LEVEL_THRESHOLDS[level - 1]
  const to = LEVEL_THRESHOLDS[level]
  return { current: xp - from, needed: to - from, pct: Math.round(((xp - from) / (to - from)) * 100) }
}

export const GEMS_REWARDS = {
  complete_qcm_perfect: 5,
  complete_qcm_good:    3,
  complete_qcm_ok:      1,
  daily_goal:           3,
  upload_cours:         2,
} as const

export async function awardGems(
  action: string,
  sourceId?: string,
): Promise<{ gems: number; earned: number } | null> {
  try {
    const res = await fetch('/api/gems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, source_id: sourceId }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Le client envoie UNIQUEMENT l'action — le serveur calcule le montant (sécurité)
export async function awardXP(
  action: string,
  sourceId?: string,
): Promise<{ xp: number; level: number; leveledUp?: boolean; earned?: number } | null> {
  try {
    const res = await fetch('/api/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, source_id: sourceId }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
