'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { playSound } from '@/lib/sounds'
import { celebrate } from '@/lib/confetti'

interface Props { streak: number; onClose: () => void }

function getMessage(streak: number): string {
  if (streak === 1)   return "C'est le début d'une grande série !"
  if (streak === 3)   return "3 jours d'affilée. Bien joué !"
  if (streak === 7)   return "Une semaine complète ! Tu déchires."
  if (streak === 14)  return "2 semaines sans faillir. Impressionnant."
  if (streak === 30)  return "Un mois entier. Niveau beast."
  if (streak === 50)  return "50 jours. T'es une machine."
  if (streak === 100) return "100 jours. Légendaire."
  if (streak >= 100)  return "T'as dépassé les 100 jours. Rien ne t'arrête."
  return `${streak} jours de révision non-stop.`
}

export default function StreakModal({ streak, onClose }: Props) {
  const { colors } = useTheme()

  useEffect(() => {
    playSound('streak')
    celebrate('streak')
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 20px 40px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>

      <motion.div
        initial={{ y: 140, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 140, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        style={{ background: colors.surface, border: '2px solid rgba(251,146,60,0.45)', borderRadius: 28, padding: '36px 28px', textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 6px 0 #CC5500' }}>

        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
          style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(251,146,60,0.12)', border: '2px solid rgba(251,146,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 52 }}>
          🔥
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#FB923C', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: 8 }}>
          Streak maintenu !
        </motion.p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 0.45 }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 72, color: '#FB923C', lineHeight: 1, display: 'block' }}>{streak}</span>
          <span style={{ fontSize: 16, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>jours de suite</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: 15, color: colors.text, fontFamily: 'Outfit, sans-serif', fontWeight: 600, margin: '16px 0 28px', lineHeight: 1.4 }}>
          {getMessage(streak)}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -2 }} whileTap={{ y: 4 }}
          onClick={onClose}
          style={{ width: '100%', background: '#FB923C', color: '#1A0500', border: 'none', borderRadius: 16, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 5px 0 #CC5500' }}>
          C&apos;est parti 🔥
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
