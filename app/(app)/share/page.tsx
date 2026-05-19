import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareView from './ShareView'

export default async function SharePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: profile }, { data: cours }, { data: badges }] = await Promise.all([
    supabase.from('profiles').select('full_name, xp, level, streak_days').eq('id', user.id).single(),
    supabase.from('cours').select('prep_score').eq('user_id', user.id).order('prep_score', { ascending: false }).limit(1),
    supabase.from('badges').select('badge_id').eq('user_id', user.id),
  ])

  return (
    <ShareView
      profile={profile}
      bestScore={cours?.[0]?.prep_score ?? 0}
      badgeCount={badges?.length ?? 0}
      date={today}
    />
  )
}
