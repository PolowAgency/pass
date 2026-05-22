import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BadgesView from './BadgesView'

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: earned } = await supabase
    .from('badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', user.id)

  return <BadgesView earnedBadges={earned ?? []} />
}
