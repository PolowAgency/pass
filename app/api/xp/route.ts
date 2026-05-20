import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getLevel } from '@/lib/xp'

// Whitelist : le client envoie UNIQUEMENT l'action, le serveur calcule le montant
const XP_WHITELIST: Record<string, number> = {
  memorize_fiche:        15,
  complete_qcm_perfect:  50,
  complete_qcm_good:     30,
  complete_qcm_ok:       15,
  complete_qcm_bad:       5,
  upload_cours:          25,
  daily_reward:          50, // montant max — le vrai montant est géré côté client (coffre aléatoire)
}

// Anti-abus : même action → pas plus de 1 fois toutes les 5 secondes
const COOLDOWN_MS = 5_000

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

    const body = await request.json()
    const action: string = body.action ?? body.reason
    const sourceId: string | undefined = body.source_id

    // Vérification action valide
    const amount = XP_WHITELIST[action]
    if (!amount) {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }

    // Anti-abus : vérifie si même action dans les 5 dernières secondes
    const cooldownSince = new Date(Date.now() - COOLDOWN_MS).toISOString()
    const { data: recent } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('reason', action)
      .gte('created_at', cooldownSince)
      .limit(1)

    // Upload et QCM peuvent être répétés (cooldown seulement sur memorize_fiche)
    if (action === 'memorize_fiche' && recent && recent.length > 0) {
      // Retourne le profil actuel sans ajouter de XP
      const { data: current } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single()
      return NextResponse.json({ xp: current?.xp, level: current?.level, leveledUp: false, skipped: true })
    }

    const { data: before } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
    const oldLevel = getLevel(before?.xp ?? 0)

    // source_type déduit de l'action pour contrainte unique
    const sourceType = action === 'memorize_fiche' ? 'fiche'
      : action.startsWith('complete_qcm') ? 'qcm'
      : action === 'upload_cours' ? 'cours'
      : undefined

    const { data: rpcResult } = await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: action,
      p_source_type: sourceType ?? null,
      p_source_id: sourceId ?? null,
    })

    const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
    const newLevel = row?.level ?? getLevel((before?.xp ?? 0) + amount)
    const newXp = row?.xp ?? (before?.xp ?? 0) + amount

    return NextResponse.json({
      xp: newXp,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
      oldLevel,
      earned: amount,
    })
  } catch (err) {
    console.error('XP error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
