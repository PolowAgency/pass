'use client'

import { useState } from 'react'
import { Fiche } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, CheckCircle2, Brain, Lightbulb, Zap, Tag, Camera, X } from 'lucide-react'
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { checkAndAwardBadges } from '@/lib/badges'
import toast from 'react-hot-toast'

interface FicheCardProps { fiche: Fiche; index: number; coursId: string }

const DIFF: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Facile',    color: '#4ade80' },
  medium: { label: 'Moyen',     color: '#C8FF00' },
  hard:   { label: 'Difficile', color: '#FF3CAC' },
}

export function FicheCard({ fiche: initialFiche, index, coursId }: FicheCardProps) {
  const { colors } = useTheme()
  const [fiche, setFiche] = useState(initialFiche)
  const [expanded, setExpanded] = useState(false)
  const [memorizing, setMemorizing] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const diff = DIFF[fiche.difficulty] ?? DIFF.medium

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const img = e.target.files?.[0]
    if (!img) return
    if (img.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (max 5 Mo)'); return }
    setUploadingImg(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingImg(false); return }
    const path = `${user.id}/${fiche.id}.${img.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('fiche-images').upload(path, img, { upsert: true })
    if (upErr) { toast.error('Erreur upload image'); setUploadingImg(false); return }
    const { data: { publicUrl } } = supabase.storage.from('fiche-images').getPublicUrl(path)
    await supabase.from('fiches').update({ image_url: publicUrl }).eq('id', fiche.id)
    setFiche(f => ({ ...f, image_url: publicUrl }))
    toast.success('Photo ajoutée !')
    setUploadingImg(false)
  }

  async function removeImage() {
    const supabase = createClient()
    await supabase.from('fiches').update({ image_url: null }).eq('id', fiche.id)
    setFiche(f => ({ ...f, image_url: null }))
    toast('Photo supprimée')
  }

  async function toggleMemorized() {
    setMemorizing(true)
    const supabase = createClient()
    const newVal = !fiche.memorized
    await supabase.from('fiches').update({ memorized: newVal, review_count: fiche.review_count + 1, last_reviewed: new Date().toISOString() }).eq('id', fiche.id)
    setFiche(f => ({ ...f, memorized: newVal, review_count: f.review_count + 1 }))
    if (newVal) {
      toast.success('Mémorisée ! ⚡')
      checkAndAwardBadges().catch(() => {})
    } else {
      toast('Marquée comme non mémorisée')
    }
    setMemorizing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', damping: 20 }}
      style={{ borderRadius: 20, overflow: 'hidden', border: `2px solid ${fiche.memorized ? 'rgba(74,222,128,0.3)' : colors.border}`, boxShadow: `0 4px 0 ${colors.border2}` }}>

      {/* Header — always dark gradient */}
      <div onClick={() => setExpanded(e => !e)} style={{ background: 'linear-gradient(135deg, #1C1C2E 0%, #2D1B69 100%)', padding: '18px 20px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#C8FF00', flexShrink: 0 }}>
            {index}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: '#F0F0F8', lineHeight: 1.3, marginBottom: 6 }}>{fiche.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${diff.color}18`, color: diff.color, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{diff.label}</span>
              {fiche.review_count > 0 && <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{fiche.review_count}× révisée</span>}
              {fiche.memorized && (
                <span style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'DM Sans, sans-serif' }}>
                  <CheckCircle2 size={11} />Mémorisée
                </span>
              )}
            </div>
          </div>
          <div style={{ color: 'rgba(240,240,248,0.4)', flexShrink: 0 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.65)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55, marginTop: 10 }}>{fiche.content.summary}</p>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: colors.surface, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(() => {
              const xc = fiche.content as { key_numbers?: string[]; schema_text?: string | null; exam_traps?: string[] }
              return <>

              {/* Image du document */}
              {fiche.image_url && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${colors.border}`, position: 'relative' }}>
                  <img src={fiche.image_url} alt="Schéma" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain', background: '#000' }} />
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={removeImage}
                    style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <X size={12} />
                  </motion.button>
                </div>
              )}

              {/* Chiffres clés */}
              {(xc.key_numbers?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {xc.key_numbers!.map((n, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(60,239,255,0.1)', border: '1px solid rgba(60,239,255,0.25)', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: colors.blue }}>
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Schéma textuel */}
              {xc.schema_text && (
                <div style={{ background: 'rgba(200,255,0,0.04)', border: `1px solid ${colors.limeBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>🗺️</span>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.limeDark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schéma</h4>
                  </div>
                  <pre style={{ fontSize: 12, color: colors.text, lineHeight: 1.7, fontFamily: 'ui-monospace, SFMono-Regular, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {xc.schema_text}
                  </pre>
                </div>
              )}

              {/* Key concepts */}
              {fiche.content.key_concepts?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(60,239,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tag size={12} color={colors.blue} />
                    </div>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Concepts clés</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {fiche.content.key_concepts.map((kc, i) => (
                      <div key={i} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 11, padding: '9px 12px' }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text, marginBottom: 2 }}>{kc.term}</p>
                        <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{kc.definition}</p>
                        {kc.example && <p style={{ fontSize: 11, color: colors.blue, fontStyle: 'italic', marginTop: 3, fontFamily: 'DM Sans, sans-serif' }}>→ {kc.example}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important points */}
              {fiche.content.important_points?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: colors.limeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={12} color={colors.limeDark} />
                    </div>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>À l&apos;examen</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {fiche.content.important_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: colors.lime, flexShrink: 0, marginTop: 7, boxShadow: `0 0 6px ${colors.lime}` }} />
                        <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièges d'examen */}
              {(xc.exam_traps?.length ?? 0) > 0 && (
                <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <span style={{ fontSize: 13 }}>⚠️</span>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pièges d&apos;examen</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {xc.exam_traps!.map((trap, i) => (
                      <p key={i} style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{trap}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory trick */}
              {fiche.content.memory_trick && (
                <div style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.18)', borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <Lightbulb size={13} color="#FB923C" />
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#FB923C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mémo</h4>
                  </div>
                  <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic' }}>{fiche.content.memory_trick}</p>
                </div>
              )}

              {/* Ajouter photo manuellement si pas d'image auto */}
              {!fiche.image_url && (
                <div>
                  <input ref={imgInputRef} type="file" accept="image/*" capture="environment" onChange={uploadImage} style={{ display: 'none' }} />
                  <motion.button whileHover={{ y: -1 }} whileTap={{ y: 1 }} onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', borderRadius: 11, border: `1px dashed ${colors.border}`, background: 'transparent', color: colors.muted, fontFamily: 'DM Sans, sans-serif', fontSize: 12, cursor: 'pointer' }}>
                    <Camera size={13} />{uploadingImg ? 'Upload...' : 'Ajouter un schéma photo'}
                  </motion.button>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                  onClick={toggleMemorized} disabled={memorizing}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 13, border: `2px solid ${fiche.memorized ? '#22c55e' : colors.border}`, background: fiche.memorized ? 'rgba(34,197,94,0.1)' : colors.surface2, color: fiche.memorized ? '#22c55e' : colors.muted, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: fiche.memorized ? '0 3px 0 #15803d' : `0 3px 0 ${colors.border2}`, transition: 'all 0.15s' }}>
                  <CheckCircle2 size={14} />
                  {fiche.memorized ? 'Mémorisée ✓' : 'Mémoriser'}
                </motion.button>
                <motion.button whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                  onClick={() => window.location.href = `/qcm/${coursId}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 13, border: `2px solid ${colors.border}`, background: colors.surface2, color: colors.muted, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `0 3px 0 ${colors.border2}` }}>
                  <Brain size={14} />Quiz
                </motion.button>
              </div>
              </> })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
