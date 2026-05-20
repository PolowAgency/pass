import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY! }) }

const TUTOR_FREE_LIMIT = 10

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { question, cours_id } = await request.json()
    if (!question?.trim()) return NextResponse.json({ error: 'Question vide' }, { status: 400 })
    if (!cours_id) return NextResponse.json({ error: 'cours_id manquant' }, { status: 400 })

    // Rate limit plan gratuit
    const { data: profile } = await supabase.from('profiles').select('plan, coach_messages_today, coach_messages_reset_at').eq('id', user.id).single()
    if (profile?.plan === 'free') {
      const today = new Date().toISOString().split('T')[0]
      const todayCount = profile.coach_messages_reset_at === today ? (profile.coach_messages_today ?? 0) : 0
      if (todayCount >= TUTOR_FREE_LIMIT) {
        return NextResponse.json({ error: 'limit_reached', message: `Limite de ${TUTOR_FREE_LIMIT} questions/jour atteinte. Passe à Premium pour poser des questions sans limite.` }, { status: 429 })
      }
      await supabase.from('profiles').update({ coach_messages_today: todayCount + 1, coach_messages_reset_at: today }).eq('id', user.id)
    }

    // Vérif ownership
    const { data: cours } = await supabase
      .from('cours').select('title, subject, user_id')
      .eq('id', cours_id).single()
    if (!cours || cours.user_id !== user.id)
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })

    // Charger les fiches du cours en contexte
    const { data: fiches } = await supabase
      .from('fiches')
      .select('title, content')
      .eq('cours_id', cours_id)
      .limit(20)

    const fichesContext = (fiches ?? []).map(f => {
      const c = f.content as { summary?: string; key_concepts?: { term: string; definition: string }[]; important_points?: string[] }
      return `### ${f.title}\n${c.summary ?? ''}\n${(c.key_concepts ?? []).map(k => `- ${k.term}: ${k.definition}`).join('\n')}\n${(c.important_points ?? []).join('\n')}`
    }).join('\n\n')

    const system = `Tu es un tuteur expert en "${cours.subject ?? cours.title}", adapté au niveau universitaire ou lycéen selon le cours.
Tu aides un étudiant à comprendre son cours, du BAC aux études supérieures.

RÈGLES :
- Réponds en français, clairement et précisément
- Max 4-5 phrases, aller droit au but
- Si la réponse est dans les fiches du cours, appuie-toi dessus
- Donne des exemples concrets adaptés au niveau et à la matière
- Tutoie l'étudiant
- Adapte la profondeur de réponse au niveau : définition simple pour lycée, analyse poussée pour supérieur

CONTENU DU COURS "${cours.title}" :
${fichesContext || 'Fiches non disponibles — réponds sur la base de tes connaissances générales.'}`

    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question },
      ],
    })

    const reply = response.choices[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Tutor error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
