import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewView from './ReviewView'

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Fiches dues aujourd'hui, en retard, OU jamais révisées (next_review = null)
  const { data: fiches } = await supabase
    .from('fiches')
    .select('*, cours:cours_id(title, subject)')
    .eq('user_id', user.id)
    .eq('memorized', false)
    .or(`next_review.lte.${today},next_review.is.null`)
    .order('next_review', { ascending: true, nullsFirst: false })
    .limit(20)

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_goal, daily_reviewed, xp, level, streak_days')
    .eq('id', user.id)
    .single()

  return <ReviewView fiches={fiches ?? []} profile={profile} userId={user.id} />
}
