'use server'

import { db } from '@/lib/db'
import { projects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  const [row] = await db.insert(projects).values({ name, owner_id: session.userId }).returning({ id: projects.id })
  revalidatePath('/')
  redirect(`/?p=${row.id}`)
}

export async function renameProject(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Name required' }

  await db.update(projects).set({ name }).where(and(eq(projects.id, id), eq(projects.owner_id, session.userId)))
  revalidatePath('/')
}

export async function deleteProject(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.owner_id, session.userId)))
  revalidatePath('/')
  redirect('/')
}

export async function pinProject(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await db.update(projects).set({ pinned_at: new Date().toISOString() }).where(and(eq(projects.id, id), eq(projects.owner_id, session.userId)))
  revalidatePath('/')
}

export async function unpinProject(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  await db.update(projects).set({ pinned_at: null }).where(and(eq(projects.id, id), eq(projects.owner_id, session.userId)))
  revalidatePath('/')
}

export async function assignChatToSubject(chatId: string, subjectId: string | null) {
  const session = await getSession()
  if (!session) redirect('/login')

  await db.update(projects).set({ subject_id: subjectId }).where(and(eq(projects.id, chatId), eq(projects.owner_id, session.userId)))
  revalidatePath('/')
}
