import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { Profile } from '@/types'
import StreakUpdater from '@/components/StreakUpdater'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, xp, level, streak_days, streak_freeze_count, hearts, max_hearts, gems, weekly_xp, uploads_count, daily_goal, daily_reviewed, daily_reset_at, onboarding_completed, coach_messages_today, coach_messages_reset_at, email_notifications, daily_reminder_time, notification_streak_alert, last_active, stripe_customer_id, last_heart_refill_at, max_streak_days, created_at')
    .eq('id', user.id).single()

  // Redirect to onboarding if not completed
  // /onboarding is outside (app) so no loop
  // Redirect uniquement si explicitement false (pas null — les anciens comptes ont null)
  if (profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar profile={profile as Profile} />
        <StreakUpdater />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }} className="lg:ml-60">
          <TopBar profile={profile as Profile} />
          <main style={{ flex: 1, paddingBottom: 'max(80px, calc(70px + env(safe-area-inset-bottom)))' }} className="lg:!pb-0">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
