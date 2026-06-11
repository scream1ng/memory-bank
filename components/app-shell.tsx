'use client'

import { useState } from 'react'
import ProjectsPanel from './projects-panel'
import CanvasPanel from './canvas-panel'
import RightPanel from './right-panel'
import type { Project, MemoBlock, Subject } from '@/lib/types'

export default function AppShell({
  projects,
  subjects,
  blocks,
  selectedProject,
  selectedId,
  defaultSubjectId,
  userEmail,
}: {
  projects: Project[]
  subjects: Subject[]
  blocks: MemoBlock[]
  selectedProject: Project | null
  selectedId: string | null
  defaultSubjectId: string | null
  userEmail: string
}) {
  const hasPhotos = blocks.some(b => b.type === 'photo')
  const [rightOpen, setRightOpen] = useState(false)
  const rightVisible = rightOpen || hasPhotos

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <ProjectsPanel
        projects={projects}
        subjects={subjects}
        selectedId={selectedId}
        userEmail={userEmail}
      />
      <CanvasPanel
        blocks={blocks}
        subjects={subjects}
        selectedProject={selectedProject}
        rightPanelOpen={rightVisible}
        onToggleRight={() => setRightOpen(o => !o)}
        defaultSubjectId={defaultSubjectId}
        userEmail={userEmail}
      />
      {rightVisible && (
        <RightPanel
          blocks={blocks}
          onClose={hasPhotos ? undefined : () => setRightOpen(false)}
        />
      )}
    </div>
  )
}
