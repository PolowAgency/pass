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
            <div style={{ background: colors.surface, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Key concepts */}
              {fiche.content.key_concepts?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(60,239,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tag size={13} color={colors.blue} />
                    </div>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text }}>Concepts clés</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fiche.content.key_concepts.map((kc, i) => (
                      <div key={i} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 14px' }}>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text, marginBottom: 3 }}>{kc.term}</p>
                        <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{kc.definition}</p>
                        {kc.example && <p style={{ fontSize: 11, color: colors.muted, fontStyle: 'italic', marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>Ex : {kc.example}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important points */}
              {fiche.content.important_points?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: colors.limeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={13} color={colors.limeDark} />
                    </div>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: colors.text }}>Points essentiels</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {fiche.content.important_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.lime, flexShrink: 0, marginTop: 6 }} />
                        <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory trick */}
              {fiche.content.memory_trick && (
                <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Lightbulb size={14} color="#FB923C" />
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#FB923C' }}>Astuce mémo</h4>
                  </div>
                  <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic' }}>{fiche.content.memory_trick}</p>
                </div>
              )}

              {/* Photo */}
              <div>
                <input ref={imgInputRef} type="file" accept="image/*" capture="environment" onChange={uploadImage} style={{ display: 'none' }} />
                {fiche.image_url ? (
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <img src={fiche.image_url} alt="Note" style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }} />
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={removeImage}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <X size={13} />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button whileHover={{ y: -1 }} whileTap={{ y: 1 }} onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 13, border: `1px dashed ${colors.border}`, background: 'transparent', color: colors.muted, fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                    <Camera size={14} />{uploadingImg ? 'Upload...' : 'Ajouter une photo (schéma, cours...)'}
                  </motion.button>
                )}
              </div>

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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
