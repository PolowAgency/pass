'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { BadgeDef, RARITY_COLORS } from '@/lib/badges'

interface Props { badges: BadgeDef[]; onClose: () => void }

const COLORS = ['#C8FF00','#FF3CAC','#3CEFFF','#FB923C','#fff','#A78BFA']

export default function BadgeUnlockModal({ badges, onClose }: Props) {
  const { colors } = useTheme()
  const [idx, setIdx] = useState(0)
  const [particles, setParticles] = useState<{ id: number; color: string; size: number; angle: number; delay: number }[]>([])

  const badge = badges[idx]
  const rarity = RARITY_COLORS[badge.rarity]
  const isLast = idx === badges.length - 1

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      size: Math.random() * 10 + 4,
      angle: (i / 30) * 360 + Math.random() * 10,
      delay: Math.random() * 0.2,
    })))
  }, [idx])

  function next() {
    if (isLast) onClose()
    else setIdx(i => i + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={next}>

      {/* Confetti */}
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ opacity: 1, left: '50%', top: '50%', scale: 0, rotate: 0 }}
          animate={{ opacity: [1, 1, 0], left: `calc(50% + ${Math.cos(p.angle * Math.PI / 180) * (130 + Math.random() * 100)}px)`, top: `calc(50% + ${Math.sin(p.angle * Math.PI / 180) * (130 + Math.random() * 100)}px)`, scale: [0, 1.2, 0.5], rotate: Math.random() * 540 }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
          style={{ position: 'fixed', width: p.size, height: p.size, borderRadius: '50%', background: p.color, pointerEvents: 'none', boxShadow: `0 0 6px ${p.color}80` }} />
      ))}

      <motion.div
        key={idx}
        initial={{ scale: 0.5, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
        onClick={e => e.stopPropagation()}
        style={{ background: colors.surface, border: `3px solid ${rarity.border}`, borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: `0 8px 0 ${rarity.shadow}40` }}>

        {badges.length > 1 && (
          <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
            {idx + 1} / {badges.length}
          </p>
        )}

        <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: rarity.color, textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 20 }}>
          Badge débloqué — {rarity.label}
        </p>

        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 180, delay: 0.25 }}
          style={{ width: 100, height: 100, borderRadius: 30, background: rarity.bg, border: `3px solid ${rarity.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 52, boxShadow: `0 6px 0 ${rarity.shadow}40, 0 0 30px ${rarity.color}30` }}>
          {badge.emoji}
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: colors.text, marginBottom: 6 }}>
          {badge.name}
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 28 }}>
          {badge.description}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          whileHover={{ y: -2 }} whileTap={{ y: 4 }}
          onClick={next}
          style={{ width: '100%', background: rarity.color, color: badge.rarity === 'common' ? '#1A1A2E' : badge.rarity === 'legendary' ? colors.limeText : '#fff', border: 'none', borderRadius: 16, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 5px 0 ${rarity.shadow}` }}>
          {isLast ? 'Super ! 🎉' : `Suivant (${badges.length - idx - 1} restant${badges.length - idx - 1 > 1 ? 's' : ''})`}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
