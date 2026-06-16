import { useState, type ReactNode } from 'react'

export function Tooltip({ content, locked, children }: { content: string; locked?: boolean; children: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)} onTouchEnd={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-space-light border border-white/20 rounded-lg text-xs whitespace-nowrap z-50">
          {locked ? `🔒 Em breve` : content}
        </div>
      )}
    </div>
  )
}
