import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPlan, PLANS } from '@/lib/plans'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY! }) }

function buildSystemPrompt(lang: 'fr' | 'en', imageCount = 0) {
  const langBlock = lang === 'en'
    ? `LANGUAGE:
- Generate ALL fiches and questions in ENGLISH, regardless of the source language
- If the course is in French, translate and rephrase in English
- Keep technical terms in their original language if necessary (Latin anatomical terms, etc.) but explain in English`
    : `LANGUE :
- Génère TOUJOURS les fiches et les questions en français, quelle que soit la langue du cours source
- Si le cours est en anglais, traduis et reformule en français
- Conserve les termes techniques dans leur langue d'origine si nécessaire (ex: termes anatomiques latins, anglicismes médicaux courants), mais explique en français`

  const imageBlock = imageCount > 0
    ? (lang === 'en'
      ? `\nIMAGES FROM THE DOCUMENT:
- The document contains ${imageCount} image(s)/diagram(s), numbered 1 to ${imageCount}
- Their descriptions are provided in the course content (prefixed with [Image N])
- For each fiche, if one of these images directly illustrates the concept (diagram, schema, table), set "image_index" to the image number (1-${imageCount})
- Only assign an image if it's genuinely relevant to that fiche's specific concept
- Set "image_index": null if no image is relevant`
      : `\nIMAGES DU DOCUMENT :
- Le document contient ${imageCount} image(s)/schéma(s), numérotée(s) de 1 à ${imageCount}
- Leurs descriptions sont fournies dans le contenu du cours (préfixées par [Image N])
- Pour chaque fiche, si une de ces images illustre directement le concept (schéma, tableau, figure), indique "image_index" avec le numéro de l'image (1-${imageCount})
- N'assigne une image que si elle est vraiment pertinente pour ce concept précis
- Mets "image_index": null si aucune image n'est pertinente`)
    : ''

  const imageFormat = imageCount > 0 ? ',\n    "image_index": null' : ''

  return `Tu es un pédagogue expert (PASS, médecine, droit, sciences). Génère des fiches de révision COMPLÈTES et RIGOUREUSES depuis le cours fourni.
${langBlock}${imageBlock ? '\n' + imageBlock : ''}
OBJECTIF : chaque fiche doit permettre à un étudiant de répondre à des questions d'examen sur ce thème sans relire le cours. Contenu dense, précis, jamais générique.

QUALITÉ ATTENDUE PAR CHAMP :
- summary : 3-4 phrases. Explique LE CONCEPT en profondeur — mécanisme, contexte, conséquences. NE PAS juste lister des mots-clés.
- key_concepts : 3-6 termes. Définition précise et autonome (pas une paraphrase du terme) + exemple concret tiré du cours.
- important_points : 4-6 assertions exactes type QCM ("La dose X est...", "Le mécanisme Y entraîne...", "En cas de Z, on observe...").
- exam_traps : 2-3 pièges spécifiques ("Ne pas confondre A et B car...", "Piège : on pense X mais en réalité Y").
- key_numbers : valeurs chiffrées du cours uniquement (doses, dates, constantes). Format "valeur : sens". [] si aucune valeur dans le cours.
- schema_text : tableau ASCII ou arbre texte UNIQUEMENT si le concept a une structure hiérarchique ou un processus. null sinon.
- memory_trick : vrai moyen mnémotechnique — acronyme, phrase-image, histoire courte. JAMAIS "retiens que...".

LIMITES : 1 fiche par thème (min 3, max 5 fiches). Max 4 key_concepts, max 4 important_points, max 2 exam_traps.${imageFormat ? ' image_index : numéro ou null.' : ''}
QCM : 2 questions par fiche, 4 options, distracteurs plausibles, explication utile (correct_answer = index 0-3).
JSON : {"fiches":[{"title":"...","difficulty":"easy|medium|hard","content":{"summary":"...","key_concepts":[{"term":"...","definition":"...","example":"..."}],"important_points":["..."],"schema_text":null,"exam_traps":["..."],"key_numbers":["..."],"memory_trick":"..."${imageFormat}}}],"questions":[{"fiche_title":"...","question":"...","options":["A","B","C","D"],"correct_answer":0,"explanation":"..."}]}`
}

// Validation stricte de la structure générée
function validateGenerated(data: unknown, imageCount = 0): { ok: true; data: GeneratedData } | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Réponse non-objet' }
  const d = data as Record<string, unknown>

  if (!Array.isArray(d.fiches) || d.fiches.length === 0) return { ok: false, error: 'Aucune fiche générée' }
  if (!Array.isArray(d.questions)) return { ok: false, error: 'Questions manquantes' }

  for (let i = 0; i < d.fiches.length; i++) {
    const f = d.fiches[i] as Record<string, unknown>
    if (!f.title || typeof f.title !== 'string') return { ok: false, error: `Fiche ${i}: titre manquant` }
    if (!f.content || typeof f.content !== 'object') return { ok: false, error: `Fiche ${i}: content manquant` }
    const c = f.content as Record<string, unknown>
    if (!c.summary) return { ok: false, error: `Fiche ${i}: summary manquant` }
    if (!Array.isArray(c.key_concepts)) f.content = { ...c, key_concepts: [] }
    if (!Array.isArray(c.important_points)) f.content = { ...c, important_points: [] }
    if (!c.memory_trick) f.content = { ...c, memory_trick: '' }
    if (!Array.isArray(c.exam_traps)) f.content = { ...f.content as Record<string, unknown>, exam_traps: [] }
    if (!Array.isArray(c.key_numbers)) f.content = { ...f.content as Record<string, unknown>, key_numbers: [] }
    if (typeof c.schema_text !== 'string' || c.schema_text === 'null' || !c.schema_text.trim()) f.content = { ...f.content as Record<string, unknown>, schema_text: null }
    if (!['easy', 'medium', 'hard'].includes(f.difficulty as string)) f.difficulty = 'medium'
    // Validate image_index if present
    if (imageCount > 0 && f.image_index !== null && f.image_index !== undefined) {
      const idx = Number(f.image_index)
      f.image_index = (!isNaN(idx) && idx >= 1 && idx <= imageCount) ? idx : null
    } else {
      f.image_index = null
    }
  }

  for (let i = 0; i < d.questions.length; i++) {
    const q = d.questions[i] as Record<string, unknown>
    if (!q.question || typeof q.question !== 'string') return { ok: false, error: `Question ${i}: texte manquant` }
    if (!Array.isArray(q.options) || q.options.length !== 4) return { ok: false, error: `Question ${i}: doit avoir exactement 4 options` }
    const ca = Number(q.correct_answer)
    if (isNaN(ca) || ca < 0 || ca >= q.options.length) return { ok: false, error: `Question ${i}: correct_answer invalide (doit être 0-${q.options.length - 1})` }
    q.correct_answer = ca
  }

  return { ok: true, data: d as unknown as GeneratedData }
}

interface FicheContent {
  summary: string
  key_concepts: { term: string; definition: string; example?: string }[]
  important_points: string[]
  memory_trick: string
  schema_text?: string | null
  exam_traps?: string[]
  key_numbers?: string[]
}

interface GeneratedFiche {
  title: string
  content: FicheContent
  difficulty: string
  image_index?: number | null
}

interface GeneratedQuestion {
  fiche_title: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

interface GeneratedData {
  fiches: GeneratedFiche[]
  questions: GeneratedQuestion[]
}

async function extractText(file: File): Promise<{ text: string; images?: string[]; error?: string }> {
  if (file.size > 20 * 1024 * 1024) return { text: '', error: 'Fichier trop lourd (max 20 Mo)' }

  if (file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>
      const data = await pdfParse(buffer)
      const text = data.text?.trim() ?? ''
      if (text.length < 50) return { text: '', error: 'PDF vide ou non lisible (PDF scanné ?)' }
      // Extraction images PDF en parallèle (non-bloquant si ça échoue)
      const { extractImagesFromPdf } = await import('@/lib/extract-images')
      const images = await extractImagesFromPdf(buffer).catch(() => [])
      return { text, images }
    } catch {
      return { text: '', error: 'Impossible de lire ce PDF. Essaie de coller le texte directement.' }
    }
  }

  // .docx — Word documents
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || file.name?.endsWith('.docx')
  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> }
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value?.trim() ?? ''
      if (text.length < 50) return { text: '', error: 'Document Word vide ou illisible' }
      // Extraction images DOCX
      const { extractImagesFromDocx } = await import('@/lib/extract-images')
      const images = await extractImagesFromDocx(buffer).catch(() => [])
      return { text, images }
    } catch {
      return { text: '', error: 'Impossible de lire ce fichier Word. Essaie de coller le texte directement.' }
    }
  }

  if (file.type === 'text/plain') {
    const text = await file.text()
    if (text.trim().length < 50) return { text: '', error: 'Texte trop court (minimum 50 caractères)' }
    return { text: text.trim() }
  }

  if (file.type.startsWith('image/')) {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const response = await getGroq().chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        { type: 'text', text: 'Transcris intégralement le texte de ce cours. Garde la structure. Sois exhaustif.' },
      ] }],
    })
    const text = response.choices[0]?.message?.content?.trim() ?? ''
    if (text.length < 50) return { text: '', error: 'Image illisible ou vide' }
    return { text }
  }

  return { text: '', error: `Format non supporté : ${file.type || 'inconnu'}` }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let coursId = ''

  try {
    const { data: profile } = await supabase.from('profiles').select('plan, uploads_count').eq('id', user.id).single()
    const plan = getPlan(profile?.plan)
    const limits = PLANS[plan]

    // Limite total uploads (plan gratuit)
    if (limits.max_uploads_total !== Infinity && (profile?.uploads_count ?? 0) >= limits.max_uploads_total) {
      return NextResponse.json({ error: 'Limite atteinte. Passe à Premium pour générer plus de cours !', upgrade: true }, { status: 403 })
    }

    // Rate limit horaire via xp_events (réutilise le log existant)
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count: recentGens } = await supabase
      .from('xp_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('source_type', 'cours')
      .gte('created_at', oneHourAgo)
    if ((recentGens ?? 0) >= limits.max_generations_per_hour) {
      return NextResponse.json({
        error: `Trop de générations. Limite : ${limits.max_generations_per_hour}/heure. Réessaie dans quelques minutes.`,
        retry_after: 3600,
      }, { status: 429 })
    }

    const formData = await request.formData()
    coursId = formData.get('cours_id') as string
    const lang = (formData.get('lang') as string) === 'en' ? 'en' : 'fr'
    const fileUrl = formData.get('file_url') as string | null
    const fileType = (formData.get('file_type') as string | null) ?? 'application/octet-stream'
    const fileName = (formData.get('file_name') as string | null) ?? 'cours'
    const textContent = formData.get('text_content') as string | null

    if (!coursId || (!fileUrl && !textContent)) {
      return NextResponse.json({ error: 'Fichier ou cours manquant' }, { status: 400 })
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 Mo

    let file: File
    if (textContent) {
      if (textContent.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Texte trop long (max 20 Mo)' }, { status: 413 })
      }
      file = new File([textContent], `${fileName}.txt`, { type: 'text/plain' })
    } else {
      const dlRes = await fetch(fileUrl!)
      if (!dlRes.ok) {
        console.error('[generate] fetch file failed', dlRes.status, fileUrl?.substring(0, 80))
        return NextResponse.json({ error: 'Impossible de récupérer le fichier' }, { status: 400 })
      }
      const contentLength = dlRes.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Fichier trop lourd (max 20 Mo)' }, { status: 413 })
      }
      const blob = await dlRes.blob()
      if (blob.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Fichier trop lourd (max 20 Mo)' }, { status: 413 })
      }
      file = new File([blob], fileName, { type: fileType })
    }

    // Vérification ownership : ce cours appartient bien à l'utilisateur
    const { data: cours } = await supabase.from('cours').select('id, user_id').eq('id', coursId).single()
    if (!cours || cours.user_id !== user.id) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    }

    // Extraction texte + images avec gestion d'erreur par type
    const { text: rawContent, images: rawImages = [], error: extractError } = await extractText(file)
    if (extractError || !rawContent) {
      await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
      return NextResponse.json({ error: extractError ?? 'Impossible de lire le fichier' }, { status: 400 })
    }

    await supabase.from('cours').update({ raw_content: rawContent.slice(0, 50000) }).eq('id', coursId)

    // Décrire les images avec Groq Vision (max 5, en parallèle)
    // et les uploader vers Supabase Storage pour les attacher aux fiches
    let visualContext = ''
    const imageUrls: string[] = [] // imageUrls[i] = URL de l'image i+1 (1-indexed dans le prompt)
    if (rawImages.length > 0) {
      const { describeImageWithGroq } = await import('@/lib/extract-images')
      const imagesToProcess = rawImages.slice(0, 5)

      // Décrire + uploader en parallèle
      const [descriptions, ...uploadResults] = await Promise.all([
        Promise.all(imagesToProcess.map(b64 => describeImageWithGroq(b64, lang, getGroq()).catch(() => ''))),
        ...imagesToProcess.map(async (b64, i) => {
          try {
            const buffer = Buffer.from(b64, 'base64')
            const path = `${user.id}/${coursId}/auto_${i + 1}.jpg`
            const { error } = await supabase.storage
              .from('fiche-images')
              .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
            if (error) return null
            const { data: { publicUrl } } = supabase.storage.from('fiche-images').getPublicUrl(path)
            return { index: i, url: publicUrl }
          } catch { return null }
        }),
      ])

      // Construire imageUrls en respectant les indices originaux
      for (const res of uploadResults) {
        if (res) imageUrls[res.index] = res.url
      }

      const validDescs = descriptions.filter(Boolean)
      if (validDescs.length > 0) {
        visualContext = lang === 'en'
          ? `\n\nVISUAL CONTENT FROM THE DOCUMENT (${validDescs.length} images/diagrams detected):\n${validDescs.map((d, i) => `[Image ${i + 1}]: ${d}`).join('\n')}`
          : `\n\nCONTENU VISUEL DU DOCUMENT (${validDescs.length} image(s)/schéma(s) détecté(s)) :\n${validDescs.map((d, i) => `[Image ${i + 1}] : ${d}`).join('\n')}`
      }
    }

    const imageCount = imageUrls.filter(Boolean).length

    // Appel Groq avec timeout 60s (plus long car images possibles)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    let rawJson = ''
    try {
      const response = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(lang, imageCount) },
          { role: 'user', content: `Cours :${visualContext}\n\n${rawContent.slice(0, 8000)}` },
        ],
      })
      rawJson = response.choices[0]?.message?.content ?? ''
    } catch (err: unknown) {
      clearTimeout(timeout)
      const status = (err as { status?: number })?.status
      if (status === 429) {
        await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
        return NextResponse.json({
          error: 'Limite de génération atteinte pour aujourd\'hui. Réessaie dans quelques heures.',
          retry_after: 3600,
        }, { status: 429 })
      }
      if ((err as Error)?.name === 'AbortError') {
        await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
        return NextResponse.json({ error: 'Génération trop longue, réessaie avec un cours plus court' }, { status: 408 })
      }
      throw err
    }
    clearTimeout(timeout)

    // Extraction JSON robuste — gère le texte avant/après et les blocs markdown
    const jsonStart = rawJson.indexOf('{')
    const jsonEnd = rawJson.lastIndexOf('}')
    const cleaned = (jsonStart !== -1 && jsonEnd !== -1)
      ? rawJson.slice(jsonStart, jsonEnd + 1)
      : rawJson.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
      return NextResponse.json({ error: 'Réponse IA invalide, réessaie' }, { status: 500 })
    }

    // Validation stricte de la structure
    const validation = validateGenerated(parsed, imageCount)
    if (!validation.ok) {
      await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
      return NextResponse.json({ error: `Validation IA: ${validation.error}` }, { status: 500 })
    }

    const generated = validation.data

    // Insertion fiches (avec image_url si l'IA a assigné une image)
    const ficheInserts = generated.fiches.map(f => ({
      cours_id: coursId,
      user_id: user.id,
      title: f.title,
      content: f.content,
      key_concepts: f.content.key_concepts.map(kc => kc.term),
      difficulty: f.difficulty,
      image_url: (f.image_index != null && imageUrls[f.image_index - 1])
        ? imageUrls[f.image_index - 1]
        : null,
    }))

    const { data: insertedFiches, error: ficheError } = await supabase.from('fiches').insert(ficheInserts).select()
    if (ficheError) throw new Error(`DB fiches: ${ficheError.message} (code: ${ficheError.code})`)

    // Map titre → id pour les questions
    const ficheMap = new Map(insertedFiches?.map(f => [f.title, f.id]) ?? [])

    const questionInserts = generated.questions.map(q => ({
      cours_id: coursId,
      fiche_id: ficheMap.get(q.fiche_title) ?? null,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
    }))

    await supabase.from('questions').insert(questionInserts)

    await supabase.from('cours').update({ status: 'ready', prep_score: 0 }).eq('id', coursId)
    await supabase.from('profiles').update({ uploads_count: (profile?.uploads_count ?? 0) + 1 }).eq('id', user.id)

    // Award XP — non bloquant (ne doit pas faire échouer la génération)
    try {
      await supabase.rpc('award_xp', { p_user_id: user.id, p_amount: 25, p_reason: 'upload_cours' })
    } catch { /* XP optionnel */ }

    return NextResponse.json({ success: true, fiches_count: ficheInserts.length })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Generate error:', msg, err)
    if (coursId) { try { await supabase.from('cours').update({ status: 'error' }).eq('id', coursId) } catch {} }
    return NextResponse.json({ error: `Erreur: ${msg}` }, { status: 500 })
  }
}
