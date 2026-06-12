'use server'

import { db } from '@/lib/db'
import { memo_blocks, projects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function verifyBlockOwnership(blockId: string, userId: string) {
  const [block] = await db.select({ project_id: memo_blocks.project_id }).from(memo_blocks).where(eq(memo_blocks.id, blockId)).limit(1)
  if (!block) return false
  const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, block.project_id), eq(projects.owner_id, userId))).limit(1)
  return !!project
}

export async function createBlock(projectId: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [last] = await db.select({ position: memo_blocks.position }).from(memo_blocks).where(eq(memo_blocks.project_id, projectId)).orderBy(desc(memo_blocks.position)).limit(1)
  const position = last ? last.position + 1 : 0

  await db.insert(memo_blocks).values({ project_id: projectId, author_id: session.userId, position, type: 'text', content: '' })
  revalidatePath('/')
}

export async function updateBlock(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const content = (formData.get('content') as string) ?? ''
  const ok = await verifyBlockOwnership(id, session.userId)
  if (!ok) return { error: 'Forbidden' }

  await db.update(memo_blocks).set({ content }).where(eq(memo_blocks.id, id))
  revalidatePath('/')
}

export async function deleteBlock(id: string) {
  const session = await getSession()
  if (!session) redirect('/login')

  const ok = await verifyBlockOwnership(id, session.userId)
  if (!ok) return { error: 'Forbidden' }

  await db.delete(memo_blocks).where(eq(memo_blocks.id, id))
  revalidatePath('/')
}
