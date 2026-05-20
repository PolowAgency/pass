'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { awardXP } from '@/lib/xp'

interface Props {
  onClose: () => void
  onXpGained: (amount: number) => void
}

const REWARDS = [
  { xp: 25, label: 'Bonus quotidien', emoji: '⚡', rarity: 'common' },
  { xp: 50, label: 'Bonne surprise !', emoji: '🎯', rarity: 'rare' },
  { xp: 75, label: 'Jackpot du jour', emoji: '🔥', rarity: 'epic' },
  { xp: 100, label: 'Légendaire !', emoji: '👑', rarity: 'legendary' },
]

const RARITY_WEIGHTS = [60, 28, 10, 2] // %

function pickReward() {
  const rand = Math.random() * 100
  let cumul = 0
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    cumul += RARITY_WEIGHTS[i]
    if (rand < cumul) return REWARDS[i]
  }
  return REWARDS[0]
}

const RARITY_COLORS: Record<string, string> = {
  common: '#C8FF00',
  rare: '#3CEFFF',
  epic: '#FF3CAC',
  legendary: '#FFD700',
}

export default function DailyRewardModal({ onClose, onXpGained }: Props) {
  const { colors } = useTheme()
  const [reward] = useState(pickReward)
  const [opened, setOpened] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const rarityColor = RARITY_COLORS[reward.rarity]

  async function claim() {
    if (claimed) return
    setClaimed(true)
    await awardXP('daily_reward')
    onXpGained(reward.xp)
    setTimeout(onClose, 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>

      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 28, padding: '36px 28px', maxWidth: 340, width: '100%', textAlign: 'center' }}>

        <p style={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif', color: colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
          Coffre du jour
        </p>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: colors.text, marginBottom: 28 }}>
          Ta récompense t&apos;attend
        </p>

        {/* Coffre */}
        <motion.button
          onClick={() => { if (!opened) setOpened(true) }}
          whileHover={!opened ? { scale: 1.05 } : {}}
          whileTap={!opened ? { scale: 0.95 } : {}}
          animate={opened ? {} : { y: [0, -6, 0], transition: { repeat: Infinity, duration: 1.8 } }}
          style={{ fontSize: 72, lineHeight: 1, cursor: opened ? 'default' : 'pointer', background: 'none', border: 'none', display: 'block', margin: '0 auto 24px', filter: opened ? `drop-shadow(0 0 20px ${rarityColor})` : 'none', transition: 'filter 0.4s' }}>
          {opened ? reward.emoji : '🎁'}
        </motion.button>

        <AnimatePresence>
          {opened && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 99, background: `${rarityColor}20`, border: `1px solid ${rarityColor}`, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: rarityColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {reward.rarity}
                </span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 48, color: rarityColor, lineHeight: 1 }}>
                +{reward.xp}
              </p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text }}>
                XP • {reward.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!opened ? (
          <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>
            Clique sur le coffre pour l&apos;ouvrir
          </p>
        ) : (
          <motion.button
            onClick={claim}
            disabled={claimed}
            whileHover={!claimed ? { y: -2 } : {}}
            whileTap={!claimed ? { y: 2 } : {}}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: claimed ? colors.surface2 : colors.lime, color: claimed ? colors.muted : colors.limeText, border: 'none', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: claimed ? 'default' : 'pointer', boxShadow: claimed ? 'none' : `0 4px 0 ${colors.limeDark}` }}>
            {claimed ? '✓ Réclamé !' : 'Réclamer'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
