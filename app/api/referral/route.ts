import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}

// GET — récupère le code de parrainage + stats
export async function GET() {
  const supabase = getSupabase(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('referral_code, referral_count, referred_by')
    .eq('id', user.id).single()

  return NextResponse.json({
    code: data?.referral_code ?? null,
    count: data?.referral_count ?? 0,
    has_been_referred: !!data?.referred_by,
  })
}

// POST — utilise un code de parrainage
export async function POST(request: NextRequest) {
  const supabase = getSupabase(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { code } = await request.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Code manquant' }, { status: 400 })

  const { data } = await supabase.rpc('claim_referral', { p_user_id: user.id, p_code: code.trim() })
  const result = data?.[0] as { success: boolean; reason: string } | undefined

  if (!result?.success) {
    const msgs: Record<string, string> = {
      already_referred: 'Tu as déjà utilisé un code de parrainage.',
      invalid_code: 'Code invalide ou expiré.',
    }
    return NextResponse.json({ success: false, message: msgs[result?.reason ?? ''] ?? 'Erreur.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, gems_earned: 30 })
}
