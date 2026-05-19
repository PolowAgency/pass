'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, RotateCcw, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { awardXP, XP_REWARDS } from '@/lib/xp'
import LevelUpModal from '@/components/LevelUpModal'
import BadgeUnlockModal from '@/components/BadgeUnlockModal'
import { checkAndAwardBadges } from '@/lib/badges'
import type { BadgeDef } from '@/lib/badges'

const PERFECT_MSGS  = ["Carton plein. T'assures.", "100%. T'as rien à prouver, et pourtant.", "Perfect score. Pas d'accident."]
const GOOD_MSGS     = ["Bon boulot. Encore un push.", "Presque parfait. La prochaine.", "C'est solide. Ça monte."]
const OK_MSGS       = ["C'est un début. Revois les fiches.", "Mi-chemin. La moitié forte t'attend.", "On a vu mieux mais t'as pas abandonné."]
const BAD_MSGS      = ["Reprends les bases, ça va venir.", "Dur dur. Mais les champions ont tous commencé là.", "0 à Paris. Révise et reviens."]

function getMsg(pct: number) {
  const pool = pct >= 80 ? PERFECT_MSGS : pct >= 60 ? GOOD_MSGS : pct >= 40 ? OK_MSGS : BAD_MSGS
  return pool[Math.floor(Math.random() * pool.length)]
}

interface Props { cours: { id: string; title: string; subject: string | null; exam_date?: string | null }; questions: Question[]; userId: string; totalAvailable?: number }

export default function QcmView({ cours, questions, userId, totalAvailable }: Props) {
  const { colors } = useTheme()
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([])
  const [resultMsg] = useState(() => '')

  const q = questions[idx]
  const total = questions.length
  const progress = ((idx + (revealed ? 1 : 0)) / total) * 100
  const selected = answers[idx]
  const isCorrect = selected === q.correct_answer

  function pick(i: number) {
    if (revealed) return
    setAnswers(p => ({ ...p, [idx]: i }))
    setRevealed(true)
    if (i !== q.correct_answer) { setShakeIdx(i); setTimeout(() => setShakeIdx(null), 450) }
  }

  async function next() {
    if (idx < total - 1) { setIdx(i => i + 1); setRevealed(false) }
    else {
      setSaving(true)
      const score = questions.reduce((a, q, i) => a + (answers[i] === q.correct_answer ? 1 : 0), 0)
      const supabase = createClient()
      await supabase.from('qcm_sessions').insert({ user_id: userId, cours_id: cours.id, score, total_questions: total, answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [questions[+k].id, v])) })
      const pct = Math.round((score / total) * 100)
      const { data: cd } = await supabase.from('cours').select('prep_score').eq('id', cours.id).single()
      await supabase.from('cours').update({ prep_score: Math.min(100, Math.round((cd?.prep_score ?? 0) * 0.7 + pct * 0.3)) }).eq('id', cours.id)
      const xpKey = pct >= 80 ? 'complete_qcm_perfect' : pct >= 60 ? 'complete_qcm_good' : pct >= 40 ? 'complete_qcm_ok' : 'complete_qcm_bad'
      const result = await awardXP(xpKey)
      if (result?.leveledUp && result.level) setTimeout(() => setLevelUp(result.level!), 800)
      checkAndAwardBadges().then(b => { if (b.length > 0) setNewBadges(b) })
      setSaving(false); setPhase('result')
    }
  }

  if (phase === 'result') {
    const score = questions.reduce((a, q, i) => a + (answers[i] === q.correct_answer ? 1 : 0), 0)
    const pct = Math.round((score / total) * 100)
    const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? colors.limeDark : pct >= 40 ? '#FB923C' : '#f87171'
    const scoreShadow = pct >= 80 ? '#15803d' : pct >= 60 ? colors.limeDark : pct >= 40 ? '#CC6600' : '#CC2200'
    const xpEarned = XP_REWARDS[pct >= 80 ? 'complete_qcm_perfect' : pct >= 60 ? 'complete_qcm_good' : pct >= 40 ? 'complete_qcm_ok' : 'complete_qcm_bad']
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '💪' : pct >= 40 ? '📚' : '😅'
    const msg = getMsg(pct)

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        <AnimatePresence>
          {levelUp && <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />}
        </AnimatePresence>
        <AnimatePresence>
          {newBadges.length > 0 && !levelUp && <BadgeUnlockModal badges={newBadges} onClose={() => setNewBadges([])} />}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 16 }}
          style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>{emoji}</div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: colors.surface, border: `3px solid ${scoreColor}`, borderRadius: 24, padding: '28px', marginBottom: 16, boxShadow: `0 6px 0 ${scoreShadow}` }}>
            <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>Ton score</p>
            <motion.p initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', damping: 12 }}
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 80, color: scoreColor, letterSpacing: '-2px', lineHeight: 1 }}>{pct}%</motion.p>
            <p style={{ fontSize: 14, color: colors.muted, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{score}/{total} bonnes réponses</p>
            <div style={{ height: 12, background: colors.surface2, borderRadius: 99, margin: '18px 0 0', overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 99, background: scoreColor }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, borderRadius: 99, padding: '8px 18px', marginBottom: 12, boxShadow: `0 3px 0 ${colors.limeDark}` }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.limeDark }}>+{xpEarned} XP gagnés</span>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 24, fontStyle: 'italic' }}>
            "{msg}"
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              whileHover={{ y: -3 }} whileTap={{ y: 4 }}
              onClick={() => { setPhase('quiz'); setIdx(0); setAnswers({}); setRevealed(false) }}
              style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 5px 0 ${colors.limeDark}` }}>
              <RotateCcw size={16} />Recommencer
            </motion.button>
            <Link href={`/cours/${cours.id}`}>
              <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                style={{ width: '100%', background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 5px 0 ${colors.border2}` }}>
                <BookOpen size={16} />Revoir les fiches
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <button style={{ width: '100%', background: 'transparent', border: 'none', color: colors.muted, borderRadius: 14, padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
                ← Dashboard
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href={`/cours/${cours.id}`}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ width: 40, height: 40, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}` }}>
              <ArrowLeft size={16} />
            </motion.button>
          </Link>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 5 }}>
            {cours.title} · {idx + 1}/{total}
            {totalAvailable && totalAvailable > total && <span style={{ color: colors.limeDark }}> · {totalAvailable - total} autres dispo</span>}
          </p>
            <div style={{ height: 12, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 8px rgba(200,255,0,0.4)' }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 40, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}>

            <div style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: `2px solid ${colors.border}`, borderRadius: 22, padding: '26px', marginBottom: 16, boxShadow: '0 5px 0 #0A0A1A' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: '#F0F0F8', lineHeight: 1.4 }}>{q.question}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {(q.options as string[]).map((opt, i) => {
                const isRight = i === q.correct_answer
                const isSel = selected === i
                let bg: string = colors.surface, border: string = colors.border, color: string = colors.text, shadow: string = colors.border2
                if (revealed) {
                  if (isRight)    { bg = 'rgba(34,197,94,0.1)';   border = '#22c55e'; color = '#22c55e'; shadow = '#15803d' }
                  else if (isSel) { bg = 'rgba(248,113,113,0.1)'; border = '#f87171'; color = '#f87171'; shadow = '#CC2200' }
                  else            { color = colors.muted }
                } else if (isSel) { bg = colors.limeBg; border = colors.lime; shadow = colors.limeDark }

                return (
                  <motion.div key={i}
                    animate={shakeIdx === i ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
                    transition={{ duration: 0.35 }}>
                    <motion.button onClick={() => pick(i)}
                      whileHover={!revealed ? { y: -3 } : {}} whileTap={!revealed ? { y: 3 } : {}}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', background: bg, border: `2px solid ${border}`, borderRadius: 18, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', width: '100%', boxShadow: `0 5px 0 ${shadow}`, transition: 'background 0.12s, border-color 0.12s' }}>
                      <span style={{ width: 32, height: 32, borderRadius: 10, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color, flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ fontSize: 14, fontFamily: 'DM Sans, sans-serif', color, flex: 1 }}>{opt}</span>
                      {revealed && isRight && <CheckCircle2 size={20} color="#22c55e" />}
                      {revealed && isSel && !isRight && <XCircle size={20} color="#f87171" />}
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>

            <AnimatePresence>
              {revealed && q.explanation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ padding: '14px 18px', borderRadius: 18, marginBottom: 14, border: `2px solid ${isCorrect ? '#22c55e' : '#f87171'}`, background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)', boxShadow: `0 4px 0 ${isCorrect ? '#15803d' : '#CC2200'}` }}>
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: isCorrect ? '#22c55e' : '#f87171', marginBottom: 5, fontFamily: 'Outfit, sans-serif' }}>
                    {isCorrect ? '✓ Correct !' : '✗ Pas tout à fait'}
                  </p>
                  <p style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {revealed && (
              <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}
                onClick={next} disabled={saving} whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 18, padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 5px 0 ${colors.limeDark}` }}>
                {saving ? 'Sauvegarde…' : idx < total - 1 ? <><span>Question suivante</span><ArrowRight size={16} /></> : <><Trophy size={16} />Voir mes résultats</>}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
