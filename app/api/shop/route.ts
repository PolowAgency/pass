import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const { item } = await request.json()

    if (item === 'heart_refill') {
      const { data } = await supabase.rpc('refill_heart', { p_user_id: user.id, p_use_gems: true })
      const r = data?.[0] as { hearts_left: number; gems_left: number; success: boolean } | undefined
      if (!r?.success) {
        const reason = r ? 'not_enough_gems' : 'error'
        return NextResponse.json({ success: false, reason }, { status: 400 })
      }
      return NextResponse.json({ success: true, hearts: r.hearts_left, gems: r.gems_left })
    }

    if (item === 'streak_freeze') {
      const { data } = await supabase.rpc('buy_streak_freeze', { p_user_id: user.id })
      const r = data?.[0] as { success: boolean; gems_left: number; freezes: number; reason: string } | undefined
      if (!r?.success) {
        return NextResponse.json({ success: false, reason: r?.reason ?? 'error' }, { status: 400 })
      }
      return NextResponse.json({ success: true, gems: r.gems_left, freezes: r.freezes })
    }

    return NextResponse.json({ error: 'Item inconnu' }, { status: 400 })
  } catch (err) {
    console.error('Shop error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
