import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const CONDITIONS: Array<{ id: string; check: (s: Stats) => boolean }> = [
  { id: 'streak_1',    check: s => s.streak >= 1 },
  { id: 'streak_3',    check: s => s.streak >= 3 },
  { id: 'streak_7',    check: s => s.streak >= 7 },
  { id: 'streak_30',   check: s => s.streak >= 30 },
  { id: 'streak_100',  check: s => s.streak >= 100 },
  { id: 'fiches_1',    check: s => s.memorized >= 1 },
  { id: 'fiches_10',   check: s => s.memorized >= 10 },
  { id: 'fiches_50',   check: s => s.memorized >= 50 },
  { id: 'fiches_100',  check: s => s.memorized >= 100 },
  { id: 'fiches_500',  check: s => s.memorized >= 500 },
  { id: 'qcm_first',   check: s => s.sessions >= 1 },
  { id: 'qcm_perfect', check: s => s.hasPerfect },
  { id: 'qcm_10',      check: s => s.sessions >= 10 },
  { id: 'qcm_50',      check: s => s.sessions >= 50 },
  { id: 'upload_1',    check: s => s.uploads >= 1 },
  { id: 'upload_5',    check: s => s.uploads >= 5 },
  { id: 'upload_10',   check: s => s.uploads >= 10 },
  { id: 'xp_100',      check: s => s.xp >= 100 },
  { id: 'xp_1000',     check: s => s.xp >= 1000 },
  { id: 'xp_10000',    check: s => s.xp >= 10000 },
  { id: 'level_5',     check: s => s.level >= 5 },
  { id: 'level_10',    check: s => s.level >= 10 },
]

interface Stats {
  streak: number; memorized: number; sessions: number
  hasPerfect: boolean; uploads: number; xp: number; level: number
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const [
      { data: profile },
      { data: fiches },
      { data: sessions },
      { data: existing },
    ] = await Promise.all([
      supabase.from('profiles').select('xp, level, streak_days, uploads_count').eq('id', user.id).single(),
      supabase.from('fiches').select('id').eq('user_id', user.id).eq('memorized', true),
      supabase.from('qcm_sessions').select('score, total_questions').eq('user_id', user.id),
      supabase.from('badges').select('badge_id').eq('user_id', user.id),
    ])

    const owned = new Set((existing ?? []).map((b: { badge_id: string }) => b.badge_id))
    const stats: Stats = {
      streak:    profile?.streak_days ?? 0,
      memorized: fiches?.length ?? 0,
      sessions:  sessions?.length ?? 0,
      hasPerfect: (sessions ?? []).some(s => s.score === s.total_questions && s.total_questions > 0),
      uploads:   profile?.uploads_count ?? 0,
      xp:        profile?.xp ?? 0,
      level:     profile?.level ?? 1,
    }

    const newIds = CONDITIONS
      .filter(c => !owned.has(c.id) && c.check(stats))
      .map(c => c.id)

    if (newIds.length > 0) {
      await supabase.from('badges').insert(newIds.map(id => ({ user_id: user.id, badge_id: id })))
    }

    return NextResponse.json({ newBadges: newIds })
  } catch (err) {
    console.error('Badges error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ badges: [] })
    const { data } = await supabase.from('badges').select('badge_id, awarded_at').eq('user_id', user.id).order('awarded_at', { ascending: false })
    return NextResponse.json({ badges: data ?? [] })
  } catch {
    return NextResponse.json({ badges: [] })
  }
}
