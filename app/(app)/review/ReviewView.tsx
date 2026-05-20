'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Fiche } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { awardXP, XP_REWARDS } from '@/lib/xp'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import LevelUpModal from '@/components/LevelUpModal'
import GoalModal from '@/components/GoalModal'
import BadgeUnlockModal from '@/components/BadgeUnlockModal'
import { checkAndAwardBadges } from '@/lib/badges'
import type { BadgeDef } from '@/lib/badges'

interface Props {
  fiches: (Fiche & { cours: { title: string; subject: string | null } | null })[]
  profile: { daily_goal: number; daily_reviewed: number; xp: number; level: number; streak_days: number } | null
  userId: string
}

const MOTIVATIONS = [
  "T'as failli zapper. Mais t'es là. Respect. 💪",
  "La discipline bat la motivation. Chaque. Fois.",
  "Même Dieu ne travaille pas autant que toi en ce moment.",
  "Ceux qui révisent dominent. C'est mathématique.",
  "Une fiche de plus, un exam de moins stressant.",
  "Tu feras quoi quand t'auras ta note ? Révise d'abord.",
  "Pas d'effort, pas de résultat. T'as pas le choix.",
  "Le cerveau oublie en 24h. Toi tu bats ce délai.",
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
    const intervals = [1, 3, 7, 14, 30]
    const daysAhead = memorized ? intervals[Math.min(newCount - 1, intervals.length - 1)] : 1
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + daysAhead)

    await supabase.from('fiches').update({
      memorized: memorized && newCount >= 3,
      review_count: newCount,
      last_reviewed: new Date().toISOString(),
      next_review: nextReview.toISOString().split('T')[0],
    }).eq('id', fiche.id)

    const newReviewed = reviewed + 1

    // Incrément atomique +1 (évite la race condition du cumulatif)
    await supabase.rpc('increment_daily_reviewed', { p_user_id: userId })
    // Streak uniquement sur activité réelle
    await supabase.rpc('update_streak_on_activity', { p_user_id: userId })

    if (memorized) {
      const result = await awardXP('memorize_fiche')
      if (result) {
        setXpGained(x => x + XP_REWARDS.memorize_fiche)
        setXpPopup(XP_REWARDS.memorize_fiche)
        setTimeout(() => setXpPopup(null), 1400)

        if (result.leveledUp && result.level) {
          setTimeout(() => setLevelUp(result.level!), 600)
        }
        checkAndAwardBadges().then(b => { if (b.length > 0) setNewBadges(b) })
      }
    }

    setReviewed(newReviewed)
    setFlipped(false)

    // Check if daily goal just reached
    const totalReviewed = (profile?.daily_reviewed ?? 0) + newReviewed
    const goal = profile?.daily_goal ?? 5
    if (totalReviewed >= goal && totalReviewed - (memorized ? 0 : 0) - 1 < goal) {
      setTimeout(() => { setGoalXP(xpGained + (memorized ? XP_REWARDS.memorize_fiche : 0)); setShowGoalModal(true) }, 700)
      return
    }

    if (current + 1 >= total) setDone(true)
    else setTimeout(() => setCurrent(i => i + 1), 200)
  }

  if (total === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 18 }}
        style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26, color: colors.text, marginBottom: 10 }}>Rien à réviser !</h2>
        <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 28, lineHeight: 1.6 }}>Toutes tes fiches sont à jour. Reviens demain ou ajoute un cours.</p>
        <Link href="/dashboard">
          <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 14, padding: '14px 28px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
            Retour au dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 16 }}
        style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: colors.text, marginBottom: 8 }}>Session terminée !</h2>
        <p style={{ fontSize: 15, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>{reviewed} fiche{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''}</p>
        <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', marginBottom: 24 }}>"{MOTIVATIONS[motivIdx]}"</p>

        {xpGained > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, borderRadius: 14, padding: '10px 20px', marginBottom: 24, boxShadow: `0 3px 0 ${colors.limeDark}` }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: colors.limeDark }}>+{xpGained} XP gagnés</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { emoji: '📚', val: reviewed, label: 'Révisées', color: colors.blue },
            { emoji: '⚡', val: `+${xpGained}`, label: 'XP', color: colors.limeDark },
            { emoji: '🔥', val: `${profile?.streak_days ?? 1}j`, label: 'Streak', color: '#FB923C' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, type: 'spring', damping: 18 }}
              style={{ background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center', boxShadow: `0 4px 0 ${colors.border2}` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <Link href="/dashboard">
          <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
            style={{ width: '100%', background: colors.lime, border: 'none', color: colors.limeText, borderRadius: 16, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
            🏠 Retour au dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px', transition: 'background 0.25s' }}>

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

      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              style={{ background: colors.surface, border: `2px solid ${colors.border}`, color: colors.muted, borderRadius: 12, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, boxShadow: `0 3px 0 ${colors.border2}` }}>✕</motion.button>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{current + 1} / {total}</span>
              {xpGained > 0 && <span style={{ fontSize: 12, color: colors.limeDark, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>⚡ +{xpGained} XP</span>}
            </div>
            <div style={{ height: 12, background: colors.surface2, borderRadius: 99, overflow: 'hidden', border: `2px solid ${colors.border}` }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)', boxShadow: '0 0 8px rgba(200,255,0,0.4)' }} />
            </div>
          </div>
        </div>

        {/* XP popup */}
        <AnimatePresence>
          {xpPopup && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', damping: 16 }}
              style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: colors.limeBg, border: `2px solid ${colors.limeBorder}`, borderRadius: 99, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 0 ${colors.limeDark}` }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: colors.limeDark }}>+{xpPopup} XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 48, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -48, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}>

            {/* Front */}
            <motion.div onClick={() => !flipped && setFlipped(true)}
              animate={shake ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
              transition={shake ? { duration: 0.4 } : {}}
              whileHover={!flipped ? { scale: 1.01 } : {}}
              style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: '2px solid rgba(200,255,0,0.2)', borderRadius: 22, padding: '26px', marginBottom: flipped ? 10 : 0, cursor: flipped ? 'default' : 'pointer', boxShadow: '0 5px 0 rgba(0,0,0,0.4)' }}>
              {fiche?.cours && <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.45)', fontFamily: 'DM Sans, sans-serif', marginBottom: 10 }}>{fiche.cours.subject ?? fiche.cours.title}</p>}
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: '#F0F0F8', marginBottom: 12, lineHeight: 1.3 }}>{fiche?.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(240,240,248,0.65)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{fiche?.content?.summary}</p>
              {!flipped && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                  style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(240,240,248,0.35)', fontFamily: 'DM Sans, sans-serif' }}>
                  Tape pour voir les détails 👆
                </motion.p>
              )}
            </motion.div>

            {/* Back */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ background: colors.surface, borderRadius: 22, padding: '20px', border: `2px solid ${colors.border}`, boxShadow: `0 5px 0 ${colors.border2}`, marginBottom: 12 }}>
                  {fiche?.content?.key_concepts?.slice(0, 3).map((kc, i) => (
                    <div key={i} style={{ background: colors.surface2, borderRadius: 12, padding: '10px 14px', marginBottom: 8, border: `1px solid ${colors.border}` }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text, marginBottom: 3 }}>{kc.term}</p>
                      <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{kc.definition}</p>
                    </div>
                  ))}
                  {fiche?.content?.important_points?.slice(0, 3).map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.lime, flexShrink: 0, marginTop: 5 }} />
                      <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{pt}</p>
                    </div>
                  ))}
                  {fiche?.content?.memory_trick && (
                    <div style={{ background: 'rgba(251,146,60,0.08)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(251,146,60,0.2)', marginTop: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#FB923C', fontFamily: 'Outfit, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Astuce mémo</p>
                      <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontStyle: 'italic', fontFamily: 'DM Sans, sans-serif' }}>{fiche.content.memory_trick}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }} onClick={() => answer(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px', background: 'rgba(248,113,113,0.1)', border: '2px solid #f87171', borderRadius: 18, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: '#f87171', boxShadow: '0 5px 0 #CC2200' }}>
                    <X size={20} />À revoir
                  </motion.button>
                  <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }} onClick={() => answer(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px', background: colors.lime, border: 'none', borderRadius: 18, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.limeText, boxShadow: `0 5px 0 ${colors.limeDark}` }}>
                    <CheckCircle2 size={20} />Je sais ! ⚡
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
