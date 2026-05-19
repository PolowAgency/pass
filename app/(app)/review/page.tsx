import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewView from './ReviewView'

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fiches dues aujourd'hui ou en retard
  const { data: fiches } = await supabase
    .from('fiches')
    .select('*, cours:cours_id(title, subject)')
    .eq('user_id', user.id)
    .lte('next_review', new Date().toISOString().split('T')[0])
    .eq('memorized', false)
    .order('next_review', { ascending: true })
    .limit(20)

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_goal, daily_reviewed, xp, level, streak_days')
    .eq('id', user.id)
    .single()

  return <ReviewView fiches={fiches ?? []} profile={profile} userId={user.id} />
}
