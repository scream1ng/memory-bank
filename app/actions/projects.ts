'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, owner_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/')
  redirect(`/?p=${data.id}`)
}

export async function renameProject(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  const { error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/')
  redirect('/')
}

export async function pinProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ pinned_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function unpinProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ pinned_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function assignChatToSubject(chatId: string, subjectId: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ subject_id: subjectId })
    .eq('id', chatId)
  if (error) return { error: error.message }
  revalidatePath('/')
}
