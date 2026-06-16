import { Panel, ProgressBar, EmptyState } from '../components/ui'
import { ColonyStats } from '../components/game'
import { useGameStore } from '../store/gameStore'

export function ColonyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state          = useGameStore(s => s.state)
  const selectedSystem = useGameStore(s => s.selectedSystem)

  const colony = selectedSystem && state
    ? Object.values(state.colonies).find(c => c.systemId === selectedSystem)
    : null

  return (
    <Panel open={open} onClose={onClose} title="Colônia" position="bottom">
      {!colony ? (
        <EmptyState title="Nenhuma colônia selecionada" description="Toque em um planeta colonizado no mapa" icon="🌍" />
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">{colony.name}</h3>
          <ColonyStats colony={colony} />
          <div>
            <p className="text-sm text-white/40 mb-2">Edifícios</p>
            {colony.buildings.length === 0
              ? <p className="text-sm text-white/30">Nenhum edifício construído</p>
              : colony.buildings.map(b => <div key={b} className="text-sm py-1">{b}</div>)
            }
          </div>
          {colony.buildQueue && (
            <div>
              <p className="text-sm text-white/40 mb-1">Construindo</p>
              <ProgressBar value={colony.buildProgress} label={colony.buildQueue} color="bg-neon-gold" />
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
