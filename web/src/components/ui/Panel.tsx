import type { ReactNode } from 'react'

export function Panel({ open, onClose, position = 'bottom', title, children }: {
  open: boolean; onClose: () => void; position?: 'bottom' | 'right'; title?: string; children: ReactNode
}) {
  if (!open) return null
  const isBottom = position === 'bottom'
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute bg-space-mid border-white/15 shadow-2xl overflow-y-auto
        ${isBottom
          ? 'bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[80vh]'
          : 'top-0 right-0 bottom-0 w-full md:w-96 border-l'}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-space-mid">
            <h3 className="font-bold text-neon-blue">{title}</h3>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
