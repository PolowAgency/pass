'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'

interface Props {
  gems: number
  hearts: number
  maxHearts: number
  freezes: number
  plan: string
}

interface ShopResult { success: boolean; reason?: string; hearts?: number; gems?: number; freezes?: number }

const EARN_ROWS = [
  { label: 'QCM parfait (≥ 80%)',     gems: '+5 💎' },
  { label: 'QCM bon (≥ 60%)',         gems: '+3 💎' },
  { label: 'QCM correct (≥ 40%)',     gems: '+1 💎' },
  { label: 'Objectif quotidien',       gems: '+3 💎' },
  { label: 'Upload un cours',          gems: '+2 💎' },
  { label: 'Streak 7 jours',          gems: '+10 💎' },
  { label: 'Streak 30 jours',         gems: '+30 💎' },
  { label: 'Streak 100 jours',        gems: '+100 💎' },
]

export default function ShopView({ gems: initialGems, hearts: initialHearts, maxHearts, freezes: initialFreezes, plan }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const isPremium = plan === 'premium' || plan === 'exam'

  const [gems, setGems] = useState(initialGems)
  const [hearts, setHearts] = useState(initialHearts)
  const [freezes, setFreezes] = useState(initialFreezes)
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ item: string; ok: boolean; msg: string } | null>(null)

  async function buy(item: string) {
    if (loading) return
    setLoading(item)
    setFeedback(null)
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      })
      const data: ShopResult = await res.json()
      if (data.success) {
        if (data.gems !== undefined) setGems(data.gems)
        if (data.hearts !== undefined) setHearts(data.hearts)
        if (data.freezes !== undefined) setFreezes(data.freezes)
        const msgs: Record<string, string> = {
          heart_refill: '❤️ Cœur récupéré !',
          streak_freeze: '🛡️ Freeze ajouté !',
        }
        setFeedback({ item, ok: true, msg: msgs[item] ?? 'Achat réussi !' })
      } else {
        const errors: Record<string, string> = {
          not_enough_gems: 'Pas assez de gems.',
          max_hearts:      'Tu as déjà le max de cœurs.',
          max_freezes:     'Tu as déjà 5 freezes (max).',
        }
        setFeedback({ item, ok: false, msg: errors[data.reason ?? ''] ?? 'Erreur.' })
      }
    } catch {
      setFeedback({ item, ok: false, msg: 'Erreur réseau.' })
    } finally {
      setLoading(null)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const pad = isMobile ? '16px 14px' : '32px 24px'
  const maxW = 540

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: pad }}>
      <div style={{ maxWidth: maxW, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>← Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 26 : 32, color: colors.text, margin: 0, letterSpacing: '-0.5px' }}>
                💎 Shop
              </h1>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontStyle: 'italic', fontSize: 15, color: colors.muted, marginTop: 4, letterSpacing: '-0.2px' }}>
                Dépense tes gems, grimpe plus vite.
              </p>
            </div>
            {/* Gems counter — pill glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, delay: 0.15 }}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10,
                padding: isMobile ? '10px 18px' : '12px 22px',
                borderRadius: 99,
                background: 'linear-gradient(135deg, rgba(96,165,250,0.18) 0%, rgba(59,130,246,0.08) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(96,165,250,0.25)',
                boxShadow: '0 2px 24px rgba(96,165,250,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>
              <span style={{ fontSize: isMobile ? 20 : 24, lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.6))' }}>💎</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                    fontSize: isMobile ? 22 : 26, lineHeight: 1, letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #93C5FD, #60A5FA)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                  {gems}
                </motion.span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 10, color: '#60A5FA', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>gems</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Shop items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14, marginBottom: isMobile ? 28 : 36 }}>

          {/* Heart refill */}
          <ShopCard
            icon={<Heart size={22} fill="#f87171" color="#f87171" />}
            title="Refill un cœur"
            description={isPremium ? 'Premium — cœurs illimités ✓' : `Tu as ${hearts}/${maxHearts} cœurs`}
            cost={10}
            gems={gems}
            disabled={isPremium || hearts >= maxHearts}
            disabledReason={isPremium ? 'Premium actif' : hearts >= maxHearts ? 'Cœurs pleins' : undefined}
            loading={loading === 'heart_refill'}
            feedback={feedback?.item === 'heart_refill' ? feedback : null}
            onBuy={() => buy('heart_refill')}
            colors={colors}
            isMobile={isMobile}
            accentColor="#f87171"
            accentShadow="#CC2200"
            accentBg="rgba(248,113,113,0.1)"
          />

          {/* Streak freeze */}
          <ShopCard
            icon={<Shield size={22} fill="#60A5FA" color="#60A5FA" />}
            title="Streak Freeze"
            description={`${freezes}/5 freeze${freezes !== 1 ? 's' : ''} — protège ton streak 1 jour`}
            cost={15}
            gems={gems}
            disabled={freezes >= 5}
            disabledReason={freezes >= 5 ? 'Maximum atteint (5/5)' : undefined}
            loading={loading === 'streak_freeze'}
            feedback={feedback?.item === 'streak_freeze' ? feedback : null}
            onBuy={() => buy('streak_freeze')}
            colors={colors}
            isMobile={isMobile}
            accentColor="#60A5FA"
            accentShadow="#1D4ED8"
            accentBg="rgba(96,165,250,0.1)"
          />
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: colors.surface2, borderRadius: 99, marginBottom: isMobile ? 20 : 28 }} />

        {/* How to earn */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 16 : 18, color: colors.text, marginBottom: 14 }}>
            Comment gagner des 💎
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EARN_ROWS.map(({ label, gems: g }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: colors.surface2, border: `1px solid ${colors.border}` }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? 13 : 14, color: colors.text }}>{label}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: '#60A5FA' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium upsell si free */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ marginTop: isMobile ? 24 : 32, padding: isMobile ? '18px' : '22px', borderRadius: 20, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, boxShadow: `0 4px 0 ${colors.limeDark}` }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 16 : 18, color: colors.limeDark, marginBottom: 6 }}>
              ⚡ Premium — cœurs illimités
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: colors.limeDark, marginBottom: 14, opacity: 0.8, lineHeight: 1.5 }}>
              Fini les vies. Révise sans interruption, accès complet au coach et aux QCM.
            </p>
            <Link href="/settings">
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }}
                style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 12, padding: '12px 22px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                Voir les offres →
              </motion.button>
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  )
}

// ─── ShopCard ────────────────────────────────────────────────────────────────
interface CardProps {
  icon: React.ReactNode
  title: string
  description: string
  cost: number
  gems: number
  disabled: boolean
  disabledReason?: string
  loading: boolean
  feedback: { ok: boolean; msg: string } | null
  onBuy: () => void
  colors: ReturnType<typeof useTheme>['colors']
  isMobile: boolean
  accentColor: string
  accentShadow: string
  accentBg: string
}

function ShopCard({ icon, title, description, cost, gems, disabled, disabledReason, loading, feedback, onBuy, colors, isMobile, accentColor, accentShadow, accentBg }: CardProps) {
  const canAfford = gems >= cost
  const blocked = disabled || !canAfford

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: isMobile ? 18 : 20, padding: isMobile ? '16px' : '20px', boxShadow: `0 4px 0 ${colors.border2}` }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 14, justifyContent: 'space-between' }}>

        {/* Left: icon + text */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: accentBg, border: `2px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 15 : 16, color: colors.text, marginBottom: 2 }}>{title}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? 12 : 13, color: colors.muted, lineHeight: 1.4 }}>{description}</p>
            {!canAfford && !disabled && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#f87171', marginTop: 4 }}>
                Il te manque {cost - gems} 💎
              </p>
            )}
          </div>
        </div>

        {/* Right: button */}
        <div style={{ flexShrink: 0 }}>
          {disabledReason ? (
            <div style={{ padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: 12, background: colors.surface2, border: `1px solid ${colors.border}` }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.muted, whiteSpace: 'nowrap' }}>{disabledReason}</span>
            </div>
          ) : (
            <motion.button
              whileHover={!blocked ? { y: -2 } : {}}
              whileTap={!blocked ? { y: 2 } : {}}
              onClick={!blocked ? onBuy : undefined}
              disabled={blocked || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '10px 14px' : '11px 18px',
                borderRadius: 12, border: 'none', cursor: blocked ? 'not-allowed' : 'pointer',
                background: blocked ? colors.surface2 : accentColor,
                color: blocked ? colors.muted : '#fff',
                fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 13 : 14,
                boxShadow: blocked ? `0 3px 0 ${colors.border2}` : `0 4px 0 ${accentShadow}`,
                opacity: blocked ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}>
              {loading ? '…' : <><span>💎</span><span>{cost}</span></>}
            </motion.button>
          )}
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
              background: feedback.ok ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${feedback.ok ? '#22c55e' : '#f87171'}` }}>
            {feedback.ok
              ? <CheckCircle2 size={16} color="#22c55e" />
              : <AlertCircle size={16} color="#f87171" />}
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: feedback.ok ? '#22c55e' : '#f87171' }}>
              {feedback.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
