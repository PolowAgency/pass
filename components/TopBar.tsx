'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Sun, Moon, Heart } from 'lucide-react'
import { Profile } from '@/types'
import { getXpForNextLevel, getLevelTitle } from '@/lib/xp'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function TopBar({ profile }: { profile: Profile | null }) {
  const { colors, theme, toggle } = useTheme()
  const isMobile = useIsMobile()
  const streak = profile?.streak_days ?? 0
  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const hearts = profile?.hearts ?? 5
  const maxHearts = profile?.max_hearts ?? 5
  const gems = profile?.gems ?? 0
  const isPremium = profile?.plan === 'premium' || profile?.plan === 'exam'
  const { pct } = getXpForNextLevel(xp)

  const [xpFlash, setXpFlash] = useState(false)
  const [prevXP, setPrevXP] = useState(xp)

  useEffect(() => {
    if (xp > prevXP) { setXpFlash(true); setTimeout(() => setXpFlash(false), 1000) }
    setPrevXP(xp)
  }, [xp])

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30, background: colors.topbarBg, backdropFilter: 'blur(16px)', borderBottom: `2px solid ${colors.topbarBorder}`, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, padding: isMobile ? '0 12px' : '0 20px', height: 52 }}>

      {/* Streak */}
      <Link href="/review" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <motion.div data-tour="streak" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: 99, cursor: 'pointer',
            background: streak > 0 ? 'linear-gradient(135deg, rgba(251,146,60,0.18), rgba(234,88,12,0.08))' : colors.surface2,
            border: `1.5px solid ${streak > 0 ? 'rgba(251,146,60,0.28)' : colors.border}`,
            backdropFilter: streak > 0 ? 'blur(12px)' : 'none',
            boxShadow: streak > 0 ? '0 2px 20px rgba(251,146,60,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' : `0 2px 0 ${colors.border2}`,
          }}>
          <span style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1, filter: streak > 0 ? 'drop-shadow(0 0 4px rgba(251,146,60,0.5))' : 'none' }}>{streak > 0 ? '🔥' : '💤'}</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 13 : 14,
            background: streak > 0 ? 'linear-gradient(135deg, #FCD34D, #FB923C)' : 'none',
            WebkitBackgroundClip: streak > 0 ? 'text' : 'unset',
            WebkitTextFillColor: streak > 0 ? 'transparent' : colors.muted,
            color: streak > 0 ? 'transparent' : colors.muted,
          }}>{streak}</span>
        </motion.div>
      </Link>

      {/* Hearts */}
      <motion.div data-tour="hearts"
        style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 5, padding: isMobile ? '5px 9px' : '6px 12px', borderRadius: 99, flexShrink: 0, cursor: 'default',
          background: hearts > 0 ? 'linear-gradient(135deg, rgba(248,113,113,0.18), rgba(239,68,68,0.08))' : colors.surface2,
          border: `1.5px solid ${hearts > 0 ? 'rgba(248,113,113,0.28)' : colors.border}`,
          backdropFilter: hearts > 0 ? 'blur(12px)' : 'none',
          boxShadow: hearts > 0 ? '0 2px 20px rgba(248,113,113,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' : `0 2px 0 ${colors.border2}`,
        }}>
        {isPremium ? (
          <>
            <Heart size={isMobile ? 13 : 14} fill="#f87171" color="#f87171" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 13 : 14, color: '#f87171' }}>∞</span>
          </>
        ) : isMobile ? (
          <>
            <Heart size={13} fill={hearts > 0 ? '#f87171' : 'transparent'} color="#f87171"
              style={{ filter: hearts > 0 ? 'drop-shadow(0 0 4px rgba(248,113,113,0.5))' : 'none' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
              background: hearts > 0 ? 'linear-gradient(135deg, #FCA5A5, #F87171)' : 'none',
              WebkitBackgroundClip: hearts > 0 ? 'text' : 'unset',
              WebkitTextFillColor: hearts > 0 ? 'transparent' : colors.muted,
              color: hearts > 0 ? 'transparent' : colors.muted,
            }}>{hearts}</span>
          </>
        ) : (
          Array.from({ length: maxHearts }).map((_, i) => (
            <Heart key={i} size={14}
              fill={i < hearts ? '#f87171' : 'transparent'}
              color={i < hearts ? '#f87171' : colors.muted}
              strokeWidth={i < hearts ? 0 : 1.5} />
          ))
        )}
      </motion.div>

      {/* XP bar — masquée sur très petits écrans, visible sinon */}
      <div style={{ flex: 1, maxWidth: isMobile ? 'none' : 340, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Level badge + title */}
          <motion.div
            animate={xpFlash ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            title={getLevelTitle(level)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: colors.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 0 ${colors.limeDark}`, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 11, color: colors.limeText }}>
              {level}
            </div>
            {!isMobile && (
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, color: colors.muted, whiteSpace: 'nowrap' }}>
                {getLevelTitle(level)}
              </span>
            )}
          </motion.div>

          {/* Barre XP */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ height: 10, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 6px rgba(200,255,0,0.4)' }} />
            </div>
          </div>

          {/* XP count — masqué sur mobile pour gagner de la place */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: colors.limeBg, border: `1px solid ${colors.limeBorder}`, flexShrink: 0 }}>
              <span style={{ fontSize: 11 }}>⚡</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.limeDark }}>{xp}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gems — link vers /shop sur toutes tailles */}
      <Link href="/shop" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <motion.div data-tour="gems" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 5, padding: isMobile ? '5px 9px' : '6px 13px', borderRadius: 99, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(59,130,246,0.08))',
            border: '1.5px solid rgba(96,165,250,0.25)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 20px rgba(96,165,250,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
          <span style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1, filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.5))' }}>💎</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 13 : 14,
            background: 'linear-gradient(135deg, #93C5FD, #60A5FA)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{gems}</span>
        </motion.div>
      </Link>

      {/* Theme toggle */}
      <motion.button onClick={toggle} whileHover={{ rotate: 20 }} whileTap={{ scale: 0.9 }}
        style={{ width: 34, height: 34, borderRadius: 10, background: colors.surface2, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 0 ${colors.border2}`, color: colors.muted, flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={theme} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Bouton aide / relancer tour */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
        onClick={() => { localStorage.removeItem('pass-tour-done'); window.location.reload() }}
        title="Revoir le tutoriel"
        style={{ width: 34, height: 34, borderRadius: 10, background: colors.surface2, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 0 ${colors.border2}`, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: colors.muted, flexShrink: 0 }}>
        ?
      </motion.button>

      {/* Plan badge — masqué sur mobile */}
      {!isMobile && (
        <motion.div whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 99, background: profile?.plan !== 'free' ? colors.limeBg : colors.surface2, border: `2px solid ${profile?.plan !== 'free' ? colors.limeBorder : colors.border}`, boxShadow: profile?.plan !== 'free' ? `0 2px 0 ${colors.limeDark}` : `0 2px 0 ${colors.border2}`, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>{profile?.plan !== 'free' ? '⚡' : '🆓'}</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: profile?.plan !== 'free' ? colors.limeDark : colors.muted }}>
            {profile?.plan === 'free' ? 'Free' : 'PRO'}
          </span>
        </motion.div>
      )}
    </div>
  )
}
