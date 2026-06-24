export function TurnCounter({ turn }: { turn: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-sm">Turno</span>
      <span className="font-bold text-neon-gold text-lg">{turn}</span>
    </div>
  )
}
