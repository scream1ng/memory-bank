'use client'

import { useState, useEffect, useRef } from 'react'
import type { MemoBlock, Project } from '@/lib/types'
import { getApiKeyStatus, saveApiKey, deleteApiKey, getContextFile } from '@/app/actions/ai'

type Tab = 'summary' | 'chat'
type Message = { role: 'user' | 'assistant'; content: string }

export default function RightPanel({
  blocks,
  selectedProject,
  onClose,
}: {
  blocks: MemoBlock[]
  selectedProject: Project | null
  onClose?: () => void
}) {
  const [tab, setTab] = useState<Tab>('summary')
  const [hasKey, setHasKey] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [savingKey, setSavingKey] = useState(false)
  const [contextContent, setContextContent] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getApiKeyStatus().then(r => setHasKey(r.hasKey))
  }, [])

  useEffect(() => {
    if (!selectedProject) { setContextContent(null); return }
    getContextFile(selectedProject.id).then(r => setContextContent(r.content))
  }, [selectedProject, blocks])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault()
    setSavingKey(true)
    const result = await saveApiKey(keyInput)
    setSavingKey(false)
    if (!('error' in result)) {
      setHasKey(true)
      setKeyInput('')
    }
  }

  async function handleDeleteKey() {
    await deleteApiKey()
    setHasKey(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !selectedProject) return
    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id, messages: updated }),
      })
      const data = await res.json()
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('summary')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'summary' ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'chat' ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Ask AI
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {tab === 'summary' && (
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedProject ? (
            <p className="text-xs text-zinc-500">Select a project to see its summary.</p>
          ) : contextContent ? (
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">{contextContent}</pre>
          ) : (
            <p className="text-xs text-zinc-500">No notes yet. Start writing to generate a summary.</p>
          )}
        </div>
      )}

      {tab === 'chat' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {!hasKey ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <div className="text-center">
                <p className="mb-1 text-sm font-medium text-zinc-200">Connect your Anthropic key</p>
                <p className="text-xs text-zinc-500">Stored privately, only used for your requests.</p>
              </div>
              <form onSubmit={handleSaveKey} className="flex w-full flex-col gap-2">
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
                <button
                  type="submit"
                  disabled={savingKey || !keyInput.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingKey ? 'Saving…' : 'Save key'}
                </button>
              </form>
            </div>
          ) : !selectedProject ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-xs text-zinc-500">Select a project to chat with AI.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.length === 0 && (
                  <p className="text-xs text-zinc-500">Ask anything about your notes.</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-200'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-xl bg-zinc-800 px-3 py-2 text-xs text-zinc-500">Thinking…</div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-zinc-800 p-3">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about your notes…"
                    disabled={sending}
                    className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
                <button
                  onClick={handleDeleteKey}
                  className="mt-2 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  Remove API key
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
