export function ProgressBar({ value, color = 'bg-neon-blue', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-white/60"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
