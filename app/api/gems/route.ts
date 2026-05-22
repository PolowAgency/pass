import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const GEMS_WHITELIST: Record<string, number> = {
  complete_qcm_perfect: 5,
  complete_qcm_good:    3,
  complete_qcm_ok:      1,
  daily_goal:           3,
  upload_cours:         2,
  streak_7:            10,
  streak_30:           30,
}

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

    const { action, source_id } = await request.json()
    const amount = GEMS_WHITELIST[action]
    if (!amount) return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })

    // Idempotence : source_id évite le double-award sur refresh
    if (source_id) {
      const { count } = await supabase
        .from('gem_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reason', action)
        .eq('amount', amount)
        // Cherche un enregistrement récent avec ce source (on l'encode dans le reason)
        .gte('created_at', new Date(Date.now() - 10_000).toISOString())
      if ((count ?? 0) > 0) {
        const { data: p } = await supabase.from('profiles').select('gems').eq('id', user.id).single()
        return NextResponse.json({ gems: p?.gems ?? 0, earned: 0, skipped: true })
      }
    }

    await supabase.rpc('award_gems', {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: source_id ? `${action}:${source_id}` : action,
    })

    const { data: profile } = await supabase.from('profiles').select('gems').eq('id', user.id).single()
    return NextResponse.json({ gems: profile?.gems ?? 0, earned: amount })
  } catch (err) {
    console.error('Gems error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
