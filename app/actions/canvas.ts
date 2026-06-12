'use server'

import { db } from '@/lib/db'
import { memo_blocks, projects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { refreshContext } from '@/lib/context'

async function nextPosition(projectId: string) {
  const [last] = await db.select({ position: memo_blocks.position }).from(memo_blocks).where(eq(memo_blocks.project_id, projectId)).orderBy(desc(memo_blocks.position)).limit(1)
  return last ? last.position + 1 : 0
}

export async function sendMessage(content: string, projectId: string | null, subjectId: string | null = null) {
  const session = await getSession()
  if (!session) redirect('/login')

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Empty message' }

  let pid = projectId

  if (!pid) {
    const name = trimmed.split('\n')[0].slice(0, 60) || new Date().toLocaleDateString()
    const [row] = await db.insert(projects).values({ name, owner_id: session.userId, subject_id: subjectId }).returning({ id: projects.id })
    pid = row.id
  }

  const position = await nextPosition(pid!)
  await db.insert(memo_blocks).values({ project_id: pid!, author_id: session.userId, position, type: 'text', content: trimmed })
  await refreshContext(pid!)

  revalidatePath('/')
  return { projectId: pid! }
}

export async function createProjectSilent(name: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }

  const [row] = await db.insert(projects).values({ name, owner_id: session.userId }).returning({ id: projects.id })
  revalidatePath('/')
  return { id: row.id }
}

export async function createPhotoBlock(projectId: string, storagePath: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const position = await nextPosition(projectId)
  await db.insert(memo_blocks).values({ project_id: projectId, author_id: session.userId, position, type: 'photo', content: storagePath })
  await refreshContext(projectId)

  revalidatePath('/')
  return { ok: true }
}
