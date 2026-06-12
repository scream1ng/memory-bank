'use server'

import { db } from '@/lib/db'
import { memo_blocks, projects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { refreshContext } from '@/lib/context'

async function verifyBlockOwnership(blockId: string, userId: string): Promise<string | null> {
  const [block] = await db.select({ project_id: memo_blocks.project_id }).from(memo_blocks).where(eq(memo_blocks.id, blockId)).limit(1)
  if (!block) return null
  const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, block.project_id), eq(projects.owner_id, userId))).limit(1)
  return project ? block.project_id : null
}

export async function createBlock(projectId: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.owner_id, session.userId))).limit(1)
  if (!project) return { error: 'Forbidden' }

  const [last] = await db.select({ position: memo_blocks.position }).from(memo_blocks).where(eq(memo_blocks.project_id, projectId)).orderBy(desc(memo_blocks.position)).limit(1)
  const position = last ? last.position + 1 : 0

  await db.insert(memo_blocks).values({ project_id: projectId, author_id: session.userId, position, type: 'text', content: '' })
  await refreshContext(projectId)
  revalidatePath('/')
}

export async function updateBlock(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const content = (formData.get('content') as string) ?? ''
  const projectId = await verifyBlockOwnership(id, session.userId)
  if (!projectId) return { error: 'Forbidden' }

  await db.update(memo_blocks).set({ content }).where(eq(memo_blocks.id, id))
  await refreshContext(projectId)
  revalidatePath('/')
}

export async function deleteBlock(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const projectId = await verifyBlockOwnership(id, session.userId)
  if (!projectId) return { error: 'Forbidden' }

  await db.delete(memo_blocks).where(eq(memo_blocks.id, id))
  await refreshContext(projectId)
  revalidatePath('/')
}
