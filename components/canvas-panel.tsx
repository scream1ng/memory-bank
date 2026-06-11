'use client'

import { useRef, useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage, createProjectSilent, createPhotoBlock } from '@/app/actions/canvas'
import { deleteBlock, updateBlock } from '@/app/actions/blocks'
import { createClient } from '@/lib/supabase/client'
import type { MemoBlock, Project, Subject } from '@/lib/types'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((todayStart.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000)
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function greeting(email: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const name = email.split('@')[0]
  return `Good ${time}, ${name}`
}

function PhotoCard({ block, onDelete }: { block: MemoBlock; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    createClient().storage.from('project-media').createSignedUrl(block.content, 3600)
      .then(({ data }) => { if (data) setUrl(data.signedUrl) })
  }, [block.content])
  return (
    <div className="group relative inline-block max-w-sm">
      {url
        ? <img src={url} alt="" className="rounded-2xl max-h-64 object-cover" />
        : <div className="h-32 w-48 animate-pulse rounded-2xl bg-zinc-700" />
      }
      <button onClick={onDelete} className="absolute top-2 right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs">×</button>
      <p className="mt-1 text-xs text-zinc-500">{formatTime(block.created_at)}</p>
    </div>
  )
}

function MessageCard({ block }: { block: MemoBlock }) {
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current
      el.focus(); el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'
    }
  }, [editing])

  function handleDelete() { startTransition(async () => { await deleteBlock(block.id) }) }

  if (block.type === 'photo') return <PhotoCard block={block} onDelete={handleDelete} />

  return (
    <div className="group flex justify-end">
      {editing ? (
        <form
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            setEditing(false)
            startTransition(async () => { await updateBlock(block.id, fd) })
          }}
          className="w-full max-w-[85%]"
        >
          <textarea
            ref={textareaRef}
            name="content"
            defaultValue={block.content}
            rows={3}
            className="w-full resize-none rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:outline-none"
            onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
            onKeyDown={e => {
              if (e.key === 'Escape') setEditing(false)
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit()
            }}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-1 text-xs text-zinc-400 rounded-lg hover:bg-zinc-800">Cancel</button>
            <button type="submit" className="px-3 py-1 text-xs bg-zinc-100 text-zinc-900 rounded-lg">Save</button>
          </div>
        </form>
      ) : (
        <div className="flex items-end gap-2 max-w-[85%]">
          {/* Hover actions to the left of bubble */}
          <div className="hidden group-hover:flex items-center gap-1 mb-1 shrink-0">
            <button onClick={() => setEditing(true)} className="text-xs text-zinc-500 hover:text-zinc-300">Edit</button>
            <button onClick={handleDelete} className="text-xs text-zinc-500 hover:text-red-400">Delete</button>
          </div>
          <div>
            <div className="rounded-2xl bg-zinc-800 px-4 py-3">
              <p className="text-sm text-zinc-100 whitespace-pre-wrap">{block.content}</p>
            </div>
            <p className="mt-1 text-right text-xs text-zinc-600">{formatTime(block.created_at)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Composer ─────────────────────────────────────────────────────────────── */
function Composer({ selectedProject, subjects, selectedSubjectId, onSelectSubject, isPending, uploading, onSend, onFileUpload, autoFocus }: {
  selectedProject: Project | null
  subjects: Subject[]
  selectedSubjectId: string | null
  onSelectSubject: (id: string | null) => void
  isPending: boolean
  uploading: boolean
  onSend: (text: string) => void
  onFileUpload: (file: File) => void
  autoFocus?: boolean
}) {
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const busy = isPending || uploading

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(trimmed)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (!img) return
    e.preventDefault()
    const file = img.getAsFile()
    if (file) onFileUpload(file)
  }

  return (
    <div
      className="w-full"
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFileUpload(f) }}
    >
      <div className={`rounded-3xl border transition-colors shadow-lg ${
        dragOver
          ? 'border-blue-500 bg-blue-950/30'
          : 'border-zinc-700 bg-zinc-900 focus-within:border-zinc-500'
      }`}>
        {/* Selected subject badge */}
        {selectedSubjectId && !selectedProject && (
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
            <span className="flex items-center gap-1 rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300">
              {subjects.find(s => s.id === selectedSubjectId)?.name}
              <button onClick={() => onSelectSubject(null)} className="ml-0.5 text-zinc-500 hover:text-zinc-200">×</button>
            </span>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => {
            setText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={selectedProject ? 'Message recall…' : 'How can I help you today?'}
          rows={1}
          disabled={busy}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          style={{ maxHeight: '200px' }}
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onFileUpload(f); e.target.value = '' }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} title="Attach image"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-zinc-300 disabled:opacity-30 transition-colors">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
          <button onClick={submit} disabled={!text.trim() || busy}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-900 disabled:opacity-30 transition-opacity">
            {busy
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
              : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /></svg>
            }
          </button>
        </div>
        {dragOver && <p className="pb-2 text-center text-xs text-blue-400">Drop to attach photo</p>}
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function CanvasPanel({ blocks, subjects, selectedProject, rightPanelOpen, onToggleRight, defaultSubjectId, userEmail }: {
  blocks: MemoBlock[]
  subjects: Subject[]
  selectedProject: Project | null
  rightPanelOpen: boolean
  onToggleRight: () => void
  defaultSubjectId: string | null
  userEmail: string
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(defaultSubjectId)
  useEffect(() => { setSelectedSubjectId(defaultSubjectId) }, [defaultSubjectId])
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [blocks.length])

  function handleSend(text: string) {
    const pid = selectedProject?.id ?? null
    const sid = pid ? null : selectedSubjectId
    startTransition(async () => {
      const result = await sendMessage(text, pid, sid)
      if (!result || 'error' in result) return
      if (!pid) { setSelectedSubjectId(null); router.push(`/?p=${result.projectId}`) }
    })
  }

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let pid = selectedProject?.id ?? null
      if (!pid) {
        const res = await createProjectSilent(`Photos ${new Date().toLocaleDateString()}`)
        if ('error' in res) return
        pid = res.id
      }
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${pid}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('project-media').upload(path, file)
      if (error) return
      await createPhotoBlock(pid, path)
      if (!selectedProject) router.push(`/?p=${pid}`)
    } finally { setUploading(false) }
  }, [selectedProject, router])

  const busy = isPending || uploading

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-zinc-950">
      {/* Details toggle — floating top-right */}
      <div className="absolute top-3 right-4 z-10">
        <button
          onClick={onToggleRight}
          title={rightPanelOpen ? 'Hide details' : 'Show details'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            rightPanelOpen ? 'bg-white/10 text-zinc-300' : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-400'
          }`}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" />
          </svg>
        </button>
      </div>

      {!selectedProject ? (
        /* ── Home: centered composer ── */
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
          {/* Greeting */}
          <h1 className="text-3xl font-semibold text-white mb-8 tracking-tight">
            {greeting(userEmail)}
          </h1>

          {/* Composer centered */}
          <div className="w-full max-w-2xl">
            <Composer
              selectedProject={null}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubject={setSelectedSubjectId}
              isPending={isPending}
              uploading={uploading}
              onSend={handleSend}
              onFileUpload={handleFileUpload}
              autoFocus
            />
          </div>

          {/* Subject chips below composer */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-2xl">
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(id => id === s.id ? null : s.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selectedSubjectId === s.id
                      ? 'border-zinc-400 bg-zinc-700 text-zinc-100'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Active conversation ── */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-4">
              <p className="text-xs text-zinc-600 text-center pb-2">{selectedProject.name}</p>
              {blocks.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-8">No notes yet. Type below.</p>
              )}
              {blocks.map(block => <MessageCard key={block.id} block={block} />)}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="shrink-0 px-4 pb-6 pt-2">
            <div className="mx-auto w-full max-w-2xl">
              <Composer
                selectedProject={selectedProject}
                subjects={subjects}
                selectedSubjectId={null}
                onSelectSubject={() => {}}
                isPending={isPending}
                uploading={uploading}
                onSend={handleSend}
                onFileUpload={handleFileUpload}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
