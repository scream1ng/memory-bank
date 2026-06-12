'use server'
import { db } from '@/lib/db'
import { ai_connections, context_files, projects } from '@/lib/schema'
import { getSession } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function saveApiKey(key: string) {
  const session = await getSession()
  if (!session) redirect('/login')
  const trimmed = key.trim()
  if (!trimmed) return { error: 'API key required' }
  await db.insert(ai_connections)
    .values({ user_id: session.userId, api_key: trimmed }) // TODO: encrypt
    .onConflictDoUpdate({ target: ai_connections.user_id, set: { api_key: trimmed } })
  return { ok: true }
}

export async function deleteApiKey() {
  const session = await getSession()
  if (!session) redirect('/login')
  await db.delete(ai_connections).where(eq(ai_connections.user_id, session.userId))
  return { ok: true }
}

export async function getApiKeyStatus() {
  const session = await getSession()
  if (!session) return { hasKey: false }
  const [row] = await db.select({ id: ai_connections.id })
    .from(ai_connections)
    .where(eq(ai_connections.user_id, session.userId))
    .limit(1)
  return { hasKey: !!row }
}

export async function getContextFile(projectId: string) {
  const session = await getSession()
  if (!session) return { content: null }
  const [project] = await db.select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.owner_id, session.userId)))
    .limit(1)
  if (!project) return { content: null }
  const [row] = await db.select({ content: context_files.content })
    .from(context_files)
    .where(eq(context_files.project_id, projectId))
    .limit(1)
  return { content: row?.content ?? null }
}
