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
    .from('profiles').select('*').eq('id', user.id).single()

  // Redirect to onboarding if not completed
  // /onboarding is outside (app) so no loop
  if (profile && !profile.onboarding_completed) {
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
