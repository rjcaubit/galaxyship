import type { ReactNode } from 'react'

interface CardProps { title?: string; footer?: ReactNode; className?: string; children: ReactNode }

export function Card({ title, footer, className = '', children }: CardProps) {
  return (
    <div className={`bg-space-mid rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {title && <div className="px-4 py-3 border-b border-white/10 font-semibold text-neon-blue">{title}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-white/10">{footer}</div>}
    </div>
  )
}
