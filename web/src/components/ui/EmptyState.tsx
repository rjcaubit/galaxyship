export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {icon && <span className="text-4xl">{icon}</span>}
      <p className="font-semibold text-white/80">{title}</p>
      <p className="text-sm text-white/40">{description}</p>
    </div>
  )
}
