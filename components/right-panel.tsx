import type { MemoBlock } from '@/lib/types'

export default function RightPanel({
  blocks,
  onClose,
}: {
  blocks: MemoBlock[]
  onClose?: () => void
}) {
  const photos = blocks.filter(b => b.type === 'photo')

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Attachments</p>
          {photos.length === 0 ? (
            <p className="text-xs text-zinc-400">No photos yet. Drop images into the composer.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {/* Photo thumbnails — storage phase */}
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">AI</p>
          <p className="text-xs text-zinc-400">AI chat coming in Phase 3.</p>
        </div>
      </div>
    </aside>
  )
}
