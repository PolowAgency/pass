'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, ImageIcon, X, Zap, Calendar, BookOpen, Loader2, ClipboardPaste } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import toast from 'react-hot-toast'

const SUBJECTS_GENERAL = ['Mathématiques','Physique','Chimie','SVT','Histoire-Géo','Philosophie','Économie','Droit','Informatique','Littérature','Autre']
const SUBJECTS_MEDICAL = ['Anatomie','Histologie','Pharmacologie','Biologie','Physiologie','Parodontologie','Endodontie','Chirurgie buccale','Prothèse dentaire','Orthodontie','Pathologie buccale','Radiologie','Odontologie conservatrice','Médecine buccale','Autre (médecine)']
const ALL_SUBJECTS = [...SUBJECTS_MEDICAL, ...SUBJECTS_GENERAL]
const SUBJECTS = ALL_SUBJECTS

export default function UploadPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'drop' | 'form'>('drop')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''))
      setStep('form')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0]
      if (err?.code === 'file-too-large') toast.error('Fichier trop lourd (max 20 Mo)')
      else toast.error('Format non supporté. PDF, Word (.docx) ou image uniquement.')
    },
  })

  async function handleSubmitFile(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('cours-files').upload(filePath, file)
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('cours-files').getPublicUrl(filePath)
      const { data: cours, error: coursErr } = await supabase.from('cours').insert({
        user_id: user.id, title, subject: subject || null, exam_date: examDate || null,
        file_url: publicUrl, file_type: file.type, status: 'processing',
      }).select().single()
      if (coursErr) throw coursErr

      toast.loading('Génération des fiches en cours…', { id: 'gen' })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cours_id', cours.id)
      fd.append('title', title)

      const res = await fetch('/api/generate', { method: 'POST', body: fd })
      const result = await res.json()
      if (!res.ok) {
        toast.dismiss('gen')
        toast.error(result.error ?? 'Erreur de génération', { duration: 5000 })
        setLoading(false)
        return
      }
      toast.dismiss('gen')
      toast.success(`${result.fiches_count} fiches générées ! 🎉`)
      router.push(`/cours/${cours.id}`)
    } catch (err) {
      console.error(err)
      toast.dismiss('gen')
      toast.error('Une erreur est survenue.')
      setLoading(false)
    }
  }

  async function handleSubmitText(e: React.FormEvent) {
    e.preventDefault()
    if (!pastedText.trim() || !title) return
    if (pastedText.trim().length < 100) {
      toast.error('Le texte est trop court (minimum 100 caractères)')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Créer un fichier texte à partir du contenu collé
      const blob = new Blob([pastedText], { type: 'text/plain' })
      const textFile = new File([blob], `${title}.txt`, { type: 'text/plain' })

      const { data: cours, error: coursErr } = await supabase.from('cours').insert({
        user_id: user.id, title, subject: subject || null, exam_date: examDate || null,
        file_type: 'text/plain', status: 'processing',
      }).select().single()
      if (coursErr) throw coursErr

      toast.loading('Génération des fiches en cours…', { id: 'gen' })
      const fd = new FormData()
      fd.append('file', textFile)
      fd.append('cours_id', cours.id)
      fd.append('title', title)

      const res = await fetch('/api/generate', { method: 'POST', body: fd })
      const result = await res.json()
      if (!res.ok) {
        toast.dismiss('gen')
        toast.error(result.error ?? 'Erreur de génération', { duration: 5000 })
        setLoading(false)
        return
      }
      toast.dismiss('gen')
      toast.success(`${result.fiches_count} fiches générées ! 🎉`)
      router.push(`/cours/${cours.id}`)
    } catch (err) {
      console.error(err)
      toast.dismiss('gen')
      toast.error('Une erreur est survenue.')
      setLoading(false)
    }
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', background: colors.inputBg, border: `2px solid ${colors.border}`,
    borderRadius: 14, padding: '12px 14px 12px 42px', fontSize: 14,
    color: colors.text, outline: 'none', fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s', ...extra,
  })

  const showForm = (mode === 'file' && step === 'form' && file) || (mode === 'text' && pastedText.trim().length > 20)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: isMobile ? '20px 16px 100px' : '32px 24px 48px', transition: 'background 0.25s' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'Outfit, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>Nouveau cours</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: isMobile ? 26 : 32, color: colors.text, letterSpacing: '-0.5px', marginBottom: 6 }}>Upload ton cours</h1>
          <p style={{ fontSize: 14, color: colors.muted, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' }}>Fiches générées par IA en moins de 30 secondes.</p>
        </motion.div>

        {/* Mode tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'flex', gap: 8, marginBottom: 20, background: colors.surface2, border: `2px solid ${colors.border}`, borderRadius: 16, padding: 4 }}>
          {[
            { key: 'file', icon: <FileText size={15} />, label: 'Fichier (PDF, image)' },
            { key: 'text', icon: <ClipboardPaste size={15} />, label: 'Coller du texte' },
          ].map(tab => (
            <button key={tab.key} type="button" onClick={() => { setMode(tab.key as 'file' | 'text'); setStep('drop') }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                background: mode === tab.key ? colors.surface : 'transparent',
                color: mode === tab.key ? colors.text : colors.muted,
                boxShadow: mode === tab.key ? `0 2px 0 ${colors.border2}` : 'none',
              }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── MODE FICHIER ── */}
          {mode === 'file' && (
            <motion.div key="file-mode" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
              {step === 'drop' && (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? colors.lime : colors.border}`, borderRadius: 24, padding: isMobile ? '36px 20px' : '56px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer', background: isDragActive ? colors.limeBg : colors.surface, transition: 'all 0.2s', boxShadow: isDragActive ? `0 0 0 4px ${colors.limeBorder}` : `0 4px 0 ${colors.border2}` }}>
                  <input {...getInputProps()} />
                  <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                    style={{ width: 64, height: 64, borderRadius: 20, background: isDragActive ? colors.limeBg : colors.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isDragActive ? colors.lime : colors.border}` }}>
                    <Upload size={28} color={isDragActive ? colors.limeDark : colors.muted} />
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: colors.text, marginBottom: 6 }}>
                      {isDragActive ? 'Lâche ici !' : 'Glisse ton cours ici'}
                    </p>
                    <p style={{ fontSize: 13, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>
                      ou <span style={{ color: colors.limeDark, fontWeight: 600 }}>clique pour choisir</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { icon: <FileText size={12} />, label: 'PDF' },
                      { icon: <FileText size={12} />, label: 'Word (.docx)' },
                      { icon: <ImageIcon size={12} />, label: 'JPG / PNG' },
                    ].map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: colors.muted, background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '4px 10px' }}>
                        {f.icon}{f.label}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Max 20 Mo</p>
                </div>
              )}

              {step === 'form' && file && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <form onSubmit={handleSubmitFile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: colors.surface, border: `2px solid ${colors.limeBorder}`, borderRadius: 16, padding: '14px 16px', boxShadow: `0 4px 0 ${colors.limeDark}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: colors.limeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {file.type.startsWith('image/') ? <ImageIcon size={18} color={colors.limeDark} /> : <FileText size={18} color={colors.limeDark} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                        <p style={{ fontSize: 12, color: colors.muted }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
                      </div>
                      <button type="button" onClick={() => { setFile(null); setStep('drop') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>
                    <FormFields title={title} setTitle={setTitle} subject={subject} setSubject={setSubject} examDate={examDate} setExamDate={setExamDate} colors={colors} inp={inp} subjects={SUBJECTS} />
                    <SubmitBtn loading={loading} />
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── MODE TEXTE ── */}
          {mode === 'text' && (
            <motion.div key="text-mode" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <form onSubmit={handleSubmitText} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
                    Colle ton cours ici
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Colle ton cours, tes notes, un chapitre de manuel… L'IA s'occupe du reste."
                    rows={10}
                    style={{ width: '100%', background: colors.inputBg, border: `2px solid ${pastedText.length > 20 ? colors.lime : colors.border}`, borderRadius: 16, padding: '14px 16px', fontSize: 14, color: colors.text, outline: 'none', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, resize: 'vertical', transition: 'border-color 0.2s', boxShadow: pastedText.length > 20 ? `0 0 0 2px ${colors.limeBorder}` : 'none' }}
                    onFocus={e => { if (pastedText.length <= 20) e.target.style.borderColor = colors.lime }}
                    onBlur={e => { if (pastedText.length <= 20) e.target.style.borderColor = colors.border }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <p style={{ fontSize: 11, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>Minimum 100 caractères</p>
                    <p style={{ fontSize: 11, color: pastedText.length >= 100 ? colors.limeDark : colors.muted, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                      {pastedText.length} car.
                    </p>
                  </div>
                </div>

                {showForm && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <FormFields title={title} setTitle={setTitle} subject={subject} setSubject={setSubject} examDate={examDate} setExamDate={setExamDate} colors={colors} inp={inp} subjects={SUBJECTS} />
                    <SubmitBtn loading={loading} disabled={pastedText.trim().length < 100 || !title} />
                  </motion.div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FormFields({ title, setTitle, subject, setSubject, examDate, setExamDate, colors, inp, subjects }: {
  title: string; setTitle: (v: string) => void
  subject: string; setSubject: (v: string) => void
  examDate: string; setExamDate: (v: string) => void
  colors: ReturnType<typeof useTheme>['colors']
  inp: (extra?: React.CSSProperties) => React.CSSProperties
  subjects: string[]
}) {
  return (
    <>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Titre du cours</label>
        <div style={{ position: 'relative' }}>
          <BookOpen size={15} color={colors.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: La Révolution française" required maxLength={80} style={inp()}
            onFocus={e => e.target.style.borderColor = colors.lime}
            onBlur={e => e.target.style.borderColor = colors.border} />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>Matière</label>
        <p style={{ fontSize: 11, color: colors.muted, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>Médecine / Dentaire</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {SUBJECTS_MEDICAL.map(s => (
            <button key={s} type="button" onClick={() => setSubject(s === subject ? '' : s)}
              style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: subject === s ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', border: '2px solid', background: subject === s ? 'rgba(60,239,255,0.1)' : colors.surface, borderColor: subject === s ? colors.blue : colors.border, color: subject === s ? colors.blue : colors.muted, boxShadow: subject === s ? `0 2px 0 #0088AA` : `0 2px 0 ${colors.border2}` }}>
              {s}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: colors.muted, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>Général</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SUBJECTS_GENERAL.map(s => (
            <button key={s} type="button" onClick={() => setSubject(s === subject ? '' : s)}
              style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: subject === s ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', border: '2px solid', background: subject === s ? colors.limeBg : colors.surface, borderColor: subject === s ? colors.lime : colors.border, color: subject === s ? colors.limeDark : colors.muted, boxShadow: subject === s ? `0 2px 0 ${colors.limeDark}` : `0 2px 0 ${colors.border2}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
          Date d&apos;examen <span style={{ color: colors.muted, fontWeight: 400 }}>(optionnel)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <Calendar size={15} color={colors.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ ...inp(), colorScheme: 'auto' }}
            onFocus={e => e.target.style.borderColor = colors.lime}
            onBlur={e => e.target.style.borderColor = colors.border} />
        </div>
        <p style={{ fontSize: 11, color: colors.muted, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
          Si renseignée, l'app adapte le rythme de révision à ton exam
        </p>
      </div>
    </>
  )
}

function SubmitBtn({ loading, disabled }: { loading: boolean; disabled?: boolean }) {
  const { colors } = useTheme()
  return (
    <>
      <motion.button type="submit" disabled={loading || disabled}
        whileHover={!loading && !disabled ? { y: -2 } : {}} whileTap={!loading && !disabled ? { y: 2 } : {}}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: loading || disabled ? colors.surface2 : colors.lime, color: loading || disabled ? colors.muted : colors.limeText, border: 'none', borderRadius: 16, padding: '16px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, cursor: loading || disabled ? 'not-allowed' : 'pointer', boxShadow: loading || disabled ? `0 4px 0 ${colors.border2}` : `0 4px 0 ${colors.limeDark}`, marginTop: 4, transition: 'all 0.15s' }}>
        {loading ? <><Loader2 size={18} className="animate-spin" />Génération en cours…</> : <><Zap size={18} />Générer mes fiches</>}
      </motion.button>
      {!loading && <p style={{ textAlign: 'center', fontSize: 12, color: colors.muted, fontFamily: 'DM Sans, sans-serif' }}>⚡ Généré par IA en moins de 30 secondes</p>}
    </>
  )
}

