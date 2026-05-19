'use client'

import { useEffect, useState } from 'react'
import { Profile } from '@/types'
import { motion } from 'framer-motion'
import { CheckCircle2, Crown, Zap } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { BADGES, BADGE_MAP, RARITY_COLORS } from '@/lib/badges'

const PLANS = [
  { id: 'free',    name: 'Gratuit', price: '0€',  period: '/mois', emoji: '🆓', features: ['3 uploads par mois', '5 messages coach/jour', 'Fiches illimitées', 'QCM illimité'], cta: 'Plan actuel', accent: '#7B7B96' },
  { id: 'premium', name: 'Premium', price: '9€',  period: '/mois', emoji: '⚡', features: ['Uploads illimités', 'Coach IA sans limite', 'Export PDF des fiches', 'Priorité génération'], cta: 'Passer à Premium', accent: '#C8FF00' },
  { id: 'exam',    name: 'Exam',    price: '19€', period: '/mois', emoji: '🎯', features: ['Tout Premium', 'Planning IA J-14', 'Analyses de progression', 'Support prioritaire'], cta: 'Mode Exam', accent: '#FF3CAC' },
]

function NotificationPrefs({ profile, colors }: { profile: Profile | null; colors: ReturnType<typeof useTheme>['colors'] }) {
  const [emailNotif, setEmailNotif] = useState(profile?.email_notifications ?? true)
  const [streakAlert, setStreakAlert] = useState(profile?.notification_streak_alert ?? true)
  const [reminderTime, setReminderTime] = useState(profile?.daily_reminder_time ?? '20:00')
  const [saving, setSaving] = useState(false)

  async function save(updates: Record<string, unknown>) {
    setSaving(true)
    await fetch('/api/notifications/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    setSaving(false)
  }

  const toggle = (style?: React.CSSProperties): React.CSSProperties => ({
    width: 44, height: 24, borderRadius: 99, cursor: 'pointer', border: 'none', transition: 'background 0.2s', ...style,
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
      style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 20, padding: '20px 24px', marginTop: 20, boxShadow: `0 4px 0 ${colors.border2}` }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: colors.text, marginBottom: 16 }}>Notifications</h3>
      {[
        {
          label: 'Rappel quotidien par email', sub: 'Reçois un rappel si tu n\'as pas révisé',
          val: emailNotif, onChange: (v: boolean) => { setEmailNotif(v); save({ email_notifications: v }) },
        },
        {
          label: 'Alerte streak', sub: 'Prévenu si ton streak est en danger',
          val: streakAlert, onChange: (v: boolean) => { setStreakAlert(v); save({ notification_streak_alert: v }) },
        },
      ].map((row, i, arr) => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : `1px solid ${colors.border}` }}>
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 2 }}>{row.label}</p>
            <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{row.sub}</p>
          </div>
          <button onClick={() => row.onChange(!row.val)}
            style={toggle({ background: row.val ? colors.lime : colors.surface2, boxShadow: row.val ? `0 2px 0 ${colors.limeDark}` : `0 2px 0 ${colors.border2}` })}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: row.val ? colors.limeText : colors.muted, transform: row.val ? 'translateX(22px)' : 'translateX(3px)', transition: 'transform 0.2s, background 0.2s', marginTop: 3 }} />
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
        <div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 2 }}>Heure du rappel</p>
          <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Si activé, envoyé à cette heure</p>
        </div>
        <input type="time" value={reminderTime}
          onChange={e => setReminderTime(e.target.value)}
          onBlur={() => save({ daily_reminder_time: reminderTime })}
          style={{ background: colors.surface2, border: `2px solid ${colors.border}`, borderRadius: 10, padding: '6px 10px', color: colors.text, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
      </div>
      {saving && <p style={{ fontSize: 11, color: colors.muted, marginTop: 8, fontFamily: 'DM Sans, sans-serif', textAlign: 'right' }}>Sauvegarde…</p>}
    </motion.div>
  )
}

export default function SettingsView({ profile, success }: { profile: Profile | null; success: boolean }) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState<string | null>(null)
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set())

  useEffect(() => { if (success) toast.success('Abonnement activé ! 🎉') }, [success])

  useEffect(() => {
    fetch('/api/badges').then(r => r.json()).then(({ badges }) => {
      setEarnedBadgeIds(new Set((badges ?? []).map((b: { badge_id: string }) => b.badge_id)))
    }).catch(() => {})
  }, [])

  const stripeConfigured = !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  async function upgrade(plan: string) {
    if (plan === 'free' || plan === profile?.plan) return
    if (!stripeConfigured) {
      toast('Paiement bientôt disponible ! 🚀', { icon: '⚡', duration: 3000 })
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch { toast.error('Erreur Stripe.'); setLoading(null) }
  }

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.surface, border: `2px solid ${colors.border}`,
    borderRadius: 20, boxShadow: colors.cardShadow, ...extra,
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '28px 20px 48px', transition: 'background 0.25s' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'Outfit, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>Compte</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 26 : 32, color: colors.text, letterSpacing: '-0.5px', marginBottom: isMobile ? 20 : 28 }}>Paramètres</h1>
        </motion.div>

        {/* Current plan */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: `2px solid ${colors.limeBorder}`, borderRadius: 20, padding: '22px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, boxShadow: `0 4px 0 ${colors.limeDark}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: profile?.plan !== 'free' ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Crown size={24} color={profile?.plan !== 'free' ? '#C8FF00' : '#6B6B88'} />
          </div>
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: '#F0F0F8' }}>
              Plan {profile?.plan === 'free' ? 'Gratuit' : profile?.plan === 'premium' ? 'Premium ⚡' : 'Exam 🎯'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.6)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
              {profile?.plan === 'free' ? `${Math.max(0, 3 - (profile?.uploads_count ?? 0))} upload(s) restant(s) ce mois` : 'Uploads illimités · Coach IA sans limite'}
            </p>
          </div>
        </motion.div>

        {/* Plans */}
        <div id="billing">
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text, marginBottom: 16 }}>Choisir un plan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 14 }}>
            {PLANS.map((plan, i) => {
              const isCurrent = profile?.plan === plan.id
              const shadowColor = plan.accent === '#C8FF00' ? colors.limeDark : plan.accent === '#FF3CAC' ? '#CC0066' : colors.border2
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                  style={{ ...card(isCurrent ? { border: `2px solid ${plan.accent}`, boxShadow: `0 4px 0 ${shadowColor}` } : {}), padding: isMobile ? '18px 16px' : '24px 20px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 14 : 16, alignItems: isMobile ? 'center' : 'stretch' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{plan.emoji}</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: isCurrent ? plan.accent : colors.text }}>{plan.name}</span>
                      </div>
                      {isCurrent && <span style={{ fontSize: 11, color: '#22c55e', fontFamily: 'Outfit, sans-serif', fontWeight: 700, background: '#F0FFF8', padding: '2px 8px', borderRadius: 99 }}>✓ Actuel</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 40, color: colors.text, letterSpacing: '-1px' }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{plan.period}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircle2 size={15} color={isCurrent ? plan.accent : colors.muted} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button onClick={() => upgrade(plan.id)} disabled={isCurrent || plan.id === 'free' || loading === plan.id}
                    whileHover={!isCurrent && plan.id !== 'free' ? { y: -2 } : {}} whileTap={!isCurrent && plan.id !== 'free' ? { y: 2 } : {}}
                    style={{ padding: '13px', borderRadius: 14, border: '2px solid', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: isCurrent || plan.id === 'free' ? 'default' : 'pointer', opacity: isCurrent || plan.id === 'free' ? 0.5 : 1, transition: 'all 0.15s',
                      ...(isCurrent || plan.id === 'free'
                        ? { background: colors.surface2, borderColor: colors.border, color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}` }
                        : { background: plan.accent, borderColor: plan.accent, color: plan.accent === '#C8FF00' ? colors.limeText : '#fff', boxShadow: `0 4px 0 ${shadowColor}` }
                      )
                    }}>
                    {loading === plan.id ? 'Redirection…' : plan.cta}
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Badges collection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text }}>Mes badges</h2>
            <span style={{ fontSize: 12, color: colors.muted, background: colors.surface2, border: `1px solid ${colors.border}`, padding: '3px 10px', borderRadius: 99 }}>{earnedBadgeIds.size}/{BADGES.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 10 }}>
            {BADGES.map(badge => {
              const earned = earnedBadgeIds.has(badge.id)
              const rarity = RARITY_COLORS[badge.rarity]
              return (
                <motion.div key={badge.id} whileHover={earned ? { y: -3 } : {}}
                  style={{ background: earned ? rarity.bg : colors.surface2, border: `2px solid ${earned ? rarity.border : colors.border}`, borderRadius: 18, padding: '12px 8px', textAlign: 'center', boxShadow: earned ? `0 4px 0 ${rarity.shadow}40` : `0 4px 0 ${colors.border2}`, opacity: earned ? 1 : 0.35, transition: 'all 0.15s' }}>
                  <div style={{ fontSize: earned ? 28 : 24, marginBottom: 6, filter: earned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, color: earned ? rarity.color : colors.muted, lineHeight: 1.2 }}>{badge.name}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Notifications */}
        <NotificationPrefs profile={profile} colors={colors} />

        {/* Profile info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
          style={{ ...card(), marginTop: 20, padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>Informations du compte</h3>
          {[
            { label: 'Prénom', value: profile?.full_name ?? '—' },
            { label: 'Email', value: profile?.email ?? '—' },
            { label: 'Uploads ce mois', value: String(profile?.uploads_count ?? 0) },
            { label: 'Streak', value: `${profile?.streak_days ?? 0} jours 🔥` },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
              <span style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{row.label}</span>
              <span style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
