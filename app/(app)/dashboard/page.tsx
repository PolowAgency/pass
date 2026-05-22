import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardView from './DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: profile },
    { data: cours },
    { data: sessions },
    { count: dueCount },
    { data: weakFiches },
    { data: priorityCours },
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, plan, xp, level, streak_days, hearts, max_hearts, gems, weekly_xp, uploads_count, daily_goal, daily_reviewed, daily_reset_at, onboarding_completed, last_active, stripe_customer_id, coach_messages_today, coach_messages_reset_at, email_notifications, daily_reminder_time, notification_streak_alert, last_heart_refill_at, max_streak_days, created_at').eq('id', user.id).single(),
    supabase.from('cours').select('id, title, subject, status, prep_score, exam_date, created_at, fiches(id, memorized)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('qcm_sessions').select('score, total_questions, completed_at, cours_id').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(10),
    // Fiches dues aujourd'hui
    supabase.from('fiches').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('memorized', false).lte('next_review', today),
    // Fiches les plus difficiles (review_count élevé, pas mémorisées)
    supabase.from('fiches').select('title, review_count, cours_id').eq('user_id', user.id).eq('memorized', false).order('review_count', { ascending: false }).limit(3),
    // Cours avec le score le plus faible (priorité révision)
    supabase.from('cours').select('id, title, subject, prep_score').eq('user_id', user.id).eq('status', 'ready').order('prep_score', { ascending: true }).limit(1),
  ])

  return (
    <DashboardView
      profile={profile}
      cours={cours ?? []}
      sessions={sessions ?? []}
      dueCount={dueCount ?? 0}
      weakFiches={weakFiches ?? []}
      priorityCours={priorityCours?.[0] ?? null}
    />
  )
}
