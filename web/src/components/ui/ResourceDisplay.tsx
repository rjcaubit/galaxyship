export function ResourceDisplay({ icon, value, label, delta }: { icon: string; value: number; label: string; delta?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-xs text-white/40">{label}
          {delta !== undefined && <span className={`ml-1 ${delta >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>{delta >= 0 ? '+' : ''}{delta}</span>}
        </div>
      </div>
    </div>
  )
}
