'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'
import { Plus, ChevronRight, Zap, BookOpen, Play, Clock, Target, Trash2, ChevronDown } from 'lucide-react'
import { parseISO, differenceInDays } from 'date-fns'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { checkAndAwardBadges } from '@/lib/badges'
import StreakModal from '@/components/StreakModal'
import BadgeUnlockModal from '@/components/BadgeUnlockModal'
import OnboardingWizard from '@/components/OnboardingWizard'
import DailyRewardModal from '@/components/DailyRewardModal'
import AppTour from '@/components/AppTour'
import toast from 'react-hot-toast'
import type { BadgeDef } from '@/lib/badges'

function useCounter(target: number, duration = 900, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    let raf: number
    const timer = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setVal(Math.round((1 - (1 - p) ** 3) * target))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [target])
  return val
}

const SUBJECT: Record<string, { emoji: string; color: string }> = {
  // Lycée
  'Mathématiques':        { emoji: '📐', color: '#3CEFFF' },
  'Physique-Chimie':      { emoji: '⚡', color: '#C8FF00' },
  'Physique':             { emoji: '⚡', color: '#C8FF00' },
  'Chimie':               { emoji: '⚗️', color: '#FF3CAC' },
  'SVT':                  { emoji: '🌿', color: '#4ade80' },
  'Histoire-Géo':         { emoji: '🌍', color: '#FB923C' },
  'Philosophie':          { emoji: '🧠', color: '#A78BFA' },
  'Français':             { emoji: '✍️', color: '#F9A8D4' },
  'SES':                  { emoji: '📊', color: '#FB923C' },
  'NSI':                  { emoji: '💻', color: '#3CEFFF' },
  'Anglais':              { emoji: '🇬🇧', color: '#60A5FA' },
  'Espagnol':             { emoji: '🇪🇸', color: '#F87171' },
  'HGGSP':                { emoji: '🌐', color: '#FB923C' },
  'Humanités & Littérature': { emoji: '📖', color: '#F9A8D4' },
  // Médecine / Santé
  'Anatomie':             { emoji: '🫀', color: '#F87171' },
  'Physiologie':          { emoji: '🔬', color: '#4ade80' },
  'Biologie':             { emoji: '🧬', color: '#4ade80' },
  'Pharmacologie':        { emoji: '💊', color: '#A78BFA' },
  'Histologie':           { emoji: '🔭', color: '#60A5FA' },
  'Radiologie':           { emoji: '🩻', color: '#94A3B8' },
  'Chirurgie':            { emoji: '🩺', color: '#F87171' },
  'Pathologie':           { emoji: '🧫', color: '#FB923C' },
  // Sciences & Ingé
  'Informatique':         { emoji: '💻', color: '#3CEFFF' },
  'Mécanique':            { emoji: '⚙️', color: '#94A3B8' },
  'Électronique':         { emoji: '🔌', color: '#C8FF00' },
  "Sciences de l'ingénieur": { emoji: '🛠️', color: '#FB923C' },
  'Biochimie':            { emoji: '🧪', color: '#4ade80' },
  'Statistiques':         { emoji: '📈', color: '#3CEFFF' },
  // Droit & Éco
  'Droit':                { emoji: '⚖️', color: '#A78BFA' },
  'Droit civil':          { emoji: '⚖️', color: '#A78BFA' },
  'Droit pénal':          { emoji: '⚖️', color: '#F87171' },
  'Droit constitutionnel':{ emoji: '🏛️', color: '#A78BFA' },
  'Sciences politiques':  { emoji: '🏛️', color: '#60A5FA' },
  'Microéconomie':        { emoji: '📊', color: '#C8FF00' },
  'Macroéconomie':        { emoji: '📈', color: '#FB923C' },
  'Comptabilité':         { emoji: '🧾', color: '#4ade80' },
  'Finance':              { emoji: '💹', color: '#4ade80' },
  'Marketing':            { emoji: '🎯', color: '#FF3CAC' },
  'Management':           { emoji: '🏢', color: '#60A5FA' },
  // Lettres & Humaines
  'Littérature':          { emoji: '📖', color: '#F9A8D4' },
  'Psychologie':          { emoji: '🧠', color: '#A78BFA' },
  'Sociologie':           { emoji: '👥', color: '#FB923C' },
  'Histoire':             { emoji: '🏺', color: '#FB923C' },
  'Géographie':           { emoji: '🗺️', color: '#4ade80' },
  default:                { emoji: '📚', color: '#C8FF00' },
}

interface Props {
  profile: Profile | null
  cours: Array<{ id: string; title: string; subject: string | null; status: string; prep_score: number; exam_date: string | null; created_at: string; fiches: { id: string; memorized: boolean }[] }>
  sessions: Array<{ score: number | null; total_questions: number | null; completed_at: string; cours_id: string }>
  dueCount: number
  weakFiches: Array<{ title: string; review_count: number; cours_id: string }>
  priorityCours: { id: string; title: string; subject: string | null; prep_score: number } | null
}

export default function DashboardView({ profile, cours, sessions, dueCount, weakFiches, priorityCours }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [showStreak, setShowStreak] = useState(false)
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showDailyReward, setShowDailyReward] = useState(false)
  const router = useRouter()
  const [filterSubject, setFilterSubject] = useState<string | null>(null)
  const [groupBySubject, setGroupBySubject] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)

  async function deleteCours(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cours/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Erreur lors de la suppression'); return }
      toast.success('Cours supprimé')
      router.refresh()
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const streak = profile?.streak_days ?? 0
  const dailyGoal = profile?.daily_goal ?? 5
  const dailyReviewed = profile?.daily_reviewed ?? 0
  const goalPct = Math.min(100, Math.round((dailyReviewed / dailyGoal) * 100))
  const totalFiches = cours.reduce((a, c) => a + (c.fiches?.length ?? 0), 0)
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + ((s.score ?? 0) / (s.total_questions ?? 1)) * 100, 0) / sessions.length)
    : null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Mission du jour
  const estimatedMinutes = Math.max(5, dueCount * 2 + (priorityCours ? 5 : 0))
  const possibleXP = dueCount * 15 + (priorityCours ? 30 : 0)
  const missionComplete = goalPct >= 100
  const streakAtRisk = streak > 0 && dailyReviewed === 0

  const animStreak = useCounter(streak, 800, 150)
  const animGoal   = useCounter(dailyReviewed, 700, 200)
  const animXP     = useCounter(xp, 1000, 250)
  const animDue    = useCounter(dueCount, 600, 50)

  const spring = (delay = 0) => ({ type: 'spring' as const, damping: 20, stiffness: 220, delay })
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.surface, border: `2px solid ${colors.border}`,
    borderRadius: 20, padding: isMobile ? '14px 16px' : '20px',
    boxShadow: `0 4px 0 ${colors.border2}`, overflow: 'hidden', ...extra,
  })

  useEffect(() => {
    const done = localStorage.getItem('pass-onboarded')
    if (!done && cours.length === 0) setTimeout(() => setShowOnboarding(true), 600)
  }, [])

  useEffect(() => {
    const tourDone = localStorage.getItem('pass-tour-done')
    const onboarded = localStorage.getItem('pass-onboarded')
    if (!tourDone && onboarded) setTimeout(() => setShowTour(true), 1200)
  }, [])

  // Coffre quotidien — vérifié côté serveur
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('pass-onboarded')
    if (!hasOnboarded && cours.length === 0) return
    fetch('/api/chest').then(r => r.json()).then(data => {
      if (data.available) {
        const timer = setTimeout(() => setShowDailyReward(true), 1400)
        return () => clearTimeout(timer)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (streak <= 0) return
    const today = new Date().toDateString()
    const key = `pass-streak-shown-${today}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1') // marquer avant le timer
    const timer = setTimeout(() => setShowStreak(true), 900)
    return () => clearTimeout(timer)
  }, [streak])

  useEffect(() => {
    checkAndAwardBadges().then(badges => { if (badges.length > 0) setNewBadges(badges) })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '28px 24px 80px', transition: 'background 0.25s' }}>

      <AnimatePresence>
        {showTour && !showOnboarding && <AppTour onDone={() => setShowTour(false)} />}
        {showOnboarding && <OnboardingWizard onClose={() => setShowOnboarding(false)} />}
        {showDailyReward && !showOnboarding && (
          <DailyRewardModal
            onClose={() => setShowDailyReward(false)}
            onXpGained={() => setShowDailyReward(false)}
          />
        )}
        {showStreak && !showOnboarding && !showDailyReward && <StreakModal streak={streak} onClose={() => setShowStreak(false)} />}
        {newBadges.length > 0 && !showStreak && !showOnboarding && !showDailyReward && <BadgeUnlockModal badges={newBadges} onClose={() => setNewBadges([])} />}
      </AnimatePresence>

      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>{greeting} 👋</p>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 26 : 32, color: colors.text, letterSpacing: '-0.5px' }}>
              {profile?.full_name?.split(' ')[0] ?? 'toi'}
            </h1>
          </div>
          <Link href="/upload" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ y: -3 }} whileTap={{ y: 4 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '13px 22px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
              <Plus size={18} strokeWidth={3} />{isMobile ? 'Nouveau' : 'Nouveau cours'}
            </motion.button>
          </Link>
        </motion.div>

        {/* ══ MISSION DU JOUR ══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.06)}
          style={{ marginBottom: 20 }}>
          {cours.length === 0 ? (
            // Pas de cours : CTA upload
            <div style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B69)', border: `2px solid ${colors.limeBorder}`, borderRadius: 22, padding: '24px', boxShadow: `0 5px 0 ${colors.limeDark}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>🚀</span>
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#F0F0F8' }}>Commence ici</p>
                  <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.55)', fontFamily: 'DM Sans, sans-serif' }}>Upload ton premier cours pour débloquer tes révisions</p>
                </div>
              </div>
              <Link href="/upload" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                  style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 14, padding: '14px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                  Uploader mon premier cours ⚡
                </motion.button>
              </Link>
            </div>
          ) : missionComplete ? (
            // Mission accomplie
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.35)', borderRadius: 22, padding: '20px 24px', boxShadow: '0 5px 0 rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 40 }}>🏆</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#22c55e', marginBottom: 4 }}>Mission accomplie !</p>
                <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Objectif du jour atteint. Tu peux continuer ou revenir demain.</p>
              </div>
              {priorityCours && (
                <Link href={`/qcm/${priorityCours.id}`} style={{ textDecoration: 'none' }}>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#22c55e', color: '#0A1A0A', border: 'none', borderRadius: 14, padding: '12px 18px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 0 #15803d' }}>
                    <Target size={15} />Faire un QCM quand même
                  </motion.button>
                </Link>
              )}
            </div>
          ) : (
            // Mission active
            <div style={{ background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)', border: `2px solid ${colors.limeBorder}`, borderRadius: 22, padding: '20px 24px', boxShadow: `0 5px 0 ${colors.limeDark}` }}>
              {/* Titre mission */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎯</div>
                  <div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#F0F0F8', lineHeight: 1 }}>Mission du jour</p>
                    <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.45)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                      {streakAtRisk ? '⚠️ Streak en danger — révise maintenant' : 'Ta session de révision quotidienne'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 99, padding: '5px 12px' }}>
                  <Zap size={12} color="#C8FF00" fill="#C8FF00" />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: '#C8FF00' }}>+{possibleXP} XP</span>
                </div>
              </div>

              {/* Items mission */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {dueCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>📚</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: '#F0F0F8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                        {animDue} fiche{dueCount > 1 ? 's' : ''} à réviser
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{dueCount * 2} min</span>
                  </div>
                )}

                {priorityCours && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🎯</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#F0F0F8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        QCM — {priorityCours.title}
                      </p>
                      <div style={{ display: 'inline-flex', background: `${priorityCours.prep_score < 50 ? '#f87171' : '#FB923C'}22`, borderRadius: 99, padding: '1px 7px' }}>
                        <span style={{ fontSize: 10, color: priorityCours.prep_score < 50 ? '#f87171' : '#FB923C', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{priorityCours.prep_score}%</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>5 min</span>
                  </div>
                )}

                {weakFiches.length > 0 && weakFiches[0].review_count >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,60,172,0.06)', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'rgba(240,240,248,0.6)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Point faible : <span style={{ color: '#FF3CAC', fontWeight: 600 }}>{weakFiches[0].title}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Temps + progression */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px' }}>
                  <Clock size={16} color="rgba(240,240,248,0.4)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.5)', fontFamily: 'DM Sans, sans-serif' }}>~{estimatedMinutes} min</span>
                      <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.5)', fontFamily: 'DM Sans, sans-serif' }}>{dailyReviewed}/{dailyGoal} fiches</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #C8FF00, #AAFF00)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA principal */}
              <Link href="/review" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                  style={{ width: '100%', background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 5px 0 ${colors.limeDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <BookOpen size={18} />Commencer ma mission
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Streak urgence (si streak en danger ET pas encore réviser) */}
        {streakAtRisk && streak >= 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.12)}
            style={{ background: 'rgba(251,146,60,0.1)', border: '2px solid rgba(251,146,60,0.4)', borderRadius: 18, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: '#FB923C', flex: 1 }}>
              Tu vas perdre ton streak de {streak} jours si tu ne révises pas aujourd'hui
            </p>
          </motion.div>
        )}

        {/* 3 stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.1)}
            style={card(streak > 0 ? { border: '2px solid #FB923C', boxShadow: '0 5px 0 #CC5500' } : {})}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: streak > 0 ? '#FB923C' : colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Streak</span>
              <span style={{ fontSize: 18 }}>{streak > 0 ? '🔥' : '💤'}</span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 36 : 44, color: streak > 0 ? '#FB923C' : colors.border, lineHeight: 1 }}>{animStreak}</span>
            <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginLeft: 4 }}>jours</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.14)}
            style={card(goalPct >= 100 ? { border: '2px solid #22c55e', boxShadow: '0 5px 0 #15803d' } : {})}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: goalPct >= 100 ? '#22c55e' : colors.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Objectif</span>
              <span style={{ fontSize: 18 }}>{goalPct >= 100 ? '🏆' : '🎯'}</span>
            </div>
            <div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 36 : 44, color: goalPct >= 100 ? '#22c55e' : colors.text, lineHeight: 1 }}>{animGoal}</span>
              <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginLeft: 4 }}>/ {dailyGoal < 10 ? `0${dailyGoal}` : dailyGoal}</span>
            </div>
            <div style={{ height: 5, background: colors.surface2, borderRadius: 99, overflow: 'hidden', marginTop: 8, border: `1px solid ${colors.border}` }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 99, background: goalPct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#C8FF00,#AAFF00)' }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.18)}
            style={card({ border: `2px solid ${colors.limeBorder}`, boxShadow: `0 5px 0 ${colors.limeDark}` })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: colors.limeDark, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Niveau</span>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: colors.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 11, color: colors.limeText, boxShadow: `0 2px 0 ${colors.limeDark}` }}>{level}</div>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 36 : 44, color: colors.limeDark, lineHeight: 1 }}>{animXP}</span>
            <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginLeft: 4 }}>XP</span>
          </motion.div>
        </div>

        {/* Cours list + panel droit */}
        <div style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: '1fr 252px', flexDirection: 'column', gap: 16, alignItems: 'start' }}>

          {/* Cours */}
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: colors.text }}>Mes cours</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: colors.muted, background: colors.surface2, border: `1px solid ${colors.border}`, padding: '3px 10px', borderRadius: 99 }}>{cours.length}</span>
                {(() => {
                  const subjects = [...new Set(cours.map(c => c.subject).filter(Boolean))]
                  return subjects.length > 1 ? (
                    <button onClick={() => setGroupBySubject(g => !g)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', border: `1px solid ${colors.border}`, background: groupBySubject ? colors.lime + '18' : colors.surface2, color: groupBySubject ? colors.limeDark : colors.muted, transition: 'all 0.15s' }}>
                      <ChevronDown size={11} />Par matière
                    </button>
                  ) : null
                })()}
              </div>
            </motion.div>

            {/* Filtre par matière (mode liste uniquement) */}
            {!groupBySubject && cours.length > 1 && (() => {
              const subjects = [...new Set(cours.map(c => c.subject).filter(Boolean))] as string[]
              return subjects.length > 1 ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button onClick={() => setFilterSubject(null)}
                    style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', border: '1px solid', background: filterSubject === null ? colors.lime : colors.surface2, color: filterSubject === null ? colors.limeText : colors.muted, borderColor: filterSubject === null ? colors.lime : colors.border, transition: 'all 0.15s' }}>
                    Tous
                  </button>
                  {subjects.map(s => (
                    <button key={s} onClick={() => setFilterSubject(s === filterSubject ? null : s)}
                      style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', border: '1px solid', background: filterSubject === s ? (SUBJECT[s] ?? SUBJECT.default).color + '20' : colors.surface2, color: filterSubject === s ? (SUBJECT[s] ?? SUBJECT.default).color : colors.muted, borderColor: filterSubject === s ? (SUBJECT[s] ?? SUBJECT.default).color : colors.border, transition: 'all 0.15s' }}>
                      {(SUBJECT[s] ?? SUBJECT.default).emoji} {s}
                    </button>
                  ))}
                </div>
              ) : null
            })()}

            {cours.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ ...card(), border: `2px dashed ${colors.border}`, textAlign: 'center', padding: '36px 20px' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>📖</div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: colors.text, marginBottom: 6 }}>Aucun cours</p>
                <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Upload ton premier cours pour commencer</p>
              </motion.div>
            ) : (() => {
              const filteredCours = cours.filter(c => !filterSubject || c.subject === filterSubject)

              // Build groups: grouped mode → one section per subject; list mode → single flat group
              const groups: Array<{ key: string; subj: { emoji: string; color: string } | null; items: typeof cours }> = []
              if (groupBySubject) {
                const subjectOrder = [...new Set(filteredCours.map(c => c.subject ?? ''))]
                  .sort((a, b) => a.localeCompare(b, 'fr'))
                for (const s of subjectOrder) {
                  groups.push({
                    key: s || '__none__',
                    subj: s ? (SUBJECT[s] ?? SUBJECT.default) : null,
                    items: filteredCours.filter(c => (c.subject ?? '') === s),
                  })
                }
              } else {
                groups.push({ key: '__all__', subj: null, items: filteredCours })
              }

              let globalIdx = 0
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: groupBySubject ? 18 : 10 }}>
                  {groups.map(group => (
                    <div key={group.key}>
                      {/* Section header */}
                      {groupBySubject && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          {group.subj ? (
                            <>
                              <span style={{ fontSize: 15 }}>{group.subj.emoji}</span>
                              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: group.subj.color }}>{group.key}</span>
                            </>
                          ) : (
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.muted }}>📚 Sans matière</span>
                          )}
                          <span style={{ fontSize: 11, color: colors.muted, background: colors.surface2, border: `1px solid ${colors.border}`, padding: '1px 7px', borderRadius: 99 }}>{group.items.length}</span>
                          <div style={{ flex: 1, height: 1, background: colors.border, marginLeft: 4 }} />
                        </div>
                      )}

                      {/* Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {group.items.map(c => {
                          const i = globalIdx++
                          const ficheCount = c.fiches?.length ?? 0
                          const memorizedCount = c.fiches?.filter(f => f.memorized).length ?? 0
                          const masteryPct = ficheCount > 0 ? Math.round((memorizedCount / ficheCount) * 100) : 0
                          const daysLeft = c.exam_date ? differenceInDays(new Date(c.exam_date + 'T00:00:00'), new Date()) : null
                          const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
                          const subj = SUBJECT[c.subject ?? ''] ?? SUBJECT.default
                          const scoreColor = c.prep_score >= 80 ? '#22c55e' : c.prep_score >= 50 ? colors.limeDark : c.prep_score >= 30 ? '#FB923C' : '#f87171'
                          const masteryColor = masteryPct >= 80 ? '#22c55e' : masteryPct >= 50 ? colors.limeDark : masteryPct >= 30 ? '#FB923C' : '#f87171'
                          const isConfirming = confirmDeleteId === c.id
                          const isDeleting = deletingId === c.id

                          return (
                            <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.06 * i + 0.28 }}
                              style={{ position: 'relative' }}>

                              {/* Confirmation suppression */}
                              <AnimatePresence>
                                {isConfirming && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: 4 }}
                                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                                    style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: 20, background: colors.surface, border: '2px solid #f87171', boxShadow: '0 4px 0 #CC2200', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
                                    <span style={{ fontSize: 20, flexShrink: 0 }}>🗑️</span>
                                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 12 : 13, color: colors.text, flex: 1, lineHeight: 1.3 }}>
                                      Supprimer<br />
                                      <span style={{ color: '#f87171', fontSize: isMobile ? 11 : 12, fontWeight: 600 }}>Action irréversible</span>
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                      <motion.button whileHover={{ y: -1 }} whileTap={{ y: 1 }}
                                        onClick={() => setConfirmDeleteId(null)}
                                        style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 12, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', border: `2px solid ${colors.border}`, background: colors.surface2, color: colors.text, boxShadow: `0 3px 0 ${colors.border2}` }}>
                                        Annuler
                                      </motion.button>
                                      <motion.button whileHover={{ y: -1 }} whileTap={{ y: 1 }}
                                        onClick={() => deleteCours(c.id)} disabled={isDeleting}
                                        style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 12, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 800, cursor: isDeleting ? 'not-allowed' : 'pointer', border: 'none', background: '#f87171', color: '#fff', boxShadow: '0 3px 0 #CC2200', opacity: isDeleting ? 0.7 : 1 }}>
                                        {isDeleting ? '…' : 'Supprimer'}
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                                <Link href={`/cours/${c.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                                  <motion.div whileHover={{ y: -2 }} whileTap={{ y: 2 }}
                                    style={{ ...card(), display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, cursor: 'pointer', borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                                    <div style={{ width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius: 12, background: `${subj.color}18`, border: `2px solid ${subj.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 20, flexShrink: 0 }}>
                                      {subj.emoji}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: isMobile ? 13 : 14, color: colors.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isMobile ? 5 : 6 }}>
                                        {c.subject && !groupBySubject && <span style={{ fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: subj.color }}>{c.subject}</span>}
                                        <span style={{ fontSize: 10, color: colors.muted }}>{ficheCount} fiche{ficheCount > 1 ? 's' : ''}</span>
                                        {urgent && daysLeft !== null && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>⚠️ J-{daysLeft}</span>}
                                      </div>
                                      {/* Barre de maîtrise (fiches mémorisées) */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ flex: 1, height: 5, background: colors.surface2, borderRadius: 99, overflow: 'hidden' }}>
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${masteryPct}%` }}
                                            transition={{ duration: 0.8, delay: 0.08 * i + 0.5, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: '100%', borderRadius: 99, background: masteryColor }} />
                                        </div>
                                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 10, color: masteryColor, flexShrink: 0 }}>{masteryPct}%</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: scoreColor }}>{c.prep_score}%</span>
                                      {!isMobile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.lime, borderRadius: 9, padding: '5px 10px', boxShadow: `0 3px 0 ${colors.limeDark}` }}>
                                          <Play size={10} color={colors.limeText} fill={colors.limeText} />
                                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 11, color: colors.limeText }}>Lancer</span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </Link>

                                {/* Bouton supprimer */}
                                <motion.button whileHover={{ background: 'rgba(248,113,113,0.12)' }} whileTap={{ scale: 0.92 }}
                                  onClick={() => setConfirmDeleteId(isConfirming ? null : c.id)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, flexShrink: 0, background: colors.surface2, border: `1px solid ${colors.border}`, borderLeft: 'none', borderTopRightRadius: 20, borderBottomRightRadius: 20, cursor: 'pointer', color: colors.muted, transition: 'all 0.15s' }}>
                                  <Trash2 size={14} />
                                </motion.button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Panel droit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.32)}>
              <Link href="/coach" style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -3 }} whileTap={{ y: 2 }}
                  style={{ ...card(), display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span style={{ fontSize: 28 }}>🤖</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: colors.text, marginBottom: 2 }}>Coach IA</p>
                    <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Conseils personnalisés</p>
                  </div>
                  <ChevronRight size={16} color={colors.muted} />
                </motion.div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.36)}>
              <Link href="/stats" style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -3 }} whileTap={{ y: 2 }}
                  style={{ ...card(), display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <span style={{ fontSize: 28 }}>📊</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: colors.text, marginBottom: 2 }}>Statistiques</p>
                    <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Heatmap & progression</p>
                  </div>
                  <ChevronRight size={16} color={colors.muted} />
                </motion.div>
              </Link>
            </motion.div>

            {profile?.plan === 'free' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.4)}>
                <Link href="/settings#billing" style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ y: -3 }} whileTap={{ y: 2 }}
                    style={{ background: 'linear-gradient(135deg, rgba(255,60,172,0.1), rgba(200,255,0,0.07))', border: '2px solid rgba(255,60,172,0.3)', borderRadius: 20, padding: '16px', cursor: 'pointer', boxShadow: '0 5px 0 rgba(255,60,172,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>⚡</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: '#FF3CAC', marginBottom: 2 }}>
                        {Math.max(0, 3 - (profile.uploads_count ?? 0))} uploads gratuits restants
                      </p>
                      <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Premium → uploads illimités</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
