'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface Reward { xp: number; label: string; emoji: string; rarity: string }
interface Props { onClose: () => void; onXpGained: (amount: number) => void }

const RARITY_COLORS: Record<string, string> = {
  common: '#C8FF00', rare: '#3CEFFF', epic: '#FF3CAC', legendary: '#FFD700',
}

export default function DailyRewardModal({ onClose, onXpGained }: Props) {
  const { colors } = useTheme()
  const [reward, setReward] = useState<Reward | null>(null)
  const [opened, setOpened] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rarityColor = reward ? RARITY_COLORS[reward.rarity] : '#C8FF00'

  async function openChest() {
    if (opened) return
    setOpened(true)
    try {
      const res = await fetch('/api/chest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); setOpened(false); return }
      setReward(data.reward)
    } catch { setError('Erreur réseau'); setOpened(false) }
  }

  async function claim() {
    if (claimed || !reward) return
    setClaimed(true)
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
          onClick={openChest}
          whileHover={!opened ? { scale: 1.05 } : {}}
          whileTap={!opened ? { scale: 0.95 } : {}}
          animate={opened ? {} : { y: [0, -6, 0], transition: { repeat: Infinity, duration: 1.8 } }}
          style={{ fontSize: 72, lineHeight: 1, cursor: opened ? 'default' : 'pointer', background: 'none', border: 'none', display: 'block', margin: '0 auto 24px', filter: reward ? `drop-shadow(0 0 20px ${rarityColor})` : 'none', transition: 'filter 0.4s' }}>
          {reward ? reward.emoji : '🎁'}
        </motion.button>

        {error && <p style={{ fontSize: 13, color: '#f87171', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>}

        <AnimatePresence>
          {reward && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 99, background: `${rarityColor}20`, border: `1px solid ${rarityColor}`, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: rarityColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {reward.rarity}
                </span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 48, color: rarityColor, lineHeight: 1 }}>+{reward.xp}</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text }}>XP • {reward.label}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!opened ? (
          <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Clique sur le coffre pour l&apos;ouvrir</p>
        ) : reward ? (
          <motion.button onClick={claim} disabled={claimed} whileHover={!claimed ? { y: -2 } : {}} whileTap={!claimed ? { y: 2 } : {}}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: claimed ? colors.surface2 : colors.lime, color: claimed ? colors.muted : colors.limeText, border: 'none', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: claimed ? 'default' : 'pointer', boxShadow: claimed ? 'none' : `0 4px 0 ${colors.limeDark}` }}>
            {claimed ? '✓ Réclamé !' : 'Réclamer'}
          </motion.button>
        ) : (
          <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Ouverture…</p>
        )}
      </motion.div>
    </motion.div>
  )
}
