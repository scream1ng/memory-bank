import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ai_connections, context_files, projects } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, messages } = await req.json()
  if (!projectId || !messages?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [project] = await db.select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.owner_id, session.userId)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [conn] = await db.select({ api_key: ai_connections.api_key })
    .from(ai_connections)
    .where(eq(ai_connections.user_id, session.userId))
    .limit(1)
  if (!conn) return NextResponse.json({ error: 'No API key configured' }, { status: 400 })

  const [ctx] = await db.select({ content: context_files.content })
    .from(context_files)
    .where(eq(context_files.project_id, projectId))
    .limit(1)
  const contextContent = ctx?.content ?? 'No notes yet.'

  const anthropic = new Anthropic({ apiKey: conn.api_key })
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    system: `You are a helpful assistant. The user is asking questions about their personal notes and knowledge base. Here are their notes:\n\n${contextContent}\n\nAnswer questions based on these notes. Be concise and helpful.`,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''
  return NextResponse.json({ content: text })
}
