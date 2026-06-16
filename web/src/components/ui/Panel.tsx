import type { ReactNode } from 'react'

/**
 * Painel deslizante (bottom-sheet abaixo de md, drawer à direita acima).
 * NÃO bloqueia o resto da tela: o mapa, o HUD e o botão de turno continuam
 * clicáveis com o painel aberto (essencial para o modo mover frota). Fecha no ✕.
 */
export function Panel({ open, onClose, position = 'bottom', title, children }: {
  open: boolean; onClose: () => void; position?: 'bottom' | 'right'; title?: string; children: ReactNode
}) {
  if (!open) return null
  const isBottom = position === 'bottom'
  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className={`pointer-events-auto absolute bg-space-mid/97 backdrop-blur border-white/15 shadow-2xl overflow-y-auto
        ${isBottom
          ? 'bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[70vh]'
          : 'top-0 right-0 bottom-0 w-full md:w-96 border-l'}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-space-mid z-10">
            <h3 className="font-bold text-neon-blue">{title}</h3>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
