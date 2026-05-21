import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const REWARDS = [
  { xp: 25, label: 'Bonus quotidien',  emoji: '⚡', rarity: 'common'    },
  { xp: 50, label: 'Bonne surprise !', emoji: '🎯', rarity: 'rare'      },
  { xp: 75, label: 'Jackpot du jour',  emoji: '🔥', rarity: 'epic'      },
  { xp: 100,label: 'Légendaire !',     emoji: '👑', rarity: 'legendary' },
]
const WEIGHTS = [60, 28, 10, 2]

function pickReward() {
  const rand = Math.random() * 100
  let cumul = 0
  for (let i = 0; i < WEIGHTS.length; i++) {
    cumul += WEIGHTS[i]
    if (rand < cumul) return REWARDS[i]
  }
  return REWARDS[0]
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('last_daily_reward_at').eq('id', user.id).single()
  const todayUTC = new Date().toISOString().split('T')[0]
  const alreadyOpened = profile?.last_daily_reward_at === todayUTC

  const tomorrowUTC = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
  return NextResponse.json({ available: !alreadyOpened, next_available_at: alreadyOpened ? `${tomorrowUTC}T00:00:00Z` : null })
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const todayUTC = new Date().toISOString().split('T')[0]

  // Vérification atomique : on tente le update uniquement si pas encore ouvert aujourd'hui
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('last_daily_reward_at')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })

  if (profile?.last_daily_reward_at === todayUTC) {
    const tomorrowUTC = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    return NextResponse.json({ error: 'already_opened', next_available_at: `${tomorrowUTC}T00:00:00Z` }, { status: 403 })
  }

  const reward = pickReward()

  // Marque comme ouvert + crédite XP atomiquement
  await supabase.from('profiles').update({ last_daily_reward_at: todayUTC }).eq('id', user.id)
  await supabase.rpc('award_xp', {
    p_user_id: user.id,
    p_amount: reward.xp,
    p_reason: 'daily_reward',
    p_source_type: 'chest',
    p_source_id: `chest_${todayUTC}`,
  })

  return NextResponse.json({ reward })
}
