'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

const STEPS = [
  {
    emoji: '👋',
    title: 'Bienvenue sur PASS',
    subtitle: "Le Duolingo de la révision",
    content: [
      { icon: '📤', text: 'Upload un PDF de cours — l\'IA génère tes fiches en 30s' },
      { icon: '🧠', text: 'Révise avec le système de répétition espacée — comme Anki mais stylé' },
      { icon: '🎯', text: 'Fais des QCM pour tester tes connaissances et booster ton score' },
      { icon: '⚡', text: 'Gagne de l\'XP, passe des niveaux, maintiens ton streak quotidien' },
    ],
  },
  {
    emoji: '🎯',
    title: 'Ton objectif quotidien',
    subtitle: 'Combien de fiches veux-tu réviser chaque jour ?',
    goals: [
      { val: 5,  label: 'Tranquille', desc: '5 min/jour', emoji: '😌' },
      { val: 10, label: 'Sérieux',    desc: '10 min/jour', emoji: '💪' },
      { val: 20, label: 'Acharné',    desc: '20 min/jour', emoji: '🔥' },
    ],
  },
  {
    emoji: '🚀',
    title: 'Upload ton premier cours',
    subtitle: 'Choisis un PDF, un Word, ou colle du texte — l\'IA fait le reste.',
    cta: true,
  },
  {
    emoji: '🎁',
    title: 'Invite tes amis',
    subtitle: 'Partage PASS à un ami → vous gagnez tous les deux 30 gems et 1 mois Premium offert.',
    referral: true,
  },
]

const GOALS = [5, 10, 20]

export default function OnboardingWizard({ onClose }: Props) {
  const { colors } = useTheme()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState(10)
  const [saving, setSaving] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(d => setReferralCode(d.referral_code ?? null)).catch(() => {})
  }, [])

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function finish(goUpload = false) {
    setSaving(true)
    try {
      await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily_goal: selectedGoal }) })
    } catch {}
    localStorage.setItem('pass-onboarded', '1')
    onClose()
    if (goUpload) router.push('/upload')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 40, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 28, padding: '36px 28px', maxWidth: 420, width: '100%', boxShadow: `0 8px 0 ${colors.border2}` }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 99, background: i === step ? colors.lime : colors.border, transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{current.emoji}</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: colors.text, marginBottom: 6 }}>{current.title}</h2>
          <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>{current.subtitle}</p>
        </div>

        {/* Step 1: features list */}
        {step === 0 && current.content && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {current.content.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: colors.surface2, border: `2px solid ${colors.border}`, borderRadius: 16, padding: '12px 16px' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <p style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Step 2: goal selection */}
        {step === 1 && current.goals && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {current.goals.map((g, i) => (
              <motion.div key={g.val} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedGoal(g.val)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: selectedGoal === g.val ? colors.limeBg : colors.surface2, border: `2px solid ${selectedGoal === g.val ? colors.lime : colors.border}`, borderRadius: 18, padding: '14px 18px', cursor: 'pointer', boxShadow: selectedGoal === g.val ? `0 4px 0 ${colors.limeDark}` : `0 4px 0 ${colors.border2}`, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 28 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: selectedGoal === g.val ? colors.limeDark : colors.text }}>{g.label}</p>
                  <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{g.val} fiches · {g.desc}</p>
                </div>
                {selectedGoal === g.val && <span style={{ fontSize: 18 }}>✓</span>}
              </motion.div>
            ))}
          </div>
        )}

        {/* Step 3: upload CTA */}
        {step === 2 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: `2px solid ${colors.limeBorder}`, borderRadius: 20, padding: '20px', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.7)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                PDF, Word, PowerPoint, texte copié-collé — l'IA génère entre 5 et 20 fiches de révision en quelques secondes.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: referral */}
        {step === 3 && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { emoji: '💎', text: '+30 gems pour toi et ton ami à l\'inscription' },
              { emoji: '⚡', text: 'Après 3 invitations : 1 mois Premium offert' },
              { emoji: '🔥', text: 'Tes amis accèdent à l\'app gratuitement' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: colors.surface2, border: `2px solid ${colors.border}`, borderRadius: 16, padding: '12px 16px' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{item.text}</p>
              </motion.div>
            ))}
            {referralCode && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: 'rgba(200,255,0,0.08)', border: `2px solid ${colors.lime}`, borderRadius: 16, padding: '14px 16px', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Code copié !') }}>
                <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>Ton code de parrainage</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: colors.lime, letterSpacing: '3px' }}>{referralCode}</p>
                <p style={{ fontSize: 11, color: colors.muted, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>Appuie pour copier</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Step 3 (upload): go to upload */}
          {step === 2 ? (
            <>
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 4 }}
                onClick={() => finish(true)} disabled={saving}
                style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                {saving ? 'Chargement…' : '🚀 Uploader mon premier cours'}
              </motion.button>
              <button onClick={() => setStep(3)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: colors.muted, padding: '10px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                Plus tard → voir les invitations
              </button>
            </>
          ) : !isLast ? (
            <motion.button whileHover={{ y: -2 }} whileTap={{ y: 4 }}
              onClick={() => setStep(s => s + 1)}
              style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
              Continuer →
            </motion.button>
          ) : (
            /* Step 4 (referral): share + finish */
            <>
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 4 }}
                onClick={async () => {
                  const text = `Je révise avec PASS — l'IA génère mes fiches en 30s 🧠⚡\nUtilise mon code ${referralCode ?? ''} pour t'inscrire et on gagne tous les deux des récompenses !\npass-saas.vercel.app`
                  if (navigator.share) { try { await navigator.share({ text }) } catch {} }
                  else { navigator.clipboard.writeText(text); toast.success('Lien copié !') }
                }}
                style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                📣 Inviter mes amis
              </motion.button>
              <button onClick={() => finish(false)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: colors.muted, padding: '10px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                Continuer sans inviter →
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
