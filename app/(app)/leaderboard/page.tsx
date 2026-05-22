import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeaderboardView from './LeaderboardView'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase.rpc('get_weekly_leaderboard', { p_user_id: user.id })

  return <LeaderboardView rows={rows ?? []} />
}
