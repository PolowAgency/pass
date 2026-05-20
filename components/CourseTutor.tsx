'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, ChevronDown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Message { role: 'user' | 'assistant'; content: string }

interface Props { coursId: string; coursTitle: string }

const SUGGESTIONS = [
  'Explique-moi le concept principal',
  'Quels sont les points les plus importants ?',
  'Donne-moi un exemple concret',
  'Qu\'est-ce qui tombe souvent à l\'exam ?',
]

export default function CourseTutor({ coursId, coursTitle }: Props) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, cours_id: coursId }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply ?? data.error ?? 'Erreur' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Erreur réseau, réessaie.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ y: -2, boxShadow: '0 0 28px rgba(200,255,0,0.3), 0 6px 0 #4A7400' }}
        whileTap={{ y: 2 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#C8FF00', color: '#0C0C10',
          border: 'none', borderRadius: 100,
          padding: '13px 22px',
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14,
          cursor: 'pointer', boxShadow: '0 4px 0 #4A7400',
          transition: 'all 0.2s',
        }}>
        <Sparkles size={15} />
        Poser une question
      </motion.button>

      {/* Panel tuteur */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
            onClick={e => e.target === e.currentTarget && setOpen(false)}>

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: 640,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '24px 24px 0 0',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}>

              {/* Header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#C8FF00" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: colors.text, lineHeight: 1 }}>Tuteur IA</p>
                  <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{coursTitle}</p>
                </div>
                <motion.button onClick={() => setOpen(false)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 100, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
                  <X size={14} />
                </motion.button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && (
                  <div>
                    <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 14, lineHeight: 1.6 }}>
                      Pose toutes tes questions sur ce cours. Le tuteur connaît le contenu de tes fiches.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {SUGGESTIONS.map(s => (
                        <motion.button key={s} onClick={() => send(s)} whileHover={{ x: 4 }}
                          style={{ textAlign: 'left', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: colors.text, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      background: m.role === 'user' ? '#C8FF00' : colors.surface2,
                      color: m.role === 'user' ? '#0C0C10' : colors.text,
                      border: m.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                      borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '12px 16px',
                      fontSize: 14, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6,
                      fontWeight: m.role === 'user' ? 600 : 400,
                    }}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: colors.muted }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                {messages.length > 0 && (
                  <motion.button onClick={() => setOpen(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 100, padding: '10px 12px', cursor: 'pointer', color: colors.muted, display: 'flex', alignItems: 'center' }}>
                    <ChevronDown size={16} />
                  </motion.button>
                )}
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Pose ta question..."
                  style={{
                    flex: 1, background: colors.surface2, border: `1px solid ${colors.border}`,
                    borderRadius: 14, padding: '12px 16px',
                    fontSize: 14, fontFamily: 'DM Sans, sans-serif', color: colors.text,
                    outline: 'none', resize: 'none',
                  }}
                />
                <motion.button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  whileHover={input.trim() ? { scale: 1.05, boxShadow: '0 0 16px rgba(200,255,0,0.3)' } : {}}
                  whileTap={input.trim() ? { scale: 0.95 } : {}}
                  style={{
                    width: 42, height: 42, borderRadius: 100, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                    background: input.trim() && !loading ? '#C8FF00' : colors.surface2,
                    color: input.trim() && !loading ? '#0C0C10' : colors.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0,
                    boxShadow: input.trim() && !loading ? '0 3px 0 #4A7400' : 'none',
                  }}>
                  <Send size={16} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
