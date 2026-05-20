import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY! }) }

const SYSTEM = `Tu es le Coach de PASS. Tes règles absolues :

TON : Direct, sans bullshit, parfois provocateur mais jamais méchant. Toujours tutoyer.
FORMAT : Max 3 phrases. Pas de liste sauf si explicitement demandé.
ACTION : Chaque réponse finit par UNE action concrète et précise.
  Exemples : "Fais le QCM maintenant.", "Révise 3 fiches ce soir.", "Upload ton cours là."

CONTEXTE EXAMEN :
- Si exam_date existe et < 21 jours → mode prépa intensive
- Si exam_date < 7 jours → mode urgence totale, pas de fioritures
- Adapte tes conseils à la matière et au niveau de l'étudiant : lycéen, prépas, licence, master, médecine, droit, ingénieur — les méthodes de révision varient

COMPORTEMENT :
- Streak faible → rappelle-le avec humour mais clairement
- Scores QCM mauvais → nomme le sujet précis à retravailler
- Étudiant procrastine → "T'as Netflix ouvert là, non ?", "Dans 3 semaines c'est l'exam, go."
- Étudiant stressé → valide en 1 phrase, puis recentre sur ce qui est actionnable
- Félicite rapidement puis donne la prochaine étape

INTERDIT : réponses vagues, "c'est bien", "continue comme ça", explications de cours.`

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

    // Fetch rich context: memorized vs not memorized fiches, recent QCM scores
    const [{ data: cours }, { data: fichesMem }, { data: fichesNotMem }, { data: sessions }] = await Promise.all([
      supabase.from('cours').select('title, subject, exam_date, prep_score').eq('user_id', user.id).order('exam_date', { ascending: true }).limit(8),
      supabase.from('fiches').select('title, cours_id').eq('user_id', user.id).eq('memorized', true).limit(20),
      supabase.from('fiches').select('title, review_count').eq('user_id', user.id).eq('memorized', false).order('review_count', { ascending: false }).limit(10),
      supabase.from('qcm_sessions').select('score, total_questions, completed_at, cours_id').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(5),
    ])

    const memorizedCount = fichesMem?.length ?? 0
    const weakFiches = fichesNotMem?.slice(0, 5).map(f => f.title).join(', ') || 'aucune identifiée'
    const recentScores = sessions?.map(s => `${Math.round((s.score / (s.total_questions || 1)) * 100)}%`).join(', ') || 'aucun'

    const contextBlock = `
DONNÉES RÉELLES DE L'ÉTUDIANT :
- Prénom : ${profile?.full_name ?? 'inconnu'}
- Streak : ${profile?.streak_days ?? 0} jours consécutifs
- Niveau : ${profile?.level ?? 1} | XP total : ${profile?.xp ?? 0}
- Objectif quotidien : ${profile?.daily_reviewed ?? 0}/${profile?.daily_goal ?? 5} fiches révisées aujourd'hui
- Fiches mémorisées : ${memorizedCount} au total
- Fiches difficiles (pas encore mémorisées après révision) : ${weakFiches}
- Scores QCM récents : ${recentScores}
- Cours : ${cours?.map(c => `"${c.title}" — prep score ${c.prep_score}/100${c.exam_date ? `, exam le ${c.exam_date}` : ''}`).join(' | ') || 'aucun cours'}

NOTE : Utilise ces données pour donner des conseils ULTRA-PERSONNALISÉS. Si les scores QCM sont faibles, dis-le. Si certaines fiches reviennent souvent en révision, c'est un point faible à travailler.`

    // Save user message
    await supabase.from('coach_messages').insert({ user_id: user.id, role: 'user', content: message })

    // Fetch conversation history
    const { data: history } = await supabase
      .from('coach_messages').select('role, content')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(12)

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
