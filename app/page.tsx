import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { projects, subjects, memo_blocks } from '@/lib/schema'
import { eq, isNull, desc, asc, and } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import type { Project, MemoBlock, Subject } from '@/lib/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; s?: string }>
}) {
  const { p, s } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  const [projectList, subjectList] = await Promise.all([
    db.select({
      id: projects.id,
      name: projects.name,
      subject_id: projects.subject_id,
      archived_at: projects.archived_at,
      pinned_at: projects.pinned_at,
      created_at: projects.created_at,
    })
      .from(projects)
      .where(and(eq(projects.owner_id, session.userId), isNull(projects.archived_at)))
      .orderBy(desc(projects.pinned_at), desc(projects.created_at)),
    db.select({ id: subjects.id, name: subjects.name, created_at: subjects.created_at })
      .from(subjects)
      .where(eq(subjects.owner_id, session.userId))
      .orderBy(asc(subjects.created_at)),
  ])

  let blocks: MemoBlock[] = []
  if (p) {
    blocks = await db.select({
      id: memo_blocks.id,
      project_id: memo_blocks.project_id,
      type: memo_blocks.type,
      content: memo_blocks.content,
      position: memo_blocks.position,
      created_at: memo_blocks.created_at,
    })
      .from(memo_blocks)
      .where(eq(memo_blocks.project_id, p))
      .orderBy(asc(memo_blocks.position))
  }

  const selectedProject = (projectList as Project[]).find(proj => proj.id === p) ?? null

  return (
    <AppShell
      projects={projectList as Project[]}
      subjects={subjectList as Subject[]}
      blocks={blocks}
      selectedProject={selectedProject}
      selectedId={p ?? null}
      defaultSubjectId={s ?? null}
      userEmail={session.email}
    />
  )
}
