import { ProgressBar } from '../ui'
import type { ColonyData } from '@galaxyship/shared'

export function ColonyStats({ colony }: { colony: ColonyData }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/60">População</span>
        <span>{colony.population}</span>
      </div>
      <ProgressBar value={colony.population * 10} label="Produção" color="bg-neon-gold" />
      <ProgressBar value={colony.buildProgress} label="Construção" color="bg-neon-blue" />
    </div>
  )
}
