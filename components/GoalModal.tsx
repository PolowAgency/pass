'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'

interface Props { reviewed: number; goal: number; xpGained: number; onClose: () => void }

export default function GoalModal({ reviewed, goal, xpGained, onClose }: Props) {
  const { colors } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>

      <motion.div
        initial={{ scale: 0.6, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
        onClick={e => e.stopPropagation()}
        style={{ background: colors.surface, border: '2px solid #22c55e', borderRadius: 28, padding: '40px 28px', textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 7px 0 #15803d' }}>

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, delay: 0.2 }}
          style={{ fontSize: 72, marginBottom: 12, display: 'inline-block' }}>🏆</motion.div>

        <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 8 }}>
          Objectif atteint !
        </p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: colors.text, marginBottom: 6 }}>
          {reviewed} fiche{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''} aujourd&apos;hui
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>
          Ton objectif quotidien est rempli. Tu peux être fier.
        </motion.p>

        {xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, type: 'spring', damping: 14 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, borderRadius: 99, padding: '8px 18px', marginBottom: 24, boxShadow: `0 3px 0 ${colors.limeDark}` }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.limeDark }}>+{xpGained} XP gagnés</span>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            whileHover={{ y: -2 }} whileTap={{ y: 4 }}
            onClick={onClose}
            style={{ width: '100%', background: '#22c55e', color: '#0A1A0A', border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 5px 0 #15803d' }}>
            Continuer 💪
          </motion.button>
          <Link href="/dashboard" onClick={onClose}>
            <button style={{ width: '100%', background: 'transparent', border: 'none', color: colors.muted, borderRadius: 14, padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
              ← Retour au dashboard
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}
