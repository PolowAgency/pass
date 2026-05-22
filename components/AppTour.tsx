'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Step {
  target: string | null   // sélecteur CSS, null = modal centré
  title: string
  text: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  emoji: string
}

const STEPS: Step[] = [
  {
    target: null,
    position: 'center',
    emoji: '👋',
    title: 'Bienvenue sur PASS !',
    text: 'En 30 secondes, ton cours devient des fiches de révision et des QCM. Laisse-moi te montrer comment ça marche.',
  },
  {
    target: '[data-tour="upload"]',
    position: 'right',
    emoji: '📤',
    title: 'Upload ton cours',
    text: 'Commence ici. PDF, photo, texte copié — peu importe. L\'IA génère automatiquement tes fiches et QCM.',
  },
  {
    target: '[data-tour="review"]',
    position: 'right',
    emoji: '🧠',
    title: 'Révision quotidienne',
    text: 'Chaque jour, PASS sélectionne les fiches à revoir au bon moment (répétition espacée). 5 minutes suffisent.',
  },
  {
    target: '[data-tour="coach"]',
    position: 'right',
    emoji: '🤖',
    title: 'Coach IA',
    text: 'Il connaît tes cours, tes scores, tes points faibles. Parle-lui, il ne mâche pas ses mots.',
  },
  {
    target: '[data-tour="streak"]',
    position: 'bottom',
    emoji: '🔥',
    title: 'Ton streak',
    text: 'Révise chaque jour pour maintenir la flamme. Plus ton streak est long, plus tu gagnes de gems et de badges.',
  },
  {
    target: '[data-tour="hearts"]',
    position: 'bottom',
    emoji: '❤️',
    title: 'Tes vies',
    text: 'Tu perds un cœur à chaque mauvaise réponse en QCM. Ils se rechargent automatiquement toutes les 4h.',
  },
  {
    target: '[data-tour="gems"]',
    position: 'bottom',
    emoji: '💎',
    title: 'Gems & Shop',
    text: 'Tu gagnes des gems sur chaque QCM réussi et chaque streak. Dépense-les pour récupérer des vies ou des freezes de streak.',
  },
  {
    target: null,
    position: 'center',
    emoji: '🚀',
    title: 'C\'est parti !',
    text: 'Lance ton premier cours pour commencer. Si t\'as des questions, le Coach IA est là 24h/24.',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function tooltipStyle(rect: Rect | null, position: Step['position'], isMobile: boolean): React.CSSProperties {
  const GAP = 16
  const W = isMobile ? Math.min(280, window.innerWidth - 32) : 300

  if (!rect || position === 'center') {
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: W, zIndex: 10001 }
  }

  const base: React.CSSProperties = { position: 'fixed', width: W, zIndex: 10001 }

  if (position === 'bottom') {
    return { ...base, top: rect.top + rect.height + GAP, left: Math.max(12, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 12)) }
  }
  if (position === 'top') {
    return { ...base, top: rect.top - GAP - 160, left: Math.max(12, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 12)) }
  }
  if (position === 'right') {
    const left = rect.left + rect.width + GAP
    // Sur mobile la sidebar est en bas — force un placement centré-haut
    if (isMobile || left + W > window.innerWidth - 12) {
      return { ...base, bottom: 90 + GAP, left: Math.max(12, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 12)) }
    }
    return { ...base, top: Math.max(12, rect.top + rect.height / 2 - 80), left }
  }
  if (position === 'left') {
    return { ...base, top: Math.max(12, rect.top + rect.height / 2 - 80), left: rect.left - W - GAP }
  }
  return base
}

interface Props { onDone: () => void }

export default function AppTour({ onDone }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const current = STEPS[step]

  const measure = useCallback(() => {
    if (!current.target) { setRect(null); return }
    const r = getRect(current.target)
    setRect(r)
  }, [current.target])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  function finish() {
    localStorage.setItem('pass-tour-done', '1')
    onDone()
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1
  const hasTarget = !!current.target && !!rect

  const PAD = 10
  const highlightRect = hasTarget && rect ? {
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  } : null

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
      >
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', pointerEvents: 'all' }} onClick={finish} />

        {/* Spotlight — découpe le fond autour de l'élément ciblé */}
        <AnimatePresence mode="wait">
          {highlightRect && (
            <motion.div
              key={current.target}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              style={{
                position: 'absolute',
                top:    highlightRect.top,
                left:   highlightRect.left,
                width:  highlightRect.width,
                height: highlightRect.height,
                borderRadius: 18,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px #C8FF00`,
                pointerEvents: 'none',
                zIndex: 10000,
              }}
            />
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              ...tooltipStyle(rect, current.position, isMobile),
              background: colors.surface,
              border: `2px solid ${colors.lime}`,
              borderRadius: 20,
              padding: isMobile ? '18px 16px' : '22px 20px',
              boxShadow: `0 8px 0 ${colors.limeDark}, 0 20px 48px rgba(0,0,0,0.5)`,
              pointerEvents: 'all',
            }}
          >
            {/* Step count + skip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: colors.muted }}>
                {step + 1} / {STEPS.length}
              </span>
              <button onClick={finish}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 8 }}>
                <X size={13} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }}>Passer</span>
              </button>
            </div>

            {/* Content */}
            <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: 10, lineHeight: 1 }}>{current.emoji}</div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 15 : 17, color: colors.text, marginBottom: 8, lineHeight: 1.25 }}>
              {current.title}
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? 13 : 14, color: colors.muted, lineHeight: 1.55, marginBottom: 18 }}>
              {current.text}
            </p>

            {/* Progress dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 99, background: i === step ? colors.lime : colors.border, border: 'none', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }} />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirst && (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={prev}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, background: colors.surface2, border: `1px solid ${colors.border}`, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text, boxShadow: `0 3px 0 ${colors.border2}` }}>
                  <ArrowLeft size={14} />
                </motion.button>
              )}
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={next}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, background: colors.lime, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: colors.limeText, boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                {isLast ? '🚀 C\'est parti !' : <><span>Suivant</span><ArrowRight size={15} /></>}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
