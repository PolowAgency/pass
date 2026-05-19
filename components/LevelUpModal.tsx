'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface Props { level: number; onClose: () => void }

const NAMES: Record<number, string> = {
  2: 'Apprenti', 3: 'Étudiant', 4: 'Travailleur',
  5: 'Sérieux', 6: 'Acharné', 7: 'Expert',
  8: 'Maître', 9: 'Champion', 10: 'Légende',
}

const COLORS = ['#C8FF00','#FF3CAC','#3CEFFF','#FB923C','#FFFFFF','#AAFF00','#FFE566']

export default function LevelUpModal({ level, onClose }: Props) {
  const { colors } = useTheme()
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; color: string; size: number; angle: number; delay: number; rect: boolean }[]
  >([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        x: 50, y: 45,
        color: COLORS[i % COLORS.length],
        size: Math.random() * 10 + 5,
        angle: (i / 44) * 360 + Math.random() * 8,
        delay: Math.random() * 0.25,
        rect: Math.random() > 0.55,
      }))
    )
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>

      {/* Confetti */}
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ opacity: 1, left: '50%', top: '45%', scale: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            left: `calc(50% + ${Math.cos(p.angle * Math.PI / 180) * (150 + Math.random() * 120)}px)`,
            top:  `calc(45% + ${Math.sin(p.angle * Math.PI / 180) * (150 + Math.random() * 120)}px)`,
            scale: [0, 1.2, 0.6],
            rotate: Math.random() * 720 - 360,
          }}
          transition={{ duration: 1.3, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
          style={{ position: 'fixed', width: p.size, height: p.rect ? p.size * 0.45 : p.size, borderRadius: p.rect ? 2 : '50%', background: p.color, pointerEvents: 'none', boxShadow: `0 0 6px ${p.color}80` }} />
      ))}

      <motion.div
        initial={{ scale: 0.4, y: 80, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', damping: 13, stiffness: 220, delay: 0.05 }}
        onClick={e => e.stopPropagation()}
        style={{ background: colors.surface, border: `3px solid ${colors.lime}`, borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: `0 8px 0 ${colors.limeDark}, 0 0 80px rgba(200,255,0,0.15)`, position: 'relative' }}>

        <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: colors.limeDark, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 16 }}>Niveau supérieur</p>

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 180, delay: 0.3 }}
          style={{ width: 120, height: 120, borderRadius: 36, background: colors.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 6px 0 ${colors.limeDark}, 0 0 40px rgba(200,255,0,0.3)` }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 64, color: colors.limeText, lineHeight: 1 }}>{level}</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: colors.text, marginBottom: 6 }}>
          {NAMES[level] ?? 'Légende'}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 28 }}>
          Continue comme ça. T&apos;as tout compris.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          whileHover={{ y: -2 }} whileTap={{ y: 4 }}
          onClick={onClose}
          style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 5px 0 ${colors.limeDark}` }}>
          Trop bien ! ⚡
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
