'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
import { ArrowLeft, Share2, Play } from 'lucide-react'

interface StatsData {
  heatmap: Record<string, number>
  scores: { date: string; pct: number }[]
  profile: { xp?: number; level?: number; streak_days?: number; max_streak_days?: number; uploads_count?: number }
}

function Heatmap({ data, colors }: { data: Record<string, number>; colors: ReturnType<typeof useTheme>['colors'] }) {
  const days: { date: string; xp: number }[] = []
  const today = new Date()
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({ date: key, xp: data[key] ?? 0 })
  }

  const maxXP = Math.max(...days.map(d => d.xp), 1)

  function getColor(xp: number) {
    if (xp === 0) return colors.surface2
    const intensity = xp / maxXP
    if (intensity < 0.25) return 'rgba(200,255,0,0.25)'
    if (intensity < 0.5)  return 'rgba(200,255,0,0.5)'
    if (intensity < 0.75) return 'rgba(200,255,0,0.75)'
    return '#C8FF00'
  }

  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].date).getMonth()
    if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col: wi }); lastMonth = m }
  })

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 'max-content' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: 3, paddingLeft: 24 }}>
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.col === wi)
            return <div key={wi} style={{ width: 13, fontSize: 9, color: colors.muted, fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>{ml?.label ?? ''}</div>
          })}
        </div>
        {/* Day rows */}
        {['L','M','M','J','V','S','D'].map((day, di) => (
          <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 20, fontSize: 9, color: colors.muted, fontFamily: 'DM Sans, sans-serif', textAlign: 'right', flexShrink: 0 }}>
              {di % 2 === 0 ? day : ''}
            </span>
            {weeks.map((week, wi) => {
              const cell = week[di]
              return (
                <div key={wi} title={cell ? `${cell.date}: ${cell.xp} XP` : ''}
                  style={{ width: 13, height: 13, borderRadius: 3, background: cell ? getColor(cell.xp) : colors.surface2, flexShrink: 0, cursor: 'default', border: `1px solid ${colors.border}` }} />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreChart({ scores, colors }: { scores: { date: string; pct: number }[]; colors: ReturnType<typeof useTheme>['colors'] }) {
  if (scores.length < 2) return (
    <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 40 }}>📊</div>
      <p style={{ color: colors.muted, fontSize: 14, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
        Fais au moins 2 QCM pour voir ta progression
      </p>
      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 14, padding: '12px 22px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
          <Play size={14} fill={colors.limeText} />Lancer un QCM
        </motion.button>
      </Link>
    </div>
  )

  const W = 500, H = 160, PAD = 32
  const maxY = 100, minY = 0
  const scaleX = (i: number) => PAD + (i / (scores.length - 1)) * (W - PAD * 2)
  const scaleY = (v: number) => H - PAD - ((v - minY) / (maxY - minY)) * (H - PAD * 2)

  const path = scores.map((s, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(s.pct)}`).join(' ')
  const area = `${path} L ${scaleX(scores.length - 1)} ${H - PAD} L ${scaleX(0)} ${H - PAD} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 180 }}>
      <defs>
        <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8FF00" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C8FF00" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PAD} y1={scaleY(v)} x2={W - PAD} y2={scaleY(v)} stroke={colors.border} strokeWidth="1" strokeDasharray="3,4" />
          <text x={PAD - 4} y={scaleY(v) + 4} fontSize="9" fill={colors.muted} textAnchor="end" fontFamily="DM Sans, sans-serif">{v}%</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={area} fill="url(#score-grad)" />
      {/* Line */}
      <path d={path} fill="none" stroke="#C8FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {scores.map((s, i) => (
        <g key={i}>
          <circle cx={scaleX(i)} cy={scaleY(s.pct)} r="4" fill="#C8FF00" stroke={colors.surface} strokeWidth="2" />
          {scores.length <= 10 && (
            <text x={scaleX(i)} y={scaleY(s.pct) - 8} fontSize="9" fill={colors.muted} textAnchor="middle" fontFamily="DM Sans, sans-serif">{s.pct}%</text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default function StatsPage() {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.surface, border: `2px solid ${colors.border}`,
    borderRadius: 20, padding: '20px', boxShadow: `0 4px 0 ${colors.border2}`, ...extra,
  })

  const spring = (delay = 0) => ({ type: 'spring' as const, damping: 20, stiffness: 220, delay })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32 }}>⏳</div>
    </div>
  )

  const heatmapData = data?.heatmap ?? {}
  const scoresData = data?.scores ?? []
  const totalXP = Object.values(heatmapData).reduce((a, b) => a + b, 0)
  const activeDays = Object.values(heatmapData).filter(v => v > 0).length
  const avgScore = scoresData.length > 0
    ? Math.round(scoresData.reduce((a: number, s: { pct: number }) => a + s.pct, 0) / scoresData.length)
    : null
  const bestScore = scoresData.length > 0 ? Math.max(...scoresData.map((s: { pct: number }) => s.pct)) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '28px 24px 60px', transition: 'background 0.25s' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                style={{ width: 38, height: 38, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}` }}>
                <ArrowLeft size={16} />
              </motion.button>
            </Link>
            <div>
              <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Compte</p>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 24 : 30, color: colors.text, letterSpacing: '-0.5px' }}>Statistiques</h1>
            </div>
          </div>
          <Link href="/share" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 14, padding: '10px 16px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${colors.border2}` }}>
              <Share2 size={14} />Partager
            </motion.button>
          </Link>
        </motion.div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 8 : 12, marginBottom: 20 }}>
          {[
            { emoji: '🔥', val: `${data?.profile?.streak_days ?? 0}j`, label: 'Streak', color: '#FB923C' },
            { emoji: '⚡', val: `${totalXP} XP`, label: '90 derniers jours', color: colors.limeDark },
            { emoji: '📅', val: `${activeDays}j`, label: 'Jours actifs', color: colors.blue },
            { emoji: '🎯', val: avgScore !== null ? `${avgScore}%` : '—', label: 'Score moyen QCM', color: '#FF3CAC' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.06 * i)}
              style={card({ padding: '14px 16px' })}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: colors.muted, marginTop: 3, fontFamily: 'DM Sans, sans-serif' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.1)}
          style={{ ...card(), marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: colors.text }}>Activité — 90 jours</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Moins</span>
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: v === 0 ? colors.surface2 : `rgba(200,255,0,${v})`, border: `1px solid ${colors.border}` }} />
              ))}
              <span style={{ fontSize: 10, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Plus</span>
            </div>
          </div>
          <Heatmap data={data?.heatmap ?? {}} colors={colors} />
        </motion.div>

        {/* QCM progression */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.15)}
          style={{ ...card(), marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: colors.text }}>Progression QCM</h2>
            {bestScore !== null && (
              <span style={{ fontSize: 12, color: colors.limeDark, fontFamily: 'Outfit, sans-serif', fontWeight: 700, background: colors.limeBg, border: `1px solid ${colors.limeBorder}`, padding: '3px 10px', borderRadius: 99 }}>
                Meilleur : {bestScore}%
              </span>
            )}
          </div>
          <ScoreChart scores={data?.scores ?? []} colors={colors} />
        </motion.div>

        {/* Records */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.2)}
          style={card()}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: colors.text, marginBottom: 16 }}>Records personnels</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Niveau actuel', val: `Niveau ${data?.profile?.level ?? 1}`, emoji: '⭐' },
              { label: 'XP total all-time', val: `${data?.profile?.xp ?? 0} XP`, emoji: '⚡' },
              { label: 'Streak record', val: `${data?.profile?.max_streak_days ?? data?.profile?.streak_days ?? 0} jours`, emoji: '🔥' },
              { label: 'Cours uploadés', val: `${data?.profile?.uploads_count ?? 0}`, emoji: '📚' },
              { label: 'QCM complétés', val: `${data?.scores?.length ?? 0}`, emoji: '🎯' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <span style={{ fontSize: 20, width: 28 }}>{row.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{row.label}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.text }}>{row.val}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
