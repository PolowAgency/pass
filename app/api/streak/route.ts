import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    await supabase.rpc('update_streak', { p_user_id: user.id })
    const { data } = await supabase.from('profiles').select('streak_days, last_active').eq('id', user.id).single()

    return NextResponse.json({ streak_days: data?.streak_days })
  } catch (err) {
    console.error('Streak error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
