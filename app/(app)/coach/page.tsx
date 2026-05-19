import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CoachView from './CoachView'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: history } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, streak_days')
    .eq('id', user.id)
    .single()

  return <CoachView initialHistory={history ?? []} profile={profile} />
}
