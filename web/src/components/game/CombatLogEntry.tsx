import type { CombatLogLine } from '@galaxyship/shared'

export function CombatLogEntry({ entry }: { entry: CombatLogLine }) {
  const colors = { attack: 'text-neon-red', defense: 'text-neon-blue', result: 'text-neon-gold' }
  return (
    <p className={`text-sm py-1 ${colors[entry.type]}`}>
      <span className="text-white/30 mr-2">R{entry.round}.</span>{entry.text}
    </p>
  )
}
