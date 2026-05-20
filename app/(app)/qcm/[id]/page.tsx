import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QcmView from './QcmView'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default async function QcmPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const { mode } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cours } = await supabase
    .from('cours')
    .select('id, title, subject, exam_date')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!cours) notFound()

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*, fiche:fiche_id(image_url)')
    .eq('cours_id', id)

  if (!allQuestions || allQuestions.length === 0) redirect(`/cours/${id}`)

  // Aplatir fiche.image_url → fiche_image_url pour simplifier le typage côté client
  const flatQuestions = allQuestions.map(q => {
    const { fiche, ...rest } = q as typeof q & { fiche: { image_url: string | null } | null }
    return { ...rest, fiche_image_url: fiche?.image_url ?? null }
  })

  // Mode "rapide" : 10 questions aléatoires, mode "complet" : toutes
  const questions = mode === 'rapide'
    ? shuffle(flatQuestions).slice(0, Math.min(10, flatQuestions.length))
    : shuffle(flatQuestions)

  return <QcmView cours={cours} questions={questions} userId={user.id} totalAvailable={allQuestions.length} />
}
