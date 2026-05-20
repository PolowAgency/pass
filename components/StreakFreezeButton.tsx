'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { awardXP } from '@/lib/xp'

interface Props {
  freezeCount: number
  xp: number
  userId: string
  onUpdate: (newFreezeCount: number, newXp: number) => void
}

const FREEZE_COST = 50

export default function StreakFreezeButton({ freezeCount, xp, userId, onUpdate }: Props) {
  const { colors } = useTheme()
  const [showTooltip, setShowTooltip] = useState(false)
  const [buying, setBuying] = useState(false)

  async function buyFreeze() {
    if (xp < FREEZE_COST || buying) return
    setBuying(true)
    const supabase = createClient()
    // Déduire XP et ajouter 1 freeze
    await supabase.from('profiles').update({
      xp: xp - FREEZE_COST,
      streak_freeze_count: freezeCount + 1,
    }).eq('id', userId)
    onUpdate(freezeCount + 1, xp - FREEZE_COST)
    setBuying(false)
    setShowTooltip(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setShowTooltip(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 99,
          background: freezeCount > 0 ? 'rgba(60,239,255,0.1)' : colors.surface2,
          border: `2px solid ${freezeCount > 0 ? '#3CEFFF' : colors.border}`,
          cursor: 'pointer', boxShadow: `0 2px 0 ${freezeCount > 0 ? '#0088AA' : colors.border2}`,
        }}>
        <span style={{ fontSize: 14 }}>{freezeCount > 0 ? '🛡️' : '💔'}</span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
          color: freezeCount > 0 ? '#3CEFFF' : colors.muted }}>
          {freezeCount}
        </span>
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            style={{
              position: 'absolute', top: 44, right: 0, zIndex: 100,
              background: colors.surface, border: `2px solid ${colors.border}`,
              borderRadius: 16, padding: '16px', width: 220,
              boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
            }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.text, marginBottom: 4 }}>
              🛡️ Streak Freeze
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 1.5 }}>
              {freezeCount > 0
                ? `Tu as ${freezeCount} freeze${freezeCount > 1 ? 's' : ''}. Il s'active automatiquement si tu rates un jour.`
                : 'Tu n\'as plus de freeze. Achètes-en un pour protéger ton streak.'}
            </p>
            {freezeCount < 3 && (
              <motion.button
                onClick={buyFreeze}
                disabled={xp < FREEZE_COST || buying}
                whileHover={xp >= FREEZE_COST ? { y: -1 } : {}}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: xp >= FREEZE_COST ? colors.lime : colors.surface2,
                  color: xp >= FREEZE_COST ? colors.limeText : colors.muted,
                  border: 'none', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13,
                  cursor: xp >= FREEZE_COST ? 'pointer' : 'not-allowed',
                  boxShadow: xp >= FREEZE_COST ? `0 3px 0 ${colors.limeDark}` : 'none',
                }}>
                {buying ? 'Achat...' : xp >= FREEZE_COST ? `Acheter — ${FREEZE_COST} XP` : `${FREEZE_COST} XP requis`}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
