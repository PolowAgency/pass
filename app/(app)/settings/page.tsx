import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsView from './SettingsView'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id, email, full_name, plan, xp, level, streak_days, uploads_count, daily_goal, daily_reviewed, daily_reset_at, onboarding_completed, coach_messages_today, coach_messages_reset_at, email_notifications, daily_reminder_time, notification_streak_alert, stripe_customer_id, hearts, max_hearts, gems, weekly_xp, last_active, last_heart_refill_at, max_streak_days, created_at').eq('id', user.id).single()
  const params = await searchParams
  return <SettingsView profile={profile} success={params.success === 'true'} />
}
