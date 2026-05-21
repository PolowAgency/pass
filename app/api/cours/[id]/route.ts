import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: coursId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verify ownership (RLS also enforces this)
  const { data: cours } = await supabase
    .from('cours')
    .select('id')
    .eq('id', coursId)
    .eq('user_id', user.id)
    .single()
  if (!cours) return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })

  // Collect fiche image paths before deleting (Storage is separate from DB)
  const { data: fiches } = await supabase
    .from('fiches')
    .select('image_url')
    .eq('cours_id', coursId)
    .not('image_url', 'is', null)

  if (fiches && fiches.length > 0) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const marker = `/storage/v1/object/public/fiche-images/`
    const paths = fiches
      .map(f => {
        const url = f.image_url as string
        const idx = url.indexOf(marker)
        return idx >= 0 ? decodeURIComponent(url.substring(idx + marker.length)) : null
      })
      .filter(Boolean) as string[]
    if (paths.length > 0) {
      // Non-blocking — don't fail the delete if storage cleanup fails
      await supabase.storage.from('fiche-images').remove(paths).catch(() => {})
    }
  }

  // Delete course (cascades to fiches, qcm_sessions via FK)
  const { error } = await supabase.from('cours').delete().eq('id', coursId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Decrement uploads_count so freed slot can be reused
  const { data: profile } = await supabase
    .from('profiles')
    .select('uploads_count')
    .eq('id', user.id)
    .single()
  if ((profile?.uploads_count ?? 0) > 0) {
    await supabase
      .from('profiles')
      .update({ uploads_count: (profile!.uploads_count ?? 1) - 1 })
      .eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
