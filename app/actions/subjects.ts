'use server'

import { db } from '@/lib/db'
import { subjects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSubject(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  await db.insert(subjects).values({ name, owner_id: session.userId })
  revalidatePath('/')
}

export async function renameSubject(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  await db.update(subjects).set({ name }).where(and(eq(subjects.id, id), eq(subjects.owner_id, session.userId)))
  revalidatePath('/')
}

export async function deleteSubject(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.owner_id, session.userId)))
  revalidatePath('/')
  redirect('/')
}
