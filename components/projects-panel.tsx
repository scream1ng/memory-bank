'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { renameProject, deleteProject, assignChatToSubject } from '@/app/actions/projects'
import { createSubject, renameSubject, deleteSubject } from '@/app/actions/subjects'
import { signOut } from '@/app/actions/auth'
import type { Project, Subject } from '@/lib/types'

type TimeGroup = { label: string; items: Project[] }

function groupByTime(items: Project[]): TimeGroup[] {
  const D = 86_400_000
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  const b: TimeGroup[] = [
    { label: 'Today', items: [] }, { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] }, { label: 'Previous 30 days', items: [] },
    { label: 'Older', items: [] },
  ]
  for (const p of items) {
    const age = todayStart - new Date(new Date(p.created_at).setHours(0, 0, 0, 0)).getTime()
    if (age === 0) b[0].items.push(p)
    else if (age === D) b[1].items.push(p)
    else if (age <= 7 * D) b[2].items.push(p)
    else if (age <= 30 * D) b[3].items.push(p)
    else b[4].items.push(p)
  }
  return b.filter(g => g.items.length > 0)
}

/* ── Subject assignment picker ─────────────────────────────────────────────── */
function SubjectPicker({ subjects, currentSubjectId, onAssign, onClose }: {
  subjects: Subject[]
  currentSubjectId: string | null
  onAssign: (id: string | null) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function down(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [onClose])

  return (
    <div ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl bg-zinc-800 border border-zinc-700 shadow-2xl py-1 text-xs"
      onClick={e => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-zinc-600 font-medium">Move to subject</p>
      {subjects.length === 0 && (
        <p className="px-3 py-2 text-zinc-600">No subjects yet.</p>
      )}
      {subjects.map(s => (
        <button key={s.id} onClick={() => onAssign(s.id)}
          className={`flex w-full items-center gap-2 px-3 py-1.5 transition-colors hover:bg-zinc-700 ${
            currentSubjectId === s.id ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span className="flex-1 truncate">{s.name}</span>
          {currentSubjectId === s.id && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
      {currentSubjectId && (
        <>
          <div className="my-1 border-t border-zinc-700" />
          <button onClick={() => onAssign(null)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-300 transition-colors">
            Remove from subject
          </button>
        </>
      )}
    </div>
  )
}

/* ── Chat item ─────────────────────────────────────────────────────────────── */
function ChatItem({ project, subjects, selected, depth = 0, onSelect }: {
  project: Project
  subjects: Subject[]
  selected: boolean
  depth?: number
  onSelect: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setRenaming(false)
    startTransition(async () => { await renameProject(project.id, fd) })
  }

  function handleAssign(subjectId: string | null) {
    setShowPicker(false)
    startTransition(async () => { await assignChatToSubject(project.id, subjectId) })
  }

  return (
    <div
      onClick={renaming ? undefined : onSelect}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      className={`group relative flex items-center rounded-lg mx-2 pr-2 py-1.5 cursor-pointer select-none transition-colors text-sm ${
        selected ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
      }`}
    >
      {/* Chat bubble icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mr-2 opacity-40">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>

      {renaming ? (
        <form onSubmit={handleRename} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            name="name"
            defaultValue={project.name}
            onBlur={() => setRenaming(false)}
            onKeyDown={e => e.key === 'Escape' && setRenaming(false)}
            className="w-full rounded bg-zinc-800 border border-zinc-600 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none"
          />
        </form>
      ) : (
        <>
          <span className="flex-1 min-w-0 truncate">{project.name}</span>

          {/* Hover actions */}
          <div className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
            {/* Assign to subject */}
            <button
              onClick={e => { e.stopPropagation(); setShowPicker(v => !v) }}
              className={`rounded p-1 hover:bg-white/10 transition-colors ${project.subject_id ? 'text-zinc-400' : 'text-zinc-600 hover:text-zinc-300'}`}
              title="Move to subject"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); setRenaming(true) }}
              className="rounded p-1 hover:bg-white/10 text-zinc-600 hover:text-zinc-300" title="Rename"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                if (!confirm(`Delete "${project.name}"?`)) return
                startTransition(async () => { await deleteProject(project.id) })
              }}
              className="rounded p-1 hover:bg-white/10 text-zinc-600 hover:text-red-400" title="Delete"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Subject picker popover */}
          {showPicker && (
            <SubjectPicker
              subjects={subjects}
              currentSubjectId={project.subject_id}
              onAssign={handleAssign}
              onClose={() => setShowPicker(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── Subject folder row ────────────────────────────────────────────────────── */
function SubjectFolder({ subject, chats, subjects, selectedId, onSelectChat, onAddChat }: {
  subject: Subject
  chats: Project[]
  subjects: Subject[]
  selectedId: string | null
  onSelectChat: (id: string) => void
  onAddChat: () => void
}) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setRenaming(false)
    startTransition(async () => { await renameSubject(subject.id, fd) })
  }

  return (
    <div>
      <div className="group flex items-center rounded-lg mx-2 px-2 py-1.5 hover:bg-white/5 transition-colors">
        {/* Chevron */}
        <button onClick={() => setOpen(o => !o)} className="shrink-0 mr-1.5 text-zinc-700 hover:text-zinc-400">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
        {/* Folder icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mr-2 text-zinc-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>

        {renaming ? (
          <form onSubmit={handleRename} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              name="name"
              defaultValue={subject.name}
              onBlur={() => setRenaming(false)}
              onKeyDown={e => e.key === 'Escape' && setRenaming(false)}
              className="w-full rounded bg-zinc-800 border border-zinc-600 px-2 py-0.5 text-xs text-zinc-100 focus:outline-none"
            />
          </form>
        ) : (
          <button onClick={() => setOpen(o => !o)} className="flex-1 min-w-0 text-left">
            <span className="text-xs font-medium text-zinc-300 truncate block">{subject.name}</span>
          </button>
        )}

        {/* Hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onAddChat() }}
            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition-colors"
            title={`New chat in ${subject.name}`}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button onClick={() => setRenaming(true)} className="rounded p-1 hover:bg-white/10 text-zinc-600 hover:text-zinc-300" title="Rename">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => { if (!confirm(`Delete "${subject.name}"?`)) return; startTransition(async () => { await deleteSubject(subject.id) }) }}
            className="rounded p-1 hover:bg-white/10 text-zinc-600 hover:text-red-400" title="Delete">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {open && (
        <div>
          {chats.map(p => (
            <ChatItem key={p.id} project={p} subjects={subjects} selected={p.id === selectedId} depth={1} onSelect={() => onSelectChat(p.id)} />
          ))}
          {chats.length === 0 && (
            <button onClick={onAddChat} style={{ paddingLeft: '38px' }}
              className="w-full text-left py-1 text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
              + New chat
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */
export default function ProjectsPanel({ projects, subjects, selectedId, userEmail }: {
  projects: Project[]
  subjects: Subject[]
  selectedId: string | null
  userEmail: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [addingSubject, setAddingSubject] = useState(false)
  const newSubjectRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingSubject) newSubjectRef.current?.focus()
  }, [addingSubject])

  function handleCreateSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setAddingSubject(false)
    startTransition(async () => { await createSubject(fd) })
  }

  const subjectChats = (sid: string) => projects.filter(p => p.subject_id === sid && !p.pinned_at)
  const pinned = projects.filter(p => p.pinned_at)
  const unassigned = projects.filter(p => !p.subject_id && !p.pinned_at)
  const recentGroups = groupByTime(unassigned)
  const initial = userEmail ? userEmail[0].toUpperCase() : '?'

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">recall</span>
        <button onClick={() => router.push('/')} title="New chat"
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-white transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Primary action buttons — same style */}
      <div className="px-3 pb-2 space-y-0.5">
        <button onClick={() => router.push('/')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>

        {addingSubject ? (
          <form onSubmit={handleCreateSubject} className="px-1">
            <input
              ref={newSubjectRef}
              name="name"
              placeholder="Subject name…"
              onBlur={() => setAddingSubject(false)}
              onKeyDown={e => e.key === 'Escape' && setAddingSubject(false)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </form>
        ) : (
          <button onClick={() => setAddingSubject(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New subject
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Subjects */}
        {subjects.length > 0 && (
          <div className="mb-2">
            <p className="px-4 pb-1 pt-1 text-xs font-medium text-zinc-600 uppercase tracking-wider">Subjects</p>
            {subjects.map(s => (
              <SubjectFolder
                key={s.id}
                subject={s}
                chats={subjectChats(s.id)}
                subjects={subjects}
                selectedId={selectedId}
                onSelectChat={id => router.push(`/?p=${id}`)}
                onAddChat={() => router.push(`/?s=${s.id}`)}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        {subjects.length > 0 && (recentGroups.length > 0 || pinned.length > 0) && (
          <div className="mx-3 my-2 border-t border-zinc-800" />
        )}

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="mb-2">
            <p className="px-4 pb-1 text-xs font-medium text-zinc-600 uppercase tracking-wider">Pinned</p>
            {pinned.map(p => (
              <ChatItem key={p.id} project={p} subjects={subjects} selected={p.id === selectedId} onSelect={() => router.push(`/?p=${p.id}`)} />
            ))}
          </div>
        )}

        {/* Recent */}
        {recentGroups.length > 0 && (
          <div>
            <p className="px-4 pb-1 text-xs font-medium text-zinc-600 uppercase tracking-wider">Recent</p>
            {recentGroups.map(group => (
              <div key={group.label} className="mb-2">
                <p className="px-4 pb-0.5 text-xs text-zinc-700">{group.label}</p>
                {group.items.map(p => (
                  <ChatItem key={p.id} project={p} subjects={subjects} selected={p.id === selectedId} onSelect={() => router.push(`/?p=${p.id}`)} />
                ))}
              </div>
            ))}
          </div>
        )}

        {subjects.length === 0 && unassigned.length === 0 && pinned.length === 0 && (
          <p className="px-4 py-3 text-xs text-zinc-700">No chats yet.</p>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-3">
        <div className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
          <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
            {initial}
          </div>
          <span className="flex-1 min-w-0 truncate text-xs text-zinc-500">{userEmail}</span>
          <button onClick={() => startTransition(async () => { await signOut() })} title="Sign out"
            className="hidden group-hover:block text-zinc-600 hover:text-zinc-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
