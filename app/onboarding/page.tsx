'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Zap } from 'lucide-react'

const STEPS = [
  {
    emoji: '👋',
    title: 'Bienvenue sur PASS',
    subtitle: 'Révise 10x plus vite avec l\'IA',
    body: 'Upload n\'importe quel cours — PDF, Word, image ou texte — et reçois des fiches de révision + un QCM en moins de 30 secondes.',
    cta: 'C\'est parti',
  },
  {
    emoji: '🧠',
    title: 'Révise avec le bon rythme',
    subtitle: 'Répétition espacée',
    body: 'L\'app calcule exactement quand revoir chaque fiche pour que tu mémorises durablement. Plus tu révises, moins tu oublies.',
    cta: 'Compris',
  },
  {
    emoji: '🤖',
    title: 'Ton coach IA t\'attend',
    subtitle: 'Conseils personnalisés, pas de bullshit',
    body: 'Il connaît tes scores, tes points faibles et ta date d\'exam. Il te dit exactement quoi faire aujourd\'hui.',
    cta: 'Commencer',
    isLast: true,
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(10)
  const [loading, setLoading] = useState(false)
  const current = STEPS[step]

  async function next() {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }
    setLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_goal: goal }),
      })
      router.push('/upload')
    } catch { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0C0C10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 24, left: 24, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: '#F0F0F8', letterSpacing: '-0.5px' }}>
        PA<span style={{ color: '#C8FF00' }}>SS</span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 48 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ height: 4, width: i === step ? 28 : 16, borderRadius: 99, background: i <= step ? '#C8FF00' : '#2A2A38', transition: 'all 0.3s' }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>

          <div style={{ fontSize: 72, marginBottom: 24, lineHeight: 1 }}>{current.emoji}</div>

          <p style={{ fontSize: 11, fontWeight: 700, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>
            {current.subtitle}
          </p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F0F8', marginBottom: 16, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {current.title}
          </h1>
          <p style={{ fontSize: 15, color: '#6B6B88', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65, marginBottom: 36 }}>
            {current.body}
          </p>

          {'isLast' in current && current.isLast && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#14141A', border: '2px solid #2A2A38', borderRadius: 20, padding: '20px', marginBottom: 28, textAlign: 'left' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: '#F0F0F8', marginBottom: 12 }}>
                Combien de fiches par jour ?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setGoal(n)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 12, border: `2px solid ${goal === n ? '#C8FF00' : '#2A2A38'}`, background: goal === n ? 'rgba(200,255,0,0.1)' : '#1E1E28', color: goal === n ? '#8AAB00' : '#6B6B88', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {n}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#6B6B88', marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>
                ≈ {Math.round(goal * 2)} min de révision par jour
              </p>
            </motion.div>
          )}

          <motion.button onClick={next} disabled={loading}
            whileHover={{ y: -3 }} whileTap={{ y: 3 }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#C8FF00', color: '#0C0C10', border: 'none', borderRadius: 16, padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 5px 0 #8AAB00' }}>
            {loading ? <><Zap size={18} />Chargement…</> : <>{current.cta}<ChevronRight size={18} strokeWidth={3} /></>}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
