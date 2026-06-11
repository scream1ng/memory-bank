'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function nextPosition(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  const { data } = await supabase
    .from('memo_blocks')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
  return data && data.length > 0 ? data[0].position + 1 : 0
}

export async function sendMessage(content: string, projectId: string | null, subjectId: string | null = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Empty message' }

  let pid = projectId

  if (!pid) {
    const name = trimmed.split('\n')[0].slice(0, 60) || new Date().toLocaleDateString()
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, owner_id: user.id, subject_id: subjectId })
      .select('id')
      .single()
    if (error) return { error: error.message }
    pid = data.id
  }

  const position = await nextPosition(supabase, pid!)

  const { error } = await supabase
    .from('memo_blocks')
    .insert({ project_id: pid!, author_id: user.id, position, type: 'text', content: trimmed })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { projectId: pid! }
}

export async function createProjectSilent(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, owner_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/')
  return { id: data.id as string }
}

export async function createPhotoBlock(projectId: string, storagePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const position = await nextPosition(supabase, projectId)

  const { error } = await supabase
    .from('memo_blocks')
    .insert({ project_id: projectId, author_id: user.id, position, type: 'photo', content: storagePath })

  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}
