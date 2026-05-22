'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Shield, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
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

const GEM_PACKS = [
  { id: 'starter', gems: 100,  price: '0,99€', label: 'Starter',  emoji: '💎', popular: false, color: '#60A5FA', shadow: '#1D4ED8', bg: 'rgba(96,165,250,0.12)'  },
  { id: 'grinder', gems: 350,  price: '2,99€', label: 'Grinder',  emoji: '💎💎', popular: true,  color: '#C8FF00', shadow: '#8AAB00', bg: 'rgba(200,255,0,0.1)'    },
  { id: 'legend',  gems: 1000, price: '7,99€', label: 'Legend',   emoji: '💎💎💎', popular: false, color: '#A78BFA', shadow: '#7C3AED', bg: 'rgba(167,139,250,0.12)' },
]

const EARN_ROWS = [
  { label: 'QCM parfait (≥ 80%)',  val: '+5 💎',   color: '#22c55e' },
  { label: 'QCM bon (≥ 60%)',      val: '+3 💎',   color: '#60A5FA' },
  { label: 'Objectif quotidien',   val: '+3 💎',   color: '#60A5FA' },
  { label: 'Upload un cours',      val: '+2 💎',   color: '#60A5FA' },
  { label: 'Streak 7 jours',       val: '+10 💎',  color: '#FB923C' },
  { label: 'Streak 30 jours',      val: '+30 💎',  color: '#FB923C' },
  { label: 'Streak 100 jours',     val: '+100 💎', color: '#C8FF00' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#6B6B88', marginBottom: 12 }}>
      {children}
    </p>
  )
}

export default function ShopView({ gems: initialGems, hearts: initialHearts, maxHearts, freezes: initialFreezes, plan }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const isPremium = plan === 'premium' || plan === 'exam'

  const [gems, setGems] = useState(initialGems)
  const [hearts, setHearts] = useState(initialHearts)
  const [freezes, setFreezes] = useState(initialFreezes)
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ item: string; ok: boolean; msg: string } | null>(null)

  // Succès achat gems depuis redirect Stripe
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('gems_success=1')) {
      setFeedback({ item: '__gems__', ok: true, msg: '💎 Gems crédités ! Ils apparaîtront dans quelques secondes.' })
      window.history.replaceState({}, '', '/shop')
      setTimeout(() => setFeedback(null), 5000)
    }
  }, [])

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
        const msgs: Record<string, string> = { heart_refill: '❤️ Cœur récupéré !', streak_freeze: '🛡️ Freeze ajouté !' }
        setFeedback({ item, ok: true, msg: msgs[item] ?? 'Achat réussi !' })
      } else {
        const errors: Record<string, string> = {
          not_enough_gems: 'Pas assez de gems.', max_hearts: 'Cœurs déjà pleins.', max_freezes: 'Maximum 5 freezes.',
        }
        setFeedback({ item, ok: false, msg: errors[data.reason ?? ''] ?? 'Erreur.' })
      }
    } catch { setFeedback({ item, ok: false, msg: 'Erreur réseau.' }) }
    finally { setLoading(null); setTimeout(() => setFeedback(null), 3000) }
  }

  async function buyGems(pack: string) {
    if (loading) return
    setLoading(`gems_${pack}`)
    try {
      const res = await fetch('/api/stripe/gems-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch { setFeedback({ item: `gems_${pack}`, ok: false, msg: 'Erreur paiement.' }); setLoading(null) }
  }

  const s = isMobile ? '16px 14px 100px' : '32px 28px 60px'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: s }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isMobile ? 24 : 32 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 13, color: colors.muted, letterSpacing: '0.2px' }}>← Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 28 : 34, color: colors.text, margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
                Shop
              </h1>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontStyle: 'italic', fontSize: 15, color: colors.muted, marginTop: 6, letterSpacing: '-0.2px' }}>
                Dépense tes gems, grimpe plus vite.
              </p>
            </div>
            {/* Gems pill */}
            <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 16, delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 16px' : '11px 20px', borderRadius: 99,
                background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.06))',
                backdropFilter: 'blur(12px)', border: '1.5px solid rgba(96,165,250,0.22)',
                boxShadow: '0 2px 20px rgba(96,165,250,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 5px rgba(96,165,250,0.5))' }}>💎</span>
              <div>
                <span style={{ display: 'block', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 20 : 24, lineHeight: 1, letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, #93C5FD, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {gems}
                </span>
                <span style={{ fontSize: 9, color: '#60A5FA', opacity: 0.55, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>gems</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Feedback global */}
        <AnimatePresence>
          {feedback?.item === '__gems__' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, marginBottom: 20,
                background: 'rgba(34,197,94,0.08)', border: '1.5px solid #22c55e' }}>
              <CheckCircle2 size={18} color="#22c55e" />
              <span style={{ fontSize: 14, color: '#22c55e' }}>{feedback.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dépenser ── */}
        <div style={{ marginBottom: isMobile ? 28 : 32 }}>
          <SectionLabel>Dépenser</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ShopCard
              icon={<Heart size={20} fill="#f87171" color="#f87171" />}
              title="Refill un cœur"
              description={isPremium ? 'Premium — cœurs illimités ✓' : `${hearts}/${maxHearts} cœurs restants`}
              cost={10} gems={gems}
              disabled={isPremium || hearts >= maxHearts}
              disabledReason={isPremium ? 'Premium actif' : hearts >= maxHearts ? 'Cœurs pleins' : undefined}
              loading={loading === 'heart_refill'}
              feedback={feedback?.item === 'heart_refill' ? feedback : null}
              onBuy={() => buy('heart_refill')}
              colors={colors} isMobile={isMobile}
              accent="#f87171" shadow="#CC2200"
            />
            <ShopCard
              icon={<Shield size={20} fill="#60A5FA" color="#60A5FA" />}
              title="Streak Freeze"
              description={`${freezes}/5 freeze${freezes !== 1 ? 's' : ''} — protège ton streak 1 jour`}
              cost={15} gems={gems}
              disabled={freezes >= 5}
              disabledReason={freezes >= 5 ? 'Maximum (5/5)' : undefined}
              loading={loading === 'streak_freeze'}
              feedback={feedback?.item === 'streak_freeze' ? feedback : null}
              onBuy={() => buy('streak_freeze')}
              colors={colors} isMobile={isMobile}
              accent="#60A5FA" shadow="#1D4ED8"
            />
          </div>
        </div>

        {/* ── Acheter des gems ── */}
        <div style={{ marginBottom: isMobile ? 28 : 32 }}>
          <SectionLabel>Acheter des gems</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 10 }}>
            {GEM_PACKS.map((pack, i) => (
              <motion.div key={pack.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 0.05 * i }}
                style={{ position: 'relative' }}>
                {pack.popular && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: pack.color, color: '#0C0C10', borderRadius: 99, padding: '3px 10px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 10, whiteSpace: 'nowrap', zIndex: 1 }}>
                    ⭐ Populaire
                  </div>
                )}
                <motion.button
                  whileHover={{ y: -3, boxShadow: `0 8px 24px ${pack.color}30` }}
                  whileTap={{ y: 2 }}
                  onClick={() => buyGems(pack.id)}
                  disabled={loading === `gems_${pack.id}`}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: isMobile ? '16px 8px' : '20px 12px',
                    borderRadius: 18, border: `2px solid ${pack.popular ? pack.color + '60' : colors.border}`,
                    background: pack.popular ? pack.bg : colors.surface,
                    cursor: loading === `gems_${pack.id}` ? 'wait' : 'pointer',
                    boxShadow: `0 4px 0 ${pack.popular ? pack.shadow + '40' : colors.border2}`,
                    transition: 'all 0.2s' }}>
                  <span style={{ fontSize: isMobile ? 20 : 24, filter: `drop-shadow(0 0 6px ${pack.color}60)` }}>{pack.emoji}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 16 : 18, color: pack.color, letterSpacing: '-0.3px' }}>
                    {pack.gems}
                  </span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 10, color: colors.muted, letterSpacing: '0.5px' }}>gems</span>
                  <div style={{ marginTop: 4, background: pack.popular ? pack.color : colors.surface2, borderRadius: 8, padding: '5px 10px',
                    boxShadow: pack.popular ? `0 3px 0 ${pack.shadow}` : `0 2px 0 ${colors.border2}` }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
                      color: pack.popular ? '#0C0C10' : colors.text }}>
                      {loading === `gems_${pack.id}` ? '…' : pack.price}
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Comment gagner ── */}
        <div style={{ marginBottom: !isPremium ? (isMobile ? 24 : 32) : 0 }}>
          <SectionLabel>Comment gagner des 💎</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {EARN_ROWS.map(({ label, val, color }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '9px 13px' : '10px 14px', borderRadius: 12,
                  background: colors.surface2, border: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: isMobile ? 13 : 14, color: colors.text }}>{label}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color }}>{val}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Premium upsell ── */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ padding: isMobile ? '18px' : '22px 24px', borderRadius: 20, background: colors.limeBg,
              border: `2px solid ${colors.limeBorder}`, boxShadow: `0 4px 0 ${colors.limeDark}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Zap size={18} color={colors.limeDark} fill={colors.limeDark} />
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 15 : 16, color: colors.limeDark, margin: 0 }}>
                Premium — cœurs illimités
              </p>
            </div>
            <p style={{ fontSize: 14, color: colors.limeDark, marginBottom: 14, opacity: 0.8, lineHeight: 1.5 }}>
              Fini les vies. Coach IA sans limite, révisions illimitées.
            </p>
            <Link href="/settings">
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }}
                style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 12,
                  padding: '11px 20px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                Voir les offres →
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── ShopCard ──────────────────────────────────────────────────────────────────
interface CardProps {
  icon: React.ReactNode; title: string; description: string; cost: number; gems: number
  disabled: boolean; disabledReason?: string; loading: boolean
  feedback: { ok: boolean; msg: string } | null; onBuy: () => void
  colors: ReturnType<typeof useTheme>['colors']; isMobile: boolean
  accent: string; shadow: string
}

function ShopCard({ icon, title, description, cost, gems, disabled, disabledReason, loading, feedback, onBuy, colors, isMobile, accent, shadow }: CardProps) {
  const canAfford = gems >= cost
  const blocked = disabled || !canAfford

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: 16,
        padding: isMobile ? '14px' : '16px 18px', boxShadow: `0 3px 0 ${colors.border2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}18`,
            border: `1.5px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: colors.text, marginBottom: 1 }}>{title}</p>
            <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.3 }}>{description}</p>
            {!canAfford && !disabled && (
              <p style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>Il te manque {cost - gems} 💎</p>
            )}
          </div>
        </div>
        {disabledReason ? (
          <div style={{ padding: '7px 12px', borderRadius: 10, background: colors.surface2, border: `1px solid ${colors.border}`, flexShrink: 0 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 11, color: colors.muted, whiteSpace: 'nowrap' }}>{disabledReason}</span>
          </div>
        ) : (
          <motion.button whileHover={!blocked ? { y: -2 } : {}} whileTap={!blocked ? { y: 2 } : {}}
            onClick={!blocked ? onBuy : undefined} disabled={blocked || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10,
              border: 'none', cursor: blocked ? 'not-allowed' : 'pointer', flexShrink: 0,
              background: blocked ? colors.surface2 : accent, color: blocked ? colors.muted : '#fff',
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13,
              boxShadow: blocked ? `0 2px 0 ${colors.border2}` : `0 3px 0 ${shadow}`,
              opacity: blocked ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {loading ? '…' : <><span>💎</span><span>{cost}</span></>}
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10,
              background: feedback.ok ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${feedback.ok ? '#22c55e' : '#f87171'}` }}>
            {feedback.ok ? <CheckCircle2 size={14} color="#22c55e" /> : <AlertCircle size={14} color="#f87171" />}
            <span style={{ fontSize: 12, color: feedback.ok ? '#22c55e' : '#f87171' }}>{feedback.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
