import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY! }) }

function buildSystemPrompt(lang: 'fr' | 'en') {
  const langBlock = lang === 'en'
    ? `LANGUAGE:
- Generate ALL fiches and questions in ENGLISH, regardless of the source language
- If the course is in French, translate and rephrase in English
- Keep technical terms in their original language if necessary (Latin anatomical terms, etc.) but explain in English`
    : `LANGUE :
- Génère TOUJOURS les fiches et les questions en français, quelle que soit la langue du cours source
- Si le cours est en anglais, traduis et reformule en français
- Conserve les termes techniques dans leur langue d'origine si nécessaire (ex: termes anatomiques latins, anglicismes médicaux courants), mais explique en français`

  return `Tu es un expert en pédagogie médicale et universitaire. Tu reçois le contenu brut d'un cours.
Tu génères des fiches de révision et un QCM d'entraînement à l'examen.

${langBlock}

RÈGLES GÉNÉRALES :
- Entre 8 et 15 fiches selon la densité du cours (plus si contenu médical/scientifique dense)
- Chaque fiche couvre UN concept précis, testable à l'examen
- 3 questions QCM par fiche (priorité absolue : préparer à l'examen)
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires

RÈGLES POUR LES QCM (très important) :
- Questions formulées comme dans les vrais examens : directes, précises, sans ambiguïté
- 4 options (A, B, C, D) plausibles — les distracteurs doivent être crédibles
- Pour les cours médicaux/scientifiques : inclure des questions sur les chiffres, doses, pourcentages, noms précis
- Exemples de formulations : "Quelle est la dose de...", "Quel nerf innerve...", "Parmi les propositions suivantes, laquelle est FAUSSE...", "Le traitement de première intention est..."
- L'explication doit être courte et retenir ce qu'il faut pour ne plus se tromper

RÈGLES POUR LES FICHES :
- summary : 2-3 phrases, les faits clés à retenir pour l'examen
- key_concepts : termes à connaître par cœur (noms, définitions, valeurs numériques)
- important_points : points susceptibles d'être testés en QCM
- memory_trick : moyen mnémotechnique original et efficace

FORMAT JSON EXACT :
{
  "fiches": [{
    "title": "string",
    "content": {
      "summary": "string (2-3 phrases)",
      "key_concepts": [{"term": "string", "definition": "string", "example": "string"}],
      "important_points": ["string", "string", "string"],
      "memory_trick": "string"
    },
    "difficulty": "easy"
  }],
  "questions": [{
    "fiche_title": "string",
    "question": "string",
    "options": ["option A", "option B", "option C", "option D"],
    "correct_answer": 0,
    "explanation": "string (court, factuel, ce qu'il faut retenir)"
  }]
}`
}

// Validation stricte de la structure générée
function validateGenerated(data: unknown): { ok: true; data: GeneratedData } | { ok: false; error: string } {
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
    if (!['easy', 'medium', 'hard'].includes(f.difficulty as string)) f.difficulty = 'medium'
  }

  for (let i = 0; i < d.questions.length; i++) {
    const q = d.questions[i] as Record<string, unknown>
    if (!q.question || typeof q.question !== 'string') return { ok: false, error: `Question ${i}: texte manquant` }
    if (!Array.isArray(q.options) || q.options.length !== 4) return { ok: false, error: `Question ${i}: doit avoir exactement 4 options` }
    const ca = Number(q.correct_answer)
    if (isNaN(ca) || ca < 0 || ca > 3) return { ok: false, error: `Question ${i}: correct_answer invalide (doit être 0-3)` }
    q.correct_answer = ca
  }

  return { ok: true, data: d as unknown as GeneratedData }
}

interface FicheContent {
  summary: string
  key_concepts: { term: string; definition: string; example?: string }[]
  important_points: string[]
  memory_trick: string
}

interface GeneratedFiche {
  title: string
  content: FicheContent
  difficulty: string
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

async function extractText(file: File): Promise<{ text: string; error?: string }> {
  if (file.size > 20 * 1024 * 1024) return { text: '', error: 'Fichier trop lourd (max 20 Mo)' }

  if (file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>
      const data = await pdfParse(buffer)
      const text = data.text?.trim() ?? ''
      if (text.length < 50) return { text: '', error: 'PDF vide ou non lisible (PDF scanné ?)' }
      return { text }
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
      return { text }
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
    if (profile?.plan === 'free' && (profile?.uploads_count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Limite atteinte. Passe à Premium !' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    coursId = formData.get('cours_id') as string
    const lang = (formData.get('lang') as string) === 'en' ? 'en' : 'fr'

    if (!file || !coursId) return NextResponse.json({ error: 'Fichier ou cours manquant' }, { status: 400 })

    // Vérification ownership : ce cours appartient bien à l'utilisateur
    const { data: cours } = await supabase.from('cours').select('id, user_id').eq('id', coursId).single()
    if (!cours || cours.user_id !== user.id) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    }

    // Extraction texte avec gestion d'erreur par type
    const { text: rawContent, error: extractError } = await extractText(file)
    if (extractError || !rawContent) {
      await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
      return NextResponse.json({ error: extractError ?? 'Impossible de lire le fichier' }, { status: 400 })
    }

    await supabase.from('cours').update({ raw_content: rawContent.slice(0, 50000) }).eq('id', coursId)

    // Appel Claude avec timeout 45s
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    let rawJson = ''
    try {
      const response = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 8000,
        response_format: { type: 'json_object' }, // force JSON valide
        messages: [
          { role: 'system', content: buildSystemPrompt(lang) },
          { role: 'user', content: `Voici le contenu du cours :\n\n${rawContent.slice(0, 40000)}` },
        ],
      })
      rawJson = response.choices[0]?.message?.content ?? ''
    } catch (err: unknown) {
      clearTimeout(timeout)
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
    const validation = validateGenerated(parsed)
    if (!validation.ok) {
      await supabase.from('cours').update({ status: 'error' }).eq('id', coursId)
      return NextResponse.json({ error: `Validation IA: ${validation.error}` }, { status: 500 })
    }

    const generated = validation.data

    // Insertion fiches
    const ficheInserts = generated.fiches.map(f => ({
      cours_id: coursId,
      user_id: user.id,
      title: f.title,
      content: f.content,
      key_concepts: f.content.key_concepts.map(kc => kc.term),
      difficulty: f.difficulty,
    }))

    const { data: insertedFiches, error: ficheError } = await supabase.from('fiches').insert(ficheInserts).select()
    if (ficheError) throw ficheError

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
    console.error('Generate error:', err)
    if (coursId) { try { await supabase.from('cours').update({ status: 'error' }).eq('id', coursId) } catch {} }
    return NextResponse.json({ error: 'Erreur serveur, réessaie dans quelques instants' }, { status: 500 })
  }
}
