import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsView from './SettingsView'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const params = await searchParams
  return <SettingsView profile={profile} success={params.success === 'true'} />
}
