'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { BADGES, RARITY_COLORS, BadgeRarity } from '@/lib/badges'

interface EarnedBadge { badge_id: string; unlocked_at: string }

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common']

export default function BadgesView({ earnedBadges }: { earnedBadges: EarnedBadge[] }) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const earnedSet = new Map(earnedBadges.map(b => [b.badge_id, b.unlocked_at]))
  const earnedCount = earnedBadges.length
  const total = BADGES.length
  const pct = Math.round((earnedCount / total) * 100)

  const grouped = RARITY_ORDER.map(rarity => ({
    rarity,
    badges: BADGES.filter(b => b.rarity === rarity),
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '16px 14px 100px' : '28px 24px 60px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 20 : 28 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ width: 38, height: 38, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}`, flexShrink: 0 }}>
              <ArrowLeft size={16} />
            </motion.button>
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 24 : 30, color: colors.text, letterSpacing: '-0.5px' }}>
              🏅 Badges
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: colors.muted, marginTop: 2 }}>
              {earnedCount}/{total} débloqués
            </p>
          </div>
          {/* Progress ring (simple bar) */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 22 : 28, color: colors.lime }}>{pct}%</span>
          </div>
        </div>

        {/* Global progress bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 16, padding: '14px 18px', marginBottom: isMobile ? 20 : 28, boxShadow: `0 3px 0 ${colors.border2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: colors.muted }}>{earnedCount} badges gagnés</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: colors.muted }}>{total - earnedCount} restants</span>
          </div>
          <div style={{ height: 10, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 8px rgba(200,255,0,0.4)' }} />
          </div>
        </motion.div>

        {/* Grouped by rarity */}
        {grouped.map(({ rarity, badges }, gi) => {
          const rc = RARITY_COLORS[rarity]
          const earnedInGroup = badges.filter(b => earnedSet.has(b.id)).length
          return (
            <motion.div key={rarity} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + gi * 0.07 }}
              style={{ marginBottom: isMobile ? 20 : 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ height: 2, flex: 1, background: rc.border, borderRadius: 99 }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 11, color: rc.color, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  {rc.label}
                </span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: colors.muted }}>{earnedInGroup}/{badges.length}</span>
                <div style={{ height: 2, flex: 1, background: rc.border, borderRadius: 99 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: isMobile ? 8 : 10 }}>
                {badges.map((badge, bi) => {
                  const earned = earnedSet.has(badge.id)
                  const unlockedAt = earned ? earnedSet.get(badge.id) : null
                  const dateStr = unlockedAt ? new Date(unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null

                  return (
                    <motion.div key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + gi * 0.07 + bi * 0.03 }}
                      style={{ background: earned ? rc.bg : colors.surface2, border: `2px solid ${earned ? rc.border : colors.border}`, borderRadius: isMobile ? 16 : 18, padding: isMobile ? '14px 12px' : '18px 14px', textAlign: 'center', boxShadow: earned ? `0 4px 0 ${rc.shadow}` : `0 3px 0 ${colors.border2}`, position: 'relative', overflow: 'hidden' }}>

                      {!earned && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                          <Lock size={16} color={colors.muted} />
                        </div>
                      )}

                      <div style={{ fontSize: isMobile ? 32 : 38, marginBottom: 8, filter: earned ? 'none' : 'grayscale(1) opacity(0.4)', lineHeight: 1 }}>
                        {badge.emoji}
                      </div>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 12 : 13, color: earned ? rc.color : colors.muted, marginBottom: 4, lineHeight: 1.2 }}>
                        {badge.name}
                      </p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? 10 : 11, color: earned ? colors.text : colors.muted, lineHeight: 1.3, opacity: earned ? 0.8 : 0.5 }}>
                        {badge.description}
                      </p>
                      {dateStr && (
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: rc.color, marginTop: 6, fontWeight: 700 }}>
                          ✓ {dateStr}
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
