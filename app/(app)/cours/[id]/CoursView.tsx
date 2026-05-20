'use client'

import Link from 'next/link'
import { Cours, Fiche } from '@/types'
import { FicheCard } from '@/components/FicheCard'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, BookOpen, Brain, Target, Play, Zap } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import PageBg from '@/components/PageBg'
import CourseTutor from '@/components/CourseTutor'

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

const spring = (delay = 0) => ({ type: 'spring' as const, damping: 20, stiffness: 220, delay })

export default function CoursView({ cours, fiches, sessions }: Props) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const memorized = fiches.filter(f => f.memorized).length
  const masteryPct = fiches.length > 0 ? Math.round((memorized / fiches.length) * 100) : 0
  const daysLeft = cours.exam_date ? differenceInDays(parseISO(cours.exam_date), new Date()) : null
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + ((s.score ?? 0) / (s.total_questions ?? 1)) * 100, 0) / sessions.length) : null
  const urgent = daysLeft !== null && daysLeft <= 7
  const examMode = daysLeft !== null && daysLeft <= 14

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '28px 32px 60px', transition: 'background 0.25s', position: 'relative' }}>
      <PageBg />

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={spring(0)}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.muted, textDecoration: 'none', marginBottom: 24, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }}>
            <ArrowLeft size={14} />Dashboard
          </Link>
        </motion.div>

        {/* Exam urgency banner */}
        {examMode && daysLeft !== null && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.02)}
            style={{ background: urgent ? 'rgba(248,113,113,0.08)' : 'rgba(251,146,60,0.08)', border: `1px solid ${urgent ? 'rgba(248,113,113,0.4)' : 'rgba(251,146,60,0.4)'}`, borderRadius: 20, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: urgent ? '0 0 24px rgba(248,113,113,0.12)' : '0 0 24px rgba(251,146,60,0.1)' }}>
            <span style={{ fontSize: 26 }}>{urgent ? '🚨' : '⏰'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: urgent ? '#f87171' : '#FB923C', marginBottom: 2 }}>
                {daysLeft === 0 ? "EXAM AUJOURD'HUI" : `J-${daysLeft} avant l'examen`}
              </p>
              <p style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{getExamMsg(daysLeft)}</p>
            </div>
            <Link href="/coach" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ y: -2, boxShadow: `0 0 16px ${urgent ? 'rgba(248,113,113,0.4)' : 'rgba(251,146,60,0.4)'}` }} whileTap={{ y: 2 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: urgent ? '#f87171' : '#FB923C', color: '#fff', border: 'none', borderRadius: 100, padding: '8px 16px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Brain size={12} />Plan IA
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.05)}
          style={{ background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 28, padding: isMobile ? '24px' : '32px', marginBottom: 16, boxShadow: '0 0 60px rgba(200,255,0,0.06), 0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>

          {/* Glow orb */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {cours.subject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#C8FF00', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)', padding: '3px 12px', borderRadius: 100, textTransform: 'uppercase' as const, letterSpacing: '1.5px' }}>
                    {cours.subject}
                  </span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8FF00', display: 'inline-block', boxShadow: '0 0 8px rgba(200,255,0,0.6)' }} />
                </div>
              )}
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 22 : 28, color: '#F0F0F8', marginBottom: 12, lineHeight: 1.15, letterSpacing: '-0.3px' }}>
                {cours.title}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'rgba(240,240,248,0.45)', fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BookOpen size={13} />{fiches.length} fiches générées
                </span>
                {cours.exam_date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: urgent ? '#f87171' : 'rgba(240,240,248,0.45)' }}>
                    <Calendar size={13} />Exam le {format(parseISO(cours.exam_date), 'd MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>
            </div>

            {/* Prep score ring */}
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                  <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#C8FF00" strokeWidth="5"
                      strokeDasharray={`${(cours.prep_score / 100) * 188} 188`} strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(200,255,0,0.6))' }} />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#C8FF00' }}>
                    {cours.prep_score}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(240,240,248,0.35)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Prep score</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 22, position: 'relative', zIndex: 1 }}>
            {[
              { icon: Brain,  val: `${masteryPct}%`,   label: 'Maîtrise',   color: '#C8FF00', glow: 'rgba(200,255,0,0.15)' },
              { icon: Target, val: avgScore !== null ? `${avgScore}%` : '—', label: 'Moy. QCM', color: '#3CEFFF', glow: 'rgba(60,239,255,0.15)' },
              { icon: Calendar, val: daysLeft !== null ? `J-${daysLeft}` : '—', label: 'Avant exam', color: urgent ? '#f87171' : 'rgba(240,240,248,0.5)', glow: urgent ? 'rgba(248,113,113,0.15)' : 'transparent' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px', boxShadow: `inset 0 0 20px ${s.glow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <s.icon size={13} color={s.color} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 18 : 22, color: s.color, lineHeight: 1 }}>{s.val}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', fontFamily: 'DM Sans, sans-serif' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.1)} style={{ marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Link href={`/qcm/${cours.id}?mode=rapide`} style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 0 32px rgba(200,255,0,0.35), 0 6px 0 #4A7400' }}
                whileTap={{ y: 3 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#C8FF00', color: '#0C0C10', border: 'none', borderRadius: 100, padding: '15px 24px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #4A7400', transition: 'all 0.2s' }}>
                <Play size={15} fill="#0C0C10" />QCM rapide — 10 questions
              </motion.button>
            </Link>
            <Link href={`/qcm/${cours.id}`} style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ y: -2, borderColor: '#C8FF00', boxShadow: '0 0 20px rgba(200,255,0,0.12), 0 4px 0 rgba(200,255,0,0.3)' }}
                whileTap={{ y: 2 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(200,255,0,0.3)', color: '#C8FF00', borderRadius: 100, padding: '15px 24px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Target size={15} />QCM complet — toutes les questions
              </motion.button>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/review">
              <motion.button
                whileHover={{ y: -1, borderColor: colors.muted }}
                whileTap={{ y: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 100, padding: '11px 20px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                <BookOpen size={14} />Réviser les fiches
              </motion.button>
            </Link>
            <Link href="/coach">
              <motion.button
                whileHover={{ y: -1, borderColor: colors.muted }}
                whileTap={{ y: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 100, padding: '11px 20px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Brain size={14} />Coach IA
              </motion.button>
            </Link>
            <CourseTutor coursId={cours.id} coursTitle={cours.title} />
          </div>
        </motion.div>

        {/* Fiches section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring(0.15)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#C8FF00', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>Contenu généré</p>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text, letterSpacing: '-0.3px' }}>Fiches de révision</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 100, padding: '6px 14px' }}>
              <Zap size={12} color="#C8FF00" />
              <span style={{ fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>{memorized}/{fiches.length} mémorisées</span>
            </div>
          </div>

          {cours.status === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 88, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 20, opacity: 1 - i * 0.2 }} />
              ))}
              <p style={{ textAlign: 'center', fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif', padding: '8px 0' }}>
                Génération des fiches en cours… ✨
              </p>
            </div>
          ) : fiches.length === 0 ? (
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 20, textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Pas encore de fiches. La génération a peut-être échoué.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fiches.map((fiche, i) => <FicheCard key={fiche.id} fiche={fiche} index={i + 1} coursId={cours.id} />)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
