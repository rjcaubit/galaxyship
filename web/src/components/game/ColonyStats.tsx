import { ProgressBar } from '../ui'
import type { ColonyData } from '@galaxyship/shared'

export function ColonyStats({ colony }: { colony: ColonyData }) {
  // Mesma fórmula do backend (turnService.computeResources): pop*2 + nº edifícios
  const production = colony.population * 2 + colony.buildings.length
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">População</span>
        <span>{colony.population} / 10</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Produção</span>
        <span className="text-neon-gold">{production} ⚙️</span>
      </div>
      <ProgressBar value={colony.population * 10} label="Crescimento" color="bg-neon-green" />
      {colony.buildQueue && <ProgressBar value={colony.buildProgress} label="Construção" color="bg-neon-blue" />}
    </div>
  )
}
