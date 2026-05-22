import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY! }) }

const SYSTEM = `Tu es le Coach IA de PASS — à la fois coach de motivation ET tuteur pédagogique.

TON : Direct, sans bullshit, parfois provocateur mais jamais méchant. Toujours tutoyer.

MODE TUTEUR (si des fiches de cours sont fournies dans le contexte) :
- L'étudiant pose une question sur un concept → explique-le clairement, avec des exemples concrets
- Structure tes explications : définition simple → mécanisme → exemple → piège d'exam
- Utilise le contenu exact des fiches (résumé, concepts, points clés) pour répondre avec précision
- Si plusieurs fiches sont pertinentes, fais les liens entre elles
- Termine par une question de vérification ou un conseil d'exam précis

MODE COACH (questions de motivation/organisation) :
- Format : max 3 phrases + UNE action concrète ("Fais le QCM maintenant.", "Révise 3 fiches ce soir.")
- Streak faible → rappelle-le avec humour mais clairement
- Scores QCM mauvais → nomme le sujet précis à retravailler
- Étudiant stressé → valide en 1 phrase, puis recentre sur l'actionnable

CONTEXTE EXAMEN :
- Si exam_date < 21 jours → mode prépa intensive
- Si exam_date < 7 jours → mode urgence totale
- Adapte à la filière : médecine, droit, prépas, licence, ingénieur — les méthodes varient

INTERDIT : réponses vagues, "c'est bien", "continue comme ça".`

const FREE_LIMIT = 5

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

    const { message } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

    // Check free plan limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, streak_days, xp, level, plan, daily_goal, daily_reviewed, coach_messages_today, coach_messages_reset_at')
      .eq('id', user.id).single()

    if (profile?.plan === 'free') {
      const today = new Date().toISOString().split('T')[0]
      const resetDate = profile.coach_messages_reset_at
      const todayCount = resetDate === today ? (profile.coach_messages_today ?? 0) : 0

      if (todayCount >= FREE_LIMIT) {
        return NextResponse.json({ error: 'limit_reached', message: `Tu as atteint la limite de ${FREE_LIMIT} messages/jour sur le plan gratuit. Passe à Premium pour discuter sans limite.` }, { status: 429 })
      }

      // Increment counter
      await supabase.from('profiles').update({
        coach_messages_today: todayCount + 1,
        coach_messages_reset_at: today,
      }).eq('id', user.id)
    }

    // Fetch rich context: memorized vs not memorized fiches, recent QCM scores + fiche search
    const searchTerms = message
      .replace(/[?!.,;:]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5)

    const orFilter = searchTerms.length > 0
      ? searchTerms.map(t => `title.ilike.%${t}%`).join(',')
      : null

    const [{ data: cours }, { data: fichesMem }, { data: fichesNotMem }, { data: sessions }, { data: matchingFiches }] = await Promise.all([
      supabase.from('cours').select('title, subject, exam_date, prep_score').eq('user_id', user.id).order('exam_date', { ascending: true }).limit(5),
      supabase.from('fiches').select('title').eq('user_id', user.id).eq('memorized', true).limit(5),
      supabase.from('fiches').select('title').eq('user_id', user.id).eq('memorized', false).order('review_count', { ascending: false }).limit(5),
      supabase.from('qcm_sessions').select('score, total_questions').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(3),
      orFilter
        ? supabase.from('fiches').select('title, content, cours:cours_id(title, subject)').eq('user_id', user.id).or(orFilter).limit(3)
        : Promise.resolve({ data: [] }),
    ])

    const memorizedCount = fichesMem?.length ?? 0
    const weakFiches = fichesNotMem?.slice(0, 5).map(f => f.title).join(', ') || 'aucune identifiée'
    const recentScores = sessions?.map(s => `${Math.round((s.score / (s.total_questions || 1)) * 100)}%`).join(', ') || 'aucun'

    // Build fiche content block if relevant fiches found
    type FicheRow = { title: string; content: Record<string, unknown>; cours?: { title: string; subject: string } | null }
    const fichesFound = (matchingFiches ?? []) as FicheRow[]
    let ficheContentBlock = ''
    if (fichesFound.length > 0) {
      ficheContentBlock = '\n\n--- FICHES DE COURS PERTINENTES (utilise-les pour expliquer) ---\n'
      ficheContentBlock += fichesFound.map(f => {
        const c = f.content as {
          summary?: string
          key_concepts?: { term: string; definition: string; example?: string }[]
          important_points?: string[]
          exam_traps?: string[]
          key_numbers?: string[]
          memory_trick?: string
        }
        const cours = (f.cours as { title?: string } | null)?.title ?? ''
        const concepts = (c.key_concepts ?? []).map(k => `  • ${k.term} : ${k.definition}${k.example ? ` (ex: ${k.example})` : ''}`).join('\n')
        const points = (c.important_points ?? []).map(p => `  • ${p}`).join('\n')
        const traps = (c.exam_traps ?? []).map(t => `  ⚠️ ${t}`).join('\n')
        return [
          `📚 ${f.title}${cours ? ` (${cours})` : ''}`,
          `Résumé : ${c.summary ?? ''}`,
          concepts ? `Concepts :\n${concepts}` : '',
          points ? `Points clés :\n${points}` : '',
          traps ? `Pièges d'exam :\n${traps}` : '',
          c.memory_trick ? `Mnémotechnique : ${c.memory_trick}` : '',
        ].filter(Boolean).join('\n')
      }).join('\n\n')
      ficheContentBlock += '\n---'
    }

    const contextBlock = `
DONNÉES RÉELLES DE L'ÉTUDIANT :
- Prénom : ${profile?.full_name ?? 'inconnu'}
- Streak : ${profile?.streak_days ?? 0} jours consécutifs
- Niveau : ${profile?.level ?? 1} | XP total : ${profile?.xp ?? 0}
- Objectif quotidien : ${profile?.daily_reviewed ?? 0}/${profile?.daily_goal ?? 5} fiches révisées aujourd'hui
- Fiches mémorisées : ${memorizedCount} au total
- Fiches difficiles : ${weakFiches}
- Scores QCM récents : ${recentScores}
- Cours : ${cours?.map(c => `"${c.title}" — prep score ${c.prep_score}/100${c.exam_date ? `, exam le ${c.exam_date}` : ''}`).join(' | ') || 'aucun cours'}${ficheContentBlock}`

    // Save user message
    await supabase.from('coach_messages').insert({ user_id: user.id, role: 'user', content: message })

    // Fetch conversation history
    const { data: history } = await supabase
      .from('coach_messages').select('role, content')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6)

    const messages = (history ?? []).reverse().map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM + '\n\n' + contextBlock },
        ...messages,
      ],
    })

    const reply = response.choices[0]?.message?.content ?? ''
    await supabase.from('coach_messages').insert({ user_id: user.id, role: 'assistant', content: reply })

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
