'use client'

import { useState, useRef, useEffect } from 'react'
import { CoachMessage } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap, Target, Brain, BookOpen, Sparkles } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { awardXP, XP_REWARDS } from '@/lib/xp'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  { icon: Target,    text: 'Comment je me situe pour mes examens ?' },
  { icon: Brain,     text: 'Donne-moi une méthode de révision efficace' },
  { icon: BookOpen,  text: 'Quel cours réviser en priorité ?' },
  { icon: Sparkles,  text: 'Motive-moi, j\'ai la flemme' },
]

interface Props {
  initialHistory: CoachMessage[]
  profile: { full_name: string | null; plan: string; streak_days: number } | null
}

export default function CoachView({ initialHistory, profile }: Props) {
  const { colors, theme } = useTheme()
  const [messages, setMessages] = useState<CoachMessage[]>(initialHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput(''); setLoading(true)
    const userMsg: CoachMessage = { id: crypto.randomUUID(), user_id: '', role: 'user', content: msg, created_at: new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) })
      if (!res.ok) throw new Error()
      const { reply } = await res.json()
      setMessages(p => [...p, { id: crypto.randomUUID(), user_id: '', role: 'assistant', content: reply, created_at: new Date().toISOString() }])
    } catch (err: unknown) {
      const data = err instanceof Error ? null : (err as { message?: string })
      if ((data as { status?: number })?.status === 429) {
        toast.error('Limite atteinte. Passe à Premium pour continuer.', { duration: 4000 })
      } else {
        // Try to get error from response
        const res = err as Response
        if (res?.json) {
          const json = await res.json().catch(() => ({}))
          if (json.error === 'limit_reached') {
            toast.error(json.message ?? 'Limite quotidienne atteinte.', { duration: 4000 })
            setMessages(p => p.filter(m => m.id !== userMsg.id))
            return
          }
        }
        toast.error('Le coach est indisponible.')
      }
      setMessages(p => p.filter(m => m.id !== userMsg.id))
    } finally { setLoading(false) }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', transition: 'background 0.25s' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: `2px solid ${colors.border}`, background: colors.surface, flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #FF3CAC, #C8FF00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 #AA0066' }}>
          <Zap size={20} color="#0C0C10" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.text }}>Coach PASS</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>En ligne · sans filtre</span>
          </div>
        </div>
        {(profile?.streak_days ?? 0) > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: colors.streakBg, border: `2px solid ${colors.streakBorder}` }}>
            <span>🔥</span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.streakText }}>{profile?.streak_days} jours</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, rgba(255,60,172,0.12), rgba(200,255,0,0.12))', border: `2px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={30} color={colors.limeDark} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: colors.text, marginBottom: 6 }}>
                Yo {profile?.full_name?.split(' ')[0] ?? ''} ! C&apos;est ton coach 🎯
              </p>
              <p style={{ fontSize: 14, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Pose-moi tes questions, je t&apos;aide à cartonner.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
              {SUGGESTIONS.map((s, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  onClick={() => send(s.text)} whileHover={{ y: -2 }} whileTap={{ y: 1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: 16, cursor: 'pointer', textAlign: 'left', boxShadow: `0 3px 0 ${colors.border2}` }}>
                  <s.icon size={14} color={colors.limeDark} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{s.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #FF3CAC, #C8FF00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 0 #AA0066' }}>
                  <Zap size={15} color="#0C0C10" strokeWidth={2.5} />
                </div>
              )}
              <div style={{ maxWidth: '75%', padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                ...(msg.role === 'user'
                  ? { background: colors.lime, color: colors.limeText, fontWeight: 600, boxShadow: `0 3px 0 ${colors.limeDark}` }
                  : { background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, boxShadow: `0 3px 0 ${colors.border2}` }),
                fontSize: 14, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
                {msg.content.split('\n').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #FF3CAC, #C8FF00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 0 #AA0066' }}>
              <Zap size={15} color="#0C0C10" strokeWidth={2.5} />
            </div>
            <div style={{ padding: '12px 16px', background: colors.surface, border: `2px solid ${colors.border}`, borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, alignItems: 'center', boxShadow: `0 3px 0 ${colors.border2}` }}>
              {[0,0.15,0.3].map((delay, i) => (
                <motion.span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: colors.muted, display: 'block' }}
                  animate={{ opacity: [0.3,1,0.3], y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 1, delay }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px 24px', borderTop: `2px solid ${colors.border}`, background: colors.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ flex: 1, background: colors.surface2, border: `2px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Pose une question au coach…" rows={1}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', fontSize: 14, color: colors.text, fontFamily: 'DM Sans, sans-serif', resize: 'none', outline: 'none', maxHeight: 120, lineHeight: 1.5 }} />
          </div>
          <motion.button onClick={() => send()} disabled={!input.trim() || loading}
            whileHover={input.trim() && !loading ? { y: -2 } : {}} whileTap={input.trim() && !loading ? { y: 2 } : {}}
            style={{ width: 46, height: 46, borderRadius: 14, background: input.trim() && !loading ? colors.lime : colors.surface2, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', opacity: input.trim() && !loading ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: input.trim() && !loading ? `0 4px 0 ${colors.limeDark}` : `0 4px 0 ${colors.border2}` }}>
            <Send size={17} color={input.trim() && !loading ? colors.limeText : colors.muted} strokeWidth={2} />
          </motion.button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
      </div>
    </div>
  )
}
