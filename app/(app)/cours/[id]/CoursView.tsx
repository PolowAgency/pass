'use client'

import Link from 'next/link'
import { Cours, Fiche } from '@/types'
import { FicheCard } from '@/components/FicheCard'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, BookOpen, Brain, Target, Clock, Play, Zap } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  cours: Cours
  fiches: Fiche[]
  sessions: { score: number | null; total_questions: number | null; completed_at: string }[]
}

const EXAM_MESSAGES: Record<number, string> = {
  0: "C'est aujourd'hui. T'as plus que maintenant.",
  1: "Demain. Révise tout ce soir.",
  2: "2 jours. Concentre-toi sur les fiches non mémorisées.",
  3: "3 jours. Fais tous tes QCM.",
  7: "1 semaine. Tu peux encore tout retourner.",
}

function getExamMsg(days: number): string {
  if (days <= 0) return EXAM_MESSAGES[0]
  if (days === 1) return EXAM_MESSAGES[1]
  if (days === 2) return EXAM_MESSAGES[2]
  if (days === 3) return EXAM_MESSAGES[3]
  if (days <= 7) return EXAM_MESSAGES[7]
  if (days <= 14) return `J-${days}. Rythme soutenu requis.`
  return `J-${days}. Commence maintenant, t'éviteras le stress.`
}

export default function CoursView({ cours, fiches, sessions }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const memorized = fiches.filter(f => f.memorized).length
  const masteryPct = fiches.length > 0 ? Math.round((memorized / fiches.length) * 100) : 0
  const daysLeft = cours.exam_date ? differenceInDays(parseISO(cours.exam_date), new Date()) : null
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + ((s.score ?? 0) / (s.total_questions ?? 1)) * 100, 0) / sessions.length) : null
  const urgent = daysLeft !== null && daysLeft <= 7
  const examMode = daysLeft !== null && daysLeft <= 14

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.surface, border: `2px solid ${colors.border}`,
    borderRadius: 20, boxShadow: `0 4px 0 ${colors.border2}`, ...extra,
  })

  const spring = (delay = 0) => ({ type: 'spring' as const, damping: 20, stiffness: 220, delay })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '28px', transition: 'background 0.25s' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0)}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.muted, textDecoration: 'none', marginBottom: 20, fontFamily: 'DM Sans, sans-serif' }}>
            <ArrowLeft size={14} />Dashboard
          </Link>
        </motion.div>

        {/* Exam mode banner */}
        {examMode && daysLeft !== null && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.02)}
            style={{ background: urgent ? 'rgba(248,113,113,0.1)' : 'rgba(251,146,60,0.1)', border: `2px solid ${urgent ? '#f87171' : '#FB923C'}`, borderRadius: 18, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 4px 0 ${urgent ? '#CC2200' : '#CC5500'}` }}>
            <span style={{ fontSize: 28 }}>{urgent ? '🚨' : '⏰'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: urgent ? '#f87171' : '#FB923C', marginBottom: 2 }}>
                {daysLeft === 0 ? "EXAM AUJOURD'HUI" : `J-${daysLeft} avant l'examen`}
              </p>
              <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{getExamMsg(daysLeft)}</p>
            </div>
            <Link href="/coach" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: urgent ? '#f87171' : '#FB923C', color: '#1A0000', border: 'none', borderRadius: 12, padding: '8px 14px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `0 3px 0 ${urgent ? '#CC2200' : '#CC5500'}`, whiteSpace: 'nowrap' }}>
                <Brain size={13} />Plan IA
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.05)}
          style={{ background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)', border: '2px solid rgba(200,255,0,0.2)', borderRadius: 24, padding: isMobile ? '20px' : '28px', marginBottom: 14, boxShadow: '0 5px 0 rgba(200,255,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              {cours.subject && (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#C8FF00', background: 'rgba(200,255,0,0.12)', padding: '3px 10px', borderRadius: 99, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {cours.subject}
                </span>
              )}
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 22 : 28, color: '#F0F0F8', marginBottom: 10, lineHeight: 1.2 }}>{cours.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'rgba(240,240,248,0.55)', fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={13} />{fiches.length} fiches</span>
                {cours.exam_date && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: urgent ? '#f87171' : 'rgba(240,240,248,0.55)' }}><Calendar size={13} />Exam le {format(parseISO(cours.exam_date), 'd MMM yyyy', { locale: fr })}</span>}
              </div>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ position: 'relative', width: 68, height: 68 }}>
                  <svg viewBox="0 0 68 68" style={{ width: 68, height: 68, transform: 'rotate(-90deg)' }}>
                    <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                    <circle cx="34" cy="34" r="28" fill="none" stroke="#C8FF00" strokeWidth="5"
                      strokeDasharray={`${(cours.prep_score / 100) * 176} 176`} strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px #C8FF00)' }} />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: '#C8FF00' }}>{cours.prep_score}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>Prep score</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
            {[
              { icon: Brain,  val: `${masteryPct}%`, label: 'Maîtrise',   color: '#C8FF00' },
              { icon: Target, val: avgScore !== null ? `${avgScore}%` : '—', label: 'Moy. QCM', color: '#3CEFFF' },
              { icon: Clock,  val: daysLeft !== null ? `J-${daysLeft}` : '—', label: 'Avant exam', color: urgent ? '#f87171' : 'rgba(240,240,248,0.4)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <s.icon size={14} color={s.color} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.1)}
          style={{ marginBottom: 24 }}>

          {/* QCM — 2 modes */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href={`/qcm/${cours.id}?mode=rapide`} style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: colors.lime, color: colors.limeText, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                <Play size={16} fill={colors.limeText} />QCM rapide — 10 questions
              </motion.button>
            </Link>
            <Link href={`/qcm/${cours.id}`} style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: colors.surface, border: `2px solid ${colors.limeBorder}`, color: colors.limeDark, borderRadius: 16, padding: '14px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.limeDark}40` }}>
                <Target size={16} />QCM complet — toutes les questions
              </motion.button>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/review">
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 16, padding: '12px 18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.border2}` }}>
                <BookOpen size={15} />Réviser les fiches
              </motion.button>
            </Link>
            <Link href="/coach">
              <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.surface, border: `2px solid ${colors.border}`, color: colors.text, borderRadius: 16, padding: '12px 18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 4px 0 ${colors.border2}` }}>
                <Brain size={15} />Coach IA
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Fiches */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.15)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text }}>Fiches de révision</h2>
            <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif', background: colors.surface2, padding: '4px 10px', borderRadius: 99, border: `1px solid ${colors.border}` }}>{memorized}/{fiches.length} mémorisées</span>
          </div>

          {cours.status === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 90, background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 20 }} />
              ))}
              <p style={{ textAlign: 'center', fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>
                Génération des fiches en cours... ✨
              </p>
            </div>
          ) : fiches.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Pas encore de fiches. La génération a peut-être échoué.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fiches.map((fiche, i) => <FicheCard key={fiche.id} fiche={fiche} index={i + 1} coursId={cours.id} />)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
