'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  profile: { full_name: string | null; xp: number; level: number; streak_days: number } | null
  bestScore: number
  badgeCount: number
  date: string
}

const LEVEL_NAMES: Record<number, string> = {
  1:'Débutant',2:'Apprenti',3:'Étudiant',4:'Travailleur',5:'Sérieux',6:'Acharné',7:'Expert',8:'Maître',9:'Champion',10:'Légende',
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function ShareView({ profile, bestScore, badgeCount, date }: Props) {
  const { colors } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)

  const name = profile?.full_name?.split(' ')[0] ?? 'Étudiant'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const streak = profile?.streak_days ?? 0
  const [y, m, d] = date.split('-')
  const dateLabel = `${pad(Number(d))}/${pad(Number(m))}/${y}`

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `PASS — ${name}`, text: `🔥 ${streak} jours de streak | Niveau ${level} | ${xp} XP\nRévise avec PASS !` })
      } else {
        await navigator.clipboard.writeText(`🔥 ${streak} jours de streak | Niveau ${level} | ${xp} XP\nRévise avec PASS !`)
        toast.success('Copié dans le presse-papier !')
      }
    } catch {}
  }

  const scoreColor = bestScore >= 80 ? '#22c55e' : bestScore >= 50 ? '#C8FF00' : bestScore >= 30 ? '#FB923C' : '#f87171'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 80px', transition: 'background 0.25s' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/stats" style={{ textDecoration: 'none' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            style={{ width: 38, height: 38, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}` }}>
            <ArrowLeft size={16} />
          </motion.button>
        </Link>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: colors.text }}>Ma progression</h1>
          <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Fais une capture d&apos;écran pour partager</p>
        </div>
      </div>

      {/* The share card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        style={{ width: '100%', maxWidth: 380, background: 'linear-gradient(160deg, #0C0C10 0%, #1C1C2E 40%, #2D1B69 100%)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '2px solid rgba(200,255,0,0.2)' }}>

        {/* Top accent */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #C8FF00, #FF3CAC, #3CEFFF)' }} />

        <div style={{ padding: '28px 28px 24px' }}>

          {/* Logo + date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: '#F0F0F8', letterSpacing: '-0.5px' }}>
              PA<span style={{ color: '#C8FF00' }}>SS</span>
            </span>
            <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{dateLabel}</span>
          </div>

          {/* Name + level */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.5)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>Progression de</p>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: '#F0F0F8', letterSpacing: '-0.5px', lineHeight: 1 }}>{name}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 99, padding: '4px 12px' }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, color: '#C8FF00' }}>Niveau {level}</span>
              <span style={{ fontSize: 11, color: 'rgba(200,255,0,0.6)', fontFamily: 'DM Sans, sans-serif' }}>· {LEVEL_NAMES[level] ?? 'Légende'}</span>
            </div>
          </div>

          {/* Big stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { emoji: '🔥', val: streak, sub: 'jours', label: 'Streak', color: '#FB923C', border: 'rgba(251,146,60,0.3)' },
              { emoji: '⚡', val: xp, sub: 'XP', label: 'Total', color: '#C8FF00', border: 'rgba(200,255,0,0.3)' },
              { emoji: '🏅', val: badgeCount, sub: 'badges', label: 'Collection', color: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.border}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 10, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Best score bar */}
          {bestScore > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.5)', fontFamily: 'DM Sans, sans-serif' }}>Meilleur prep score</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: scoreColor }}>{bestScore}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${bestScore}%`, height: '100%', borderRadius: 99, background: scoreColor, boxShadow: `0 0 8px ${scoreColor}80` }} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom watermark */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Révision intelligente pour étudiants</span>
          <span style={{ fontSize: 11, color: 'rgba(200,255,0,0.5)', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>pass.app</span>
        </div>
      </motion.div>

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: 380, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
          onClick={share}
          style={{ width: '100%', background: '#C8FF00', color: '#0C0C10', border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #8AAB00', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Partager ma progression 🚀
        </motion.button>
        <p style={{ textAlign: 'center', fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>
          Ou fais une capture d&apos;écran de la carte ci-dessus 📸
        </p>
      </div>
    </div>
  )
}
