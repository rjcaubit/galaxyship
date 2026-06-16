export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-white/10 my-3" />
  return (
    <div className="flex items-center gap-3 my-3">
      <hr className="flex-1 border-white/10" />
      <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      <hr className="flex-1 border-white/10" />
    </div>
  )
}
