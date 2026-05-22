'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, RotateCcw, BookOpen, ZoomIn, X, Heart } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { awardXP, awardGems, XP_REWARDS, GEMS_REWARDS } from '@/lib/xp'
import { playSound } from '@/lib/sounds'
import { celebrate } from '@/lib/confetti'
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

type QuestionWithImage = Question & { fiche_image_url?: string | null }
interface Props {
  cours: { id: string; title: string; subject: string | null; exam_date?: string | null }
  questions: QuestionWithImage[]
  userId: string
  totalAvailable?: number
  initialHearts: number
  initialGems: number
  plan: string
  mode?: 'rapide' | 'complet'
}

export default function QcmView({ cours, questions, userId, totalAvailable, initialHearts, initialGems, plan, mode = 'rapide' }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const isPremium = plan === 'premium' || plan === 'exam'

  const [phase, setPhase] = useState<'quiz' | 'result' | 'dead'>('quiz')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [shakeHeart, setShakeHeart] = useState(false)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([])
  const [hearts, setHearts] = useState(initialHearts)
  const [gems, setGems] = useState(initialGems)
  const [refillingGems, setRefillingGems] = useState(false)
  const [gemsEarned, setGemsEarned] = useState(0)

  const q = questions[idx]
  const total = questions.length
  const progress = ((idx + (revealed ? 1 : 0)) / total) * 100
  const selected = answers[idx]
  const isCorrect = selected === q.correct_answer

  async function pick(i: number) {
    if (revealed) return
    setAnswers(p => ({ ...p, [idx]: i }))
    setRevealed(true)

    if (i === q.correct_answer) {
      playSound('correct')
      celebrate('correct')
    } else {
      playSound('wrong')
      setShakeIdx(i)
      setTimeout(() => setShakeIdx(null), 450)

      if (!isPremium) {
        const supabase = createClient()
        const { data } = await supabase.rpc('lose_heart', { p_user_id: userId })
        const result = data?.[0] as { hearts_left: number; is_dead: boolean } | undefined
        if (result) {
          setShakeHeart(true)
          setTimeout(() => setShakeHeart(false), 600)
          setHearts(result.hearts_left)
          if (result.is_dead) setTimeout(() => setPhase('dead'), 700)
        }
      }
    }
  }

  async function next() {
    if (idx < total - 1) { setIdx(i => i + 1); setRevealed(false) }
    else {
      setSaving(true)
      const finalAnswers = { ...answers }
      const score = questions.reduce((a, q, i) => a + (finalAnswers[i] === q.correct_answer ? 1 : 0), 0)
      const supabase = createClient()
      const { data: session } = await supabase.from('qcm_sessions').insert({
        user_id: userId, cours_id: cours.id, score, total_questions: total,
        answers: Object.fromEntries(Object.entries(finalAnswers).map(([k, v]) => [questions[+k].id, v]))
      }).select('id').single()
      const pct = Math.round((score / total) * 100)
      const { data: cd } = await supabase.from('cours').select('prep_score').eq('id', cours.id).single()
      await supabase.from('cours').update({ prep_score: Math.min(100, Math.round((cd?.prep_score ?? 0) * 0.7 + pct * 0.3)) }).eq('id', cours.id)
      const xpKey = pct >= 80 ? 'complete_qcm_perfect' : pct >= 60 ? 'complete_qcm_good' : pct >= 40 ? 'complete_qcm_ok' : 'complete_qcm_bad'
      const gemsKey = pct >= 80 ? 'complete_qcm_perfect' : pct >= 60 ? 'complete_qcm_good' : pct >= 40 ? 'complete_qcm_ok' : null
      const [result, gemsResult] = await Promise.all([
        awardXP(xpKey, session?.id ?? undefined),
        gemsKey ? awardGems(gemsKey, session?.id ?? undefined) : Promise.resolve(null),
        supabase.rpc('update_streak_on_activity', { p_user_id: userId }),
      ])
      if (result?.leveledUp && result.level) {
        setTimeout(() => { setLevelUp(result.level!); playSound('levelup'); celebrate('levelup') }, 800)
      }
      if (gemsResult?.earned) { setGemsEarned(gemsResult.earned); setGems(gemsResult.gems) }
      if (pct === 100) { playSound('perfect'); celebrate('perfect') }
      checkAndAwardBadges().then(b => { if (b.length > 0) { setNewBadges(b); playSound('badge'); celebrate('badge') } })
      setSaving(false); setPhase('result')
    }
  }

  async function refillWithGems() {
    if (gems < 10 || refillingGems) return
    setRefillingGems(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('refill_heart', { p_user_id: userId, p_use_gems: true })
    const result = data?.[0] as { hearts_left: number; gems_left: number; success: boolean } | undefined
    if (result?.success) {
      setHearts(result.hearts_left)
      setGems(result.gems_left)
      setPhase('quiz')
    }
    setRefillingGems(false)
  }

  // ─── Hearts display ───────────────────────────────────────────────
  function HeartsBar() {
    if (isPremium) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Heart size={14} fill="#f87171" color="#f87171" />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: '#f87171' }}>∞</span>
      </div>
    )
    const maxH = Math.min(hearts + 2, 5)
    return (
      <motion.div animate={shakeHeart ? { x: [-4, 4, -3, 3, 0] } : {}} transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 4, flexShrink: 0 }}>
        {isMobile ? (
          <>
            <Heart size={14} fill={hearts > 0 ? '#f87171' : 'transparent'} color="#f87171" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 13, color: hearts > 0 ? '#f87171' : colors.muted }}>
              {hearts}
            </span>
          </>
        ) : (
          Array.from({ length: maxH }).map((_, i) => (
            <Heart key={i} size={16}
              fill={i < hearts ? '#f87171' : 'transparent'}
              color={i < hearts ? '#f87171' : colors.muted}
              strokeWidth={i < hearts ? 0 : 1.5} />
          ))
        )}
      </motion.div>
    )
  }

  // ─── Dead screen ──────────────────────────────────────────────────
  if (phase === 'dead') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
        <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18 }}
          style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>

          <motion.div
            animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize: isMobile ? 72 : 90, marginBottom: 20, lineHeight: 1 }}>💔</motion.div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 22 : 26, color: '#f87171', marginBottom: 8 }}>
            Tu n&apos;as plus de vies !
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: colors.muted, marginBottom: 28, lineHeight: 1.6 }}>
            Un cœur se recharge toutes les 4h.<br />
            Ou utilise tes gems pour continuer maintenant.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, padding: '10px 16px', borderRadius: 12, background: colors.surface2, border: `1px solid ${colors.border}`, width: 'fit-content', margin: '0 auto 24px' }}>
            <span style={{ fontSize: 18 }}>💎</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text }}>
              {gems} gem{gems !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gems >= 10 ? (
              <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }} onClick={refillWithGems} disabled={refillingGems}
                style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 16, padding: isMobile ? '16px' : '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: refillingGems ? 'not-allowed' : 'pointer', boxShadow: '0 5px 0 #CC2200', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Heart size={16} fill="#fff" color="#fff" />
                {refillingGems ? 'Chargement…' : 'Continuer (10 💎)'}
              </motion.button>
            ) : (
              <div style={{ padding: '14px', borderRadius: 16, background: colors.surface2, border: `2px solid ${colors.border}`, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: colors.muted }}>
                Pas assez de gems (il t&apos;en faut 10)
              </div>
            )}

            <Link href={`/cours/${cours.id}`}>
              <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                style={{ width: '100%', background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 16, padding: isMobile ? '14px' : '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <BookOpen size={16} />Voir les fiches
              </motion.button>
            </Link>

            <Link href="/dashboard">
              <button style={{ width: '100%', background: 'transparent', border: 'none', color: colors.muted, padding: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
                ← Dashboard
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Result screen ────────────────────────────────────────────────
  if (phase === 'result') {
    const score = questions.reduce((a, q, i) => a + (answers[i] === q.correct_answer ? 1 : 0), 0)
    const pct = Math.round((score / total) * 100)
    const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? colors.limeDark : pct >= 40 ? '#FB923C' : '#f87171'
    const scoreShadow = pct >= 80 ? '#15803d' : pct >= 60 ? colors.limeDark : pct >= 40 ? '#CC6600' : '#CC2200'
    const xpEarned = XP_REWARDS[pct >= 80 ? 'complete_qcm_perfect' : pct >= 60 ? 'complete_qcm_good' : pct >= 40 ? 'complete_qcm_ok' : 'complete_qcm_bad']
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '💪' : pct >= 40 ? '📚' : '😅'
    const msg = getMsg(pct)

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 24 }}>
        <AnimatePresence>
          {levelUp && <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />}
        </AnimatePresence>
        <AnimatePresence>
          {newBadges.length > 0 && !levelUp && <BadgeUnlockModal badges={newBadges} onClose={() => setNewBadges([])} />}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 16 }}
          style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? 64 : 80, marginBottom: 16 }}>{emoji}</div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: colors.surface, border: `3px solid ${scoreColor}`, borderRadius: 24, padding: isMobile ? '22px 20px' : '28px', marginBottom: 16, boxShadow: `0 6px 0 ${scoreShadow}` }}>
            <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>Ton score</p>
            <motion.p initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', damping: 12 }}
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 64 : 80, color: scoreColor, letterSpacing: '-2px', lineHeight: 1 }}>{pct}%</motion.p>
            <p style={{ fontSize: 14, color: colors.muted, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>{score}/{total} bonnes réponses</p>
            <div style={{ height: 12, background: colors.surface2, borderRadius: 99, margin: '18px 0 0', overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 99, background: scoreColor }} />
            </div>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, borderRadius: 99, padding: '8px 18px', boxShadow: `0 3px 0 ${colors.limeDark}` }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.limeDark }}>+{xpEarned} XP</span>
            </motion.div>
            {gemsEarned > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.6, type: 'spring', damping: 14 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(96,165,250,0.12)', border: '2px solid rgba(96,165,250,0.4)', borderRadius: 99, padding: '8px 18px', boxShadow: '0 3px 0 #1D4ED8' }}>
                <span style={{ fontSize: 16 }}>💎</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#60A5FA' }}>+{gemsEarned} gems</span>
              </motion.div>
            )}
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 15 : 17, color: colors.text, marginBottom: 24, fontStyle: 'italic', padding: '0 8px' }}>
            &ldquo;{msg}&rdquo;
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Encore 10 questions — CTA principal en mode rapide */}
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              whileHover={{ y: -3 }} whileTap={{ y: 4 }}
              onClick={() => window.location.href = `/qcm/${cours.id}?mode=rapide`}
              style={{ background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: isMobile ? '14px' : '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 5px 0 ${colors.limeDark}` }}>
              🔥 {mode === 'rapide' ? 'Encore 10 questions' : 'Recommencer'}
            </motion.button>
            {mode === 'complet' && (
              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                onClick={() => window.location.href = `/qcm/${cours.id}?mode=rapide`}
                style={{ background: colors.surface2, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: 16, padding: isMobile ? '12px' : '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 0 ${colors.border2}` }}>
                <RotateCcw size={14} />Session rapide (10 questions)
              </motion.button>
            )}
            <Link href={`/cours/${cours.id}`}>
              <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                style={{ width: '100%', background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 16, padding: isMobile ? '14px' : '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 5px 0 ${colors.border2}` }}>
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

  // ─── Quiz screen ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '16px 14px' : '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header : back + progress + hearts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 16 : 24 }}>
          <Link href={`/cours/${cours.id}`}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 12, background: colors.surface, border: `2px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, boxShadow: `0 3px 0 ${colors.border2}`, flexShrink: 0 }}>
              <ArrowLeft size={isMobile ? 14 : 16} />
            </motion.button>
          </Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            {!isMobile && (
              <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cours.title} · {idx + 1}/{total}
                {totalAvailable && totalAvailable > total && <span style={{ color: colors.limeDark }}> · {totalAvailable - total} autres dispo</span>}
              </p>
            )}
            <div style={{ height: isMobile ? 10 : 12, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 8px rgba(200,255,0,0.4)' }} />
            </div>
          </div>

          {/* Counter + hearts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flexShrink: 0 }}>
            {isMobile && (
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.muted }}>{idx + 1}/{total}</span>
            )}
            <HeartsBar />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, x: 40, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}>

            {/* Question card */}
            <div style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: `2px solid ${colors.border}`, borderRadius: isMobile ? 18 : 22, padding: isMobile ? '18px 16px' : '26px', marginBottom: 12, boxShadow: '0 5px 0 #0A0A1A' }}>
              {q.fiche_image_url && <QcmImage src={q.fiche_image_url} />}
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: '#F0F0F8', lineHeight: 1.4 }}>{q.question}</p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10, marginBottom: 12 }}>
              {(q.options as string[]).map((opt, i) => {
                const isRight = i === q.correct_answer
                const isSel = selected === i
                let bg = colors.surface, border = colors.border, color = colors.text, shadow = colors.border2
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
                      whileHover={!revealed ? { y: -2 } : {}} whileTap={!revealed ? { y: 2 } : {}}
                      style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, padding: isMobile ? '13px 14px' : '15px 16px', background: bg, border: `2px solid ${border}`, borderRadius: isMobile ? 14 : 18, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', width: '100%', boxShadow: `0 4px 0 ${shadow}`, transition: 'background 0.12s, border-color 0.12s' }}>
                      <span style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 9, border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, color, flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ fontSize: isMobile ? 13 : 14, fontFamily: 'DM Sans, sans-serif', color, flex: 1, lineHeight: 1.4 }}>{opt}</span>
                      {revealed && isRight && <CheckCircle2 size={isMobile ? 18 : 20} color="#22c55e" />}
                      {revealed && isSel && !isRight && <XCircle size={isMobile ? 18 : 20} color="#f87171" />}
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {revealed && q.explanation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ padding: isMobile ? '12px 14px' : '14px 18px', borderRadius: isMobile ? 14 : 18, marginBottom: 12, border: `2px solid ${isCorrect ? '#22c55e' : '#f87171'}`, background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)', boxShadow: `0 4px 0 ${isCorrect ? '#15803d' : '#CC2200'}` }}>
                  <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: isCorrect ? '#22c55e' : '#f87171', marginBottom: 5, fontFamily: 'Outfit, sans-serif' }}>
                    {isCorrect ? '✓ Correct !' : '✗ Pas tout à fait'}
                  </p>
                  <p style={{ fontSize: isMobile ? 12 : 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            {revealed && (
              <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}
                onClick={next} disabled={saving} whileHover={{ y: -3 }} whileTap={{ y: 4 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: isMobile ? 14 : 18, padding: isMobile ? '16px' : '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 5px 0 ${colors.limeDark}` }}>
                {saving ? 'Sauvegarde…' : idx < total - 1
                  ? <><span>Question suivante</span><ArrowRight size={16} /></>
                  : <><Trophy size={16} />Voir mes résultats</>}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function QcmImage({ src }: { src: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <div onClick={() => setOpen(true)}
        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 16, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)' }}>
        <img src={src} alt="Schéma" style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ZoomIn size={12} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans, sans-serif' }}>Agrandir</span>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
            <motion.img src={src} alt="Schéma"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()} />
            <button onClick={close}
              style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
