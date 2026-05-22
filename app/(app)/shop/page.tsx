import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopView from './ShopView'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gems, hearts, max_hearts, streak_freeze_count, plan')
    .eq('id', user.id)
    .single()

  return (
    <ShopView
      gems={profile?.gems ?? 0}
      hearts={profile?.hearts ?? 5}
      maxHearts={profile?.max_hearts ?? 5}
      freezes={profile?.streak_freeze_count ?? 0}
      plan={profile?.plan ?? 'free'}
    />
  )
}
