import type { ReactNode } from 'react'
import { Tooltip } from '../ui'

export function LockedFeature({ label, reason, children }: { label: string; reason?: string; children?: ReactNode }) {
  return (
    <Tooltip content={reason || 'Em desenvolvimento'} locked>
      <div className="relative opacity-40 cursor-not-allowed select-none pointer-events-none">
        {children || (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm">
            🔒 <span>{label}</span>
          </div>
        )}
      </div>
    </Tooltip>
  )
}
