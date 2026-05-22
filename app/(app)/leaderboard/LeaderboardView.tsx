'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
import { ArrowLeft, Trophy, Flame, Zap } from 'lucide-react'

interface Row {
  rank: number
  user_id: string
  display_name: string
  level: number
  streak_days: number
  weekly_xp: number
  is_current: boolean
}

const LEAGUE_BRACKETS = [
  { min: 1,  max: 3,  name: 'Légendaire', color: '#C8FF00', emoji: '👑' },
  { min: 4,  max: 10, name: 'Diamant',    color: '#3CEFFF', emoji: '💎' },
  { min: 11, max: 25, name: 'Or',         color: '#FFC107', emoji: '🥇' },
  { min: 26, max: 50, name: 'Argent',     color: '#94A3B8', emoji: '🥈' },
]
function getLeague(rank: number) {
  return LEAGUE_BRACKETS.find(l => rank >= l.min && rank <= l.max) ?? { name: 'Bronze', color: '#CD7F32', emoji: '🥉' }
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
function getWeekRange() {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const mon = new Date(now); mon.setDate(now.getDate() - day)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => `${d.getDate()} ${['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'][d.getMonth()]}`
  const todayIdx = day
  return { label: `${fmt(mon)} — ${fmt(sun)}`, todayIdx }
}

export default function LeaderboardView({ rows }: { rows: Row[] }) {
  const { colors, theme } = useTheme()
  const isMobile = useIsMobile()
  const me = rows.find(r => r.is_current)
  const top3 = rows.filter(r => r.rank <= 3)
  const rest = rows.filter(r => r.rank > 3)
  const { label: weekLabel, todayIdx } = getWeekRange()
  const maxXP = Math.max(...rows.map(r => r.weekly_xp), 1)

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.surface, border: `2px solid ${colors.border}`,
    borderRadius: 20, boxShadow: `0 4px 0 ${colors.border2}`, ...extra,
  })

  if (rows.length === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text, marginBottom: 8 }}>Aucun classement cette semaine</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: colors.muted, marginBottom: 20 }}>Fais ton premier QCM pour apparaître ici !</p>
        <Link href="/review"><button style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 14, padding: '14px 24px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Réviser maintenant</button></Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '16px 14px 100px' : '28px 24px 60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 20 : 28 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ width: 38, height: 38, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}`, flexShrink: 0 }}>
              <ArrowLeft size={16} />
            </motion.button>
          </Link>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 24 : 30, color: colors.text, letterSpacing: '-0.5px' }}>
              🏆 Classement
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: colors.muted, marginTop: 2 }}>Semaine du {weekLabel}</p>
          </div>
        </div>

        {/* Progress bar semaine */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...card({ padding: '14px 18px', marginBottom: isMobile ? 16 : 20 }) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text }}>Progression de la semaine</span>
            {me && <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: '#60A5FA' }}>⚡ {me.weekly_xp} XP</span>}
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 4 : 6 }}>
            {WEEK_DAYS.map((day, i) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: isMobile ? 28 : 32, borderRadius: 6, background: i <= todayIdx ? colors.lime : colors.surface2, border: `1px solid ${i <= todayIdx ? colors.limeDark : colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i <= todayIdx && <span style={{ fontSize: 12 }}>⚡</span>}
                </div>
                <span style={{ fontSize: 9, color: i === todayIdx ? colors.lime : colors.muted, fontFamily: 'DM Sans, sans-serif', fontWeight: i === todayIdx ? 700 : 400 }}>{day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ta position */}
        {me && me.rank > 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ ...card({ padding: '12px 16px', marginBottom: 16, border: `2px solid ${colors.lime}`, background: colors.limeBg }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: colors.limeDark, width: 32 }}>#{me.rank}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.text }}>Toi · {me.display_name}</p>
                <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Niv. {me.level} · {me.streak_days}🔥</p>
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.limeDark }}>⚡ {me.weekly_xp}</span>
            </div>
          </motion.div>
        )}

        {/* Podium top 3 */}
        {top3.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ ...card({ padding: isMobile ? '18px 14px' : '24px 20px', marginBottom: 12 }) }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Top 3</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top3.map((row, i) => {
                const podiumColors = ['#C8FF00', '#3CEFFF', '#FB923C']
                const podiumShadows = ['#8AAB00', '#0088AA', '#CC6600']
                const medals = ['🥇', '🥈', '🥉']
                const barW = (row.weekly_xp / maxXP) * 100
                return (
                  <motion.div key={row.user_id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                      background: row.is_current ? colors.limeBg : colors.surface2,
                      border: `2px solid ${row.is_current ? colors.limeBorder : colors.border}`,
                      boxShadow: row.is_current ? `0 3px 0 ${colors.limeDark}` : `0 3px 0 ${colors.border2}` }}>
                    <span style={{ fontSize: 22, width: 28, flexShrink: 0 }}>{medals[i]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: row.is_current ? colors.limeDark : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.is_current ? `${row.display_name} (toi)` : row.display_name}
                        </span>
                        <span style={{ fontSize: 10, color: colors.muted, fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>Niv.{row.level}</span>
                      </div>
                      <div style={{ height: 6, background: colors.border, borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${barW}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          style={{ height: '100%', borderRadius: 99, background: podiumColors[i], boxShadow: `0 0 6px ${podiumColors[i]}60` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: podiumColors[i], display: 'block', textShadow: theme === 'dark' ? `0 0 12px ${podiumColors[i]}60` : 'none' }}>⚡{row.weekly_xp}</span>
                      {row.streak_days > 0 && <span style={{ fontSize: 10, color: colors.muted }}>🔥{row.streak_days}</span>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Reste du classement */}
        {rest.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={card({ overflow: 'hidden' })}>
            <div style={{ padding: isMobile ? '14px 14px 8px' : '16px 18px 8px' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Classement</h2>
            </div>
            {rest.map((row, i) => {
              const league = getLeague(row.rank)
              const barW = (row.weekly_xp / maxXP) * 100
              return (
                <motion.div key={row.user_id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.03 }}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, padding: isMobile ? '11px 14px' : '12px 18px',
                    borderTop: `1px solid ${colors.border}`,
                    background: row.is_current ? colors.limeBg : 'transparent' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, color: row.is_current ? colors.limeDark : colors.muted, width: 26, textAlign: 'right', flexShrink: 0 }}>#{row.rank}</span>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{league.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: row.is_current ? 800 : 600, fontSize: isMobile ? 13 : 14, color: row.is_current ? colors.limeDark : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.is_current ? `${row.display_name} · toi` : row.display_name}
                      </span>
                    </div>
                    <div style={{ height: 4, background: colors.surface2, borderRadius: 99, overflow: 'hidden', maxWidth: 160 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barW}%` }} transition={{ delay: 0.5 + i * 0.02, duration: 0.6 }}
                        style={{ height: '100%', borderRadius: 99, background: league.color }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 13 : 14, color: row.is_current ? colors.limeDark : colors.text, flexShrink: 0 }}>⚡{row.weekly_xp}</span>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* CTA si user pas encore dans le classement */}
        {!me && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ ...card({ padding: '20px', marginTop: 16, textAlign: 'center', border: `2px dashed ${colors.border}` }) }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 8 }}>Tu n&apos;apparais pas encore</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: colors.muted, marginBottom: 14 }}>Gagne de l&apos;XP cette semaine pour rejoindre le classement.</p>
            <Link href="/review">
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }}
                style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                Réviser maintenant →
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
