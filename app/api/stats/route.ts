import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: xpEvents },
      { data: qcmSessions },
      { data: profile },
    ] = await Promise.all([
      supabase.from('xp_events').select('amount, created_at').eq('user_id', user.id).gte('created_at', since90).order('created_at', { ascending: true }),
      supabase.from('qcm_sessions').select('score, total_questions, completed_at').eq('user_id', user.id).order('completed_at', { ascending: true }).limit(30),
      supabase.from('profiles').select('xp, level, streak_days, max_streak_days, uploads_count').eq('id', user.id).single(),
    ])
    const fichesBySubject = null

    // Build heatmap: day → total XP
    const heatmap: Record<string, number> = {}
    for (const ev of xpEvents ?? []) {
      const day = ev.created_at.split('T')[0]
      heatmap[day] = (heatmap[day] ?? 0) + ev.amount
    }

    // QCM scores as percentage
    const scores = (qcmSessions ?? []).map((s: { score: number; total_questions: number; completed_at: string }) => ({
      date: s.completed_at.split('T')[0],
      pct: Math.round((s.score / (s.total_questions || 1)) * 100),
    }))

    return NextResponse.json({ heatmap, fichesBySubject: fichesBySubject ?? [], scores, profile: profile ?? {} })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
