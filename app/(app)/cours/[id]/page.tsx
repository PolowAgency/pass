import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Cours, Fiche } from '@/types'
import CoursView from './CoursView'

export default async function CoursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cours } = await supabase
    .from('cours')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!cours) notFound()

  const { data: fiches } = await supabase
    .from('fiches')
    .select('*')
    .eq('cours_id', id)
    .order('created_at', { ascending: true })

  const { data: sessions } = await supabase
    .from('qcm_sessions')
    .select('score, total_questions, completed_at')
    .eq('cours_id', id)
    .order('completed_at', { ascending: false })
    .limit(5)

  return (
    <CoursView
      cours={cours as Cours}
      fiches={(fiches ?? []) as Fiche[]}
      sessions={sessions ?? []}
    />
  )
}
