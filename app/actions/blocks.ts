'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBlock(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('memo_blocks')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)

  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { error } = await supabase
    .from('memo_blocks')
    .insert({ project_id: projectId, author_id: user.id, position, type: 'text', content: '' })

  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function updateBlock(id: string, formData: FormData) {
  const supabase = await createClient()
  const content = (formData.get('content') as string) ?? ''

  const { error } = await supabase
    .from('memo_blocks')
    .update({ content })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function deleteBlock(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('memo_blocks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/')
}
