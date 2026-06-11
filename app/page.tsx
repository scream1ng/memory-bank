import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app-shell'
import type { Project, MemoBlock, Subject } from '@/lib/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; s?: string }>
}) {
  const { p, s } = await searchParams
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: projects },
    { data: subjects },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('projects')
      .select('id, name, subject_id, archived_at, pinned_at, created_at')
      .is('archived_at', null)
      .order('pinned_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('subjects')
      .select('id, name, created_at')
      .order('created_at', { ascending: true }),
  ])

  let blocks: MemoBlock[] = []
  if (p) {
    const { data } = await supabase
      .from('memo_blocks')
      .select('id, project_id, type, content, position, created_at')
      .eq('project_id', p)
      .order('position', { ascending: true })
    blocks = data ?? []
  }

  const projectList: Project[] = projects ?? []
  const subjectList: Subject[] = subjects ?? []
  const selectedProject = projectList.find(proj => proj.id === p) ?? null
  const userEmail = user?.email ?? ''

  return (
    <AppShell
      projects={projectList}
      subjects={subjectList}
      blocks={blocks}
      selectedProject={selectedProject}
      selectedId={p ?? null}
      defaultSubjectId={s ?? null}
      userEmail={userEmail}
    />
  )
}
