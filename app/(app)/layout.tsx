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

  await supabase.rpc('update_streak', { p_user_id: user.id })

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar profile={profile as Profile} />
        <StreakUpdater />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }} className="lg:ml-60">
          <TopBar profile={profile as Profile} />
          <main style={{ flex: 1 }} className="pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
