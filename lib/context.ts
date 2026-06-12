import { db } from './db'
import { memo_blocks, context_files } from './schema'
import { eq } from 'drizzle-orm'

export async function refreshContext(projectId: string) {
  const blocks = await db.select().from(memo_blocks)
    .where(eq(memo_blocks.project_id, projectId))
    .orderBy(memo_blocks.position)

  const textBlocks = blocks.filter(b => b.type === 'text' && b.content.trim())
  const photoBlocks = blocks.filter(b => b.type === 'photo')

  const lines: string[] = ['# Project Notes']
  for (const block of textBlocks) {
    lines.push('', block.content.trim())
  }
  if (photoBlocks.length > 0) {
    lines.push('', '## Attachments', `${photoBlocks.length} photo(s) attached.`)
  }

  const content = lines.join('\n')

  await db.insert(context_files)
    .values({ project_id: projectId, content })
    .onConflictDoUpdate({
      target: context_files.project_id,
      set: { content, updated_at: new Date().toISOString() },
    })
}
