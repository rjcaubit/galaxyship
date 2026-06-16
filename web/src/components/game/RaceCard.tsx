import type { RaceParams } from '@galaxyship/shared'
import { Badge } from '../ui'

interface RaceCardProps { race: RaceParams; selected?: boolean; onSelect?: () => void }

export function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  return (
    <button onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all
        ${selected ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-space-mid hover:border-white/30'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full" style={{ backgroundColor: race.color }} />
        <div>
          <div className="font-bold">{race.name}</div>
          <div className="text-xs text-white/50">{race.traits.join(' · ')}</div>
        </div>
      </div>
      <p className="text-sm text-white/60 mb-3">{race.description}</p>
      <div className="flex flex-wrap gap-1">
        {Object.entries(race.bonuses).map(([k, v]) => (
          <Badge key={k} variant="success" label={`+${v} ${k}`} />
        ))}
        {Object.entries(race.penalties).map(([k, v]) => (
          <Badge key={k} variant="danger" label={`${v} ${k}`} />
        ))}
      </div>
    </button>
  )
}
