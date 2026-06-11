'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSubject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  const { error } = await supabase.from('subjects').insert({ name, owner_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function renameSubject(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  const { error } = await supabase.from('subjects').update({ name }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function deleteSubject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  redirect('/')
}
