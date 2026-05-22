'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Fiche } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, Lightbulb, Tag, Zap, ZoomIn } from 'lucide-react'
import { awardXP, awardGems, XP_REWARDS } from '@/lib/xp'
import { playSound } from '@/lib/sounds'
import { celebrate } from '@/lib/confetti'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import LevelUpModal from '@/components/LevelUpModal'
import GoalModal from '@/components/GoalModal'
import BadgeUnlockModal from '@/components/BadgeUnlockModal'
import PageBg from '@/components/PageBg'
import { checkAndAwardBadges } from '@/lib/badges'
import type { BadgeDef } from '@/lib/badges'

interface Props {
  fiches: (Fiche & { cours: { title: string; subject: string | null } | null })[]
  profile: { daily_goal: number; daily_reviewed: number; xp: number; level: number; streak_days: number } | null
  userId: string
}

const MOTIVATIONS = [
  "La discipline bat la motivation. Chaque. Fois.",
  "Ceux qui révisent dominent. C'est mathématique.",
  "Une fiche de plus, un exam de moins stressant.",
  "Le cerveau oublie en 24h. Toi tu bats ce délai.",
  "T'as failli zapper. Mais t'es là. Respect.",
  "Pas d'effort, pas de résultat. T'as pas le choix.",
]

export default function ReviewView({ fiches, profile, userId }: Props) {
  const { colors } = useTheme()
  const [queue] = useState(fiches)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const [done, setDone] = useState(false)
  const [xpPopup, setXpPopup] = useState<number | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalXP, setGoalXP] = useState(0)
  const [shake, setShake] = useState(false)
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([])
  const [motivIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONS.length))

  const fiche = queue[current]
  const total = queue.length
  const progress = total > 0 ? (current / total) * 100 : 0

  async function answer(memorized: boolean) {
    if (!fiche) return
    if (!memorized) {
      setShake(true)
      setTimeout(() => setShake(false), 450)
    }
    const supabase = createClient()
    const newCount = fiche.review_count + 1

    // SM-2 : qualité 5 = bien su, 2 = à revoir
    const quality = memorized ? 5 : 2
    const ef = fiche.ease_factor ?? 2.5
    const reps = (fiche as { sm2_repetitions?: number }).sm2_repetitions ?? 0
    const prevInterval = (fiche as { interval_days?: number }).interval_days ?? 1

    let newEF = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    let newReps: number
    let newInterval: number

    if (quality < 3) {
      newReps = 0
      newInterval = 1
    } else if (reps === 0) {
      newReps = 1; newInterval = 1
    } else if (reps === 1) {
      newReps = 2; newInterval = 6
    } else {
      newReps = reps + 1
      newInterval = Math.round(prevInterval * newEF)
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newInterval)

    await supabase.from('fiches').update({
      memorized: newReps >= 3 && quality >= 3,
      review_count: newCount,
      last_reviewed: new Date().toISOString(),
      next_review: nextReview.toISOString().split('T')[0],
      ease_factor: newEF,
      interval_days: newInterval,
      sm2_repetitions: newReps,
    }).eq('id', fiche.id)

    const newReviewed = reviewed + 1
    await supabase.rpc('increment_daily_reviewed', { p_user_id: userId })
    await supabase.rpc('update_streak_on_activity', { p_user_id: userId })

    if (memorized) {
      playSound('correct')
      const result = await awardXP('memorize_fiche')
      if (result) {
        setXpGained(x => x + XP_REWARDS.memorize_fiche)
        setXpPopup(XP_REWARDS.memorize_fiche)
        setTimeout(() => setXpPopup(null), 1400)
        if (result.leveledUp && result.level) {
          setTimeout(() => { setLevelUp(result.level); playSound('levelup'); celebrate('levelup') }, 600)
        }
        checkAndAwardBadges().then(b => { if (b.length > 0) { setNewBadges(b); playSound('badge'); celebrate('badge') } })
      }
    } else {
      playSound('wrong')
    }

    setReviewed(newReviewed)
    setFlipped(false)

    const totalReviewed = (profile?.daily_reviewed ?? 0) + newReviewed
    const goal = profile?.daily_goal ?? 5
    if (totalReviewed >= goal && totalReviewed - 1 < goal) {
      awardGems('daily_goal')
      setTimeout(() => { setGoalXP(xpGained + (memorized ? XP_REWARDS.memorize_fiche : 0)); setShowGoalModal(true) }, 700)
      return
    }
    if (current + 1 >= total) setDone(true)
    else setTimeout(() => setCurrent(i => i + 1), 200)
  }

  // ── Empty state ──
  if (total === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <PageBg />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 18 }}
        style={{ textAlign: 'center', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Tout à jour</p>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: colors.text, marginBottom: 12, letterSpacing: '-0.5px' }}>Rien à réviser !</h2>
        <p style={{ fontSize: 15, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 32, lineHeight: 1.6 }}>
          Toutes tes fiches sont à jour. Reviens demain ou ajoute un cours.
        </p>
        <Link href="/dashboard">
          <motion.button whileHover={{ y: -2, boxShadow: '0 0 28px rgba(200,255,0,0.3), 0 6px 0 #4A7400' }} whileTap={{ y: 3 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8FF00', color: '#0C0C10', border: 'none', borderRadius: 100, padding: '14px 28px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #4A7400', transition: 'all 0.2s' }}>
            Retour au dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )

  // ── Done state ──
  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <PageBg />
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 16 }}
        style={{ textAlign: 'center', maxWidth: 420, width: '100%', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 0.1 }}
          style={{ fontSize: 80, marginBottom: 20, display: 'block' }}>🏆</motion.div>

        <p style={{ fontSize: 11, fontWeight: 700, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>Session terminée</p>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: colors.text, marginBottom: 8, letterSpacing: '-0.5px' }}>
          {reviewed} fiche{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''}
        </h2>
        <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', marginBottom: 28, lineHeight: 1.6 }}>
          &ldquo;{MOTIVATIONS[motivIdx]}&rdquo;
        </p>

        {xpGained > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', borderRadius: 100, padding: '10px 24px', marginBottom: 28, boxShadow: '0 0 20px rgba(200,255,0,0.15)' }}>
            <Zap size={16} color="#C8FF00" fill="#C8FF00" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#C8FF00' }}>+{xpGained} XP</span>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { emoji: '📚', val: String(reviewed), label: 'Révisées', color: '#3CEFFF' },
            { emoji: '⚡', val: `+${xpGained}`, label: 'XP gagnés', color: '#C8FF00' },
            { emoji: '🔥', val: `${profile?.streak_days ?? 1}j`, label: 'Streak', color: '#FB923C' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, type: 'spring', damping: 18 }}
              style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 20, padding: '16px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <Link href="/dashboard">
          <motion.button whileHover={{ y: -2, boxShadow: '0 0 28px rgba(200,255,0,0.3), 0 6px 0 #4A7400' }} whileTap={{ y: 3 }}
            style={{ width: '100%', background: '#C8FF00', border: 'none', color: '#0C0C10', borderRadius: 100, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 #4A7400', transition: 'all 0.2s' }}>
            🏠 Retour au dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )

  // ── Main review screen ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px', transition: 'background 0.25s', position: 'relative' }}>
      <PageBg />

      {/* Modals */}
      <AnimatePresence>
        {levelUp && <LevelUpModal level={levelUp} onClose={() => { setLevelUp(null); if (current + 1 >= total) setDone(true); else setCurrent(i => i + 1) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showGoalModal && <GoalModal reviewed={(profile?.daily_reviewed ?? 0) + reviewed} goal={profile?.daily_goal ?? 5} xpGained={goalXP} onClose={() => { setShowGoalModal(false); if (current + 1 >= total) setDone(true); else setCurrent(i => i + 1) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {newBadges.length > 0 && !levelUp && !showGoalModal && <BadgeUnlockModal badges={newBadges} onClose={() => setNewBadges([])} />}
      </AnimatePresence>

      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted, borderRadius: 100, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              ✕
            </motion.button>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{current + 1} / {total}</span>
              {xpGained > 0 && (
                <span style={{ fontSize: 12, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={11} color="#C8FF00" />+{xpGained} XP
                </span>
              )}
            </div>
            <div style={{ height: 8, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 10px rgba(200,255,0,0.5)' }} />
            </div>
          </div>
        </div>

        {/* XP popup */}
        <AnimatePresence>
          {xpPopup && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', damping: 16 }}
              style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.4)', borderRadius: 100, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(200,255,0,0.2)' }}>
              <Zap size={14} color="#C8FF00" fill="#C8FF00" />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#C8FF00' }}>+{xpPopup} XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 48, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -48, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}>

            {/* Flashcard front */}
            <motion.div onClick={() => !flipped && setFlipped(true)}
              animate={shake ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
              transition={shake ? { duration: 0.4 } : {}}
              whileHover={!flipped ? { scale: 1.01, boxShadow: '0 0 40px rgba(200,255,0,0.08), 0 8px 32px rgba(0,0,0,0.5)' } : {}}
              style={{
                background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)',
                border: '1px solid rgba(200,255,0,0.2)',
                borderRadius: 28,
                padding: '28px',
                marginBottom: flipped ? 12 : 0,
                cursor: flipped ? 'default' : 'pointer',
                boxShadow: '0 0 30px rgba(200,255,0,0.05), 0 8px 32px rgba(0,0,0,0.4)',
                position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}>

              {/* Glow orb */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

              {fiche?.cours && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '3px 10px', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {fiche.cours.subject ?? fiche.cours.title}
                  </span>
                </div>
              )}

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: '#F0F0F8', marginBottom: 14, lineHeight: 1.25, letterSpacing: '-0.3px' }}>
                {fiche?.title}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(240,240,248,0.6)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>
                {fiche?.content?.summary}
              </p>

              {!flipped && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                  style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: 'rgba(240,240,248,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
                  Tape pour voir les détails 👆
                </motion.p>
              )}
            </motion.div>

            {/* Flashcard back */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ background: colors.surface, borderRadius: 24, padding: '18px', border: `1px solid ${colors.border}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    if (!fiche) return null
                    const c = fiche.content as { key_concepts?: { term: string; definition: string }[]; important_points?: string[]; memory_trick?: string; key_numbers?: string[]; schema_text?: string | null; exam_traps?: string[] }
                    return <>
                      {fiche.image_url && <ImageZoom src={fiche.image_url} />}

                      {(c.key_numbers?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {c.key_numbers!.map((n, i) => (
                            <span key={i} style={{ background: 'rgba(60,239,255,0.1)', border: '1px solid rgba(60,239,255,0.2)', borderRadius: 99, padding: '3px 9px', fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#3CEFFF' }}>{n}</span>
                          ))}
                        </div>
                      )}

                      {c.schema_text && c.schema_text !== 'null' && c.schema_text.trim() && (() => {
                        const lines = c.schema_text.split('\n')
                        return (
                        <div style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '10px 12px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: '#C8FF00', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>🗺️ Schéma</p>
                          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <pre style={{ fontSize: 11, lineHeight: 1.7, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre', margin: 0, minWidth: 'max-content' }}>
                              {lines.map((line, li) => (
                                <span key={li} style={{ display: 'block', color: li === 0 ? '#C8FF00' : '#F0F0F8', fontWeight: li === 0 ? 700 : 400 }}>{line}</span>
                              ))}
                            </pre>
                          </div>
                        </div>
                        )
                      })()}

                      {c.key_concepts?.slice(0, 3).map((kc, i) => (
                        <div key={i} style={{ background: 'rgba(60,239,255,0.04)', border: '1px solid rgba(60,239,255,0.1)', borderRadius: 12, padding: '9px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                            <Tag size={10} color="#3CEFFF" />
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.text }}>{kc.term}</p>
                          </div>
                          <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif', paddingLeft: 15 }}>{kc.definition}</p>
                        </div>
                      ))}

                      {c.important_points?.slice(0, 3).map((pt, i) => (
                        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C8FF00', flexShrink: 0, marginTop: 7, boxShadow: '0 0 5px rgba(200,255,0,0.6)' }} />
                          <p style={{ fontSize: 12, color: colors.text, lineHeight: 1.55, fontFamily: 'DM Sans, sans-serif' }}>{pt}</p>
                        </div>
                      ))}

                      {(c.exam_traps?.length ?? 0) > 0 && (
                        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 12, padding: '9px 12px' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: '#f87171', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>⚠️ Pièges</p>
                          {c.exam_traps!.slice(0, 2).map((t, i) => (
                            <p key={i} style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{t}</p>
                          ))}
                        </div>
                      )}

                      {c.memory_trick && (
                        <div style={{ background: 'rgba(251,146,60,0.06)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(251,146,60,0.14)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <Lightbulb size={11} color="#FB923C" />
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#FB923C', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>Mémo</p>
                          </div>
                          <p style={{ fontSize: 12, color: colors.text, lineHeight: 1.55, fontStyle: 'italic', fontFamily: 'DM Sans, sans-serif' }}>{c.memory_trick}</p>
                        </div>
                      )}
                    </>
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Answer buttons */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <motion.button
                    whileHover={{ y: -3, boxShadow: '0 0 20px rgba(248,113,113,0.25), 0 6px 0 #CC2200' }}
                    whileTap={{ y: 4 }}
                    onClick={() => answer(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 100, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#f87171', boxShadow: '0 4px 0 rgba(204,34,0,0.4)', transition: 'all 0.2s' }}>
                    <X size={18} />À revoir
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -3, boxShadow: '0 0 28px rgba(200,255,0,0.35), 0 6px 0 #4A7400' }}
                    whileTap={{ y: 4 }}
                    onClick={() => answer(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px', background: '#C8FF00', border: 'none', borderRadius: 100, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#0C0C10', boxShadow: '0 4px 0 #4A7400', transition: 'all 0.2s' }}>
                    <CheckCircle2 size={18} />Je sais !
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ImageZoom({ src }: { src: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'zoom-in' }}>
        <img src={src} alt="Schéma du cours" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ZoomIn size={12} color="rgba(255,255,255,0.8)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>Agrandir</span>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
            <motion.img
              src={src} alt="Schéma du cours"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 0 60px rgba(0,0,0,0.8)', objectFit: 'contain' }}
              onClick={e => e.stopPropagation()} />
            <button onClick={close} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
