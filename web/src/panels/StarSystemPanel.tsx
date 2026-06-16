import { Panel, Button, Badge, EmptyState } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import {
  PLANET_TYPE_LABEL, PLANET_SIZE_LABEL, RICHNESS_LABEL, RACE_LABEL, fleetSummary,
} from '../game/labels'
import type { FleetData } from '@galaxyship/shared'

export function StarSystemPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state          = useGameStore(s => s.state)
  const selectedSystem = useGameStore(s => s.selectedSystem)
  const selectedFleet  = useGameStore(s => s.selectedFleet)
  const moveMode       = useGameStore(s => s.moveMode)
  const orders         = useGameStore(s => s.orders)
  const selectFleet    = useGameStore(s => s.selectFleet)
  const setMoveMode    = useGameStore(s => s.setMoveMode)
  const addOrder       = useGameStore(s => s.addOrder)
  const openPanel      = useGameStore(s => s.openPanel)

  if (!state || !selectedSystem) {
    return <Panel open={open} onClose={onClose} title="Sistema" position="right">
      <EmptyState title="Nenhum sistema selecionado" description="Toque numa estrela no mapa" icon="⭐" />
    </Panel>
  }

  const sys = state.systems[selectedSystem]
  const explored = state.exploredSystems.includes(selectedSystem)
  const colony = Object.values(state.colonies).find(c => c.systemId === selectedSystem)
  const fleetsHere = Object.values(state.fleets).filter(
    f => f.systemId === selectedSystem && (f.raceId === state.playerRaceId || explored)
  )
  const playerFleets = fleetsHere.filter(f => f.raceId === state.playerRaceId && f.etaTurns <= 0)
  const pendingMove = (id: string) => orders.find(o => o.type === 'MOVE_FLEET' && o.fleetId === id) as
    { targetSystemId: string } | undefined
  const hasColonizeOrder = (id: string) => orders.some(o => o.type === 'COLONIZE' && (o as { fleetId: string }).fleetId === id)

  function startMove(f: FleetData) { selectFleet(f.id); setMoveMode(true) }
  function colonize(f: FleetData) { addOrder({ type: 'COLONIZE', fleetId: f.id }) }

  return (
    <Panel open={open} onClose={onClose} title={explored ? sys.name : 'Sistema inexplorado'} position="right">
      {moveMode && selectedFleet && (
        <div className="mb-3 p-2 rounded-lg bg-neon-gold/15 text-neon-gold text-sm text-center animate-pulse">
          🎯 Toque numa estrela para mover a frota
        </div>
      )}

      {/* Dono */}
      {colony && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-white/50">Colônia de</span>
          <Badge variant={colony.raceId === state.playerRaceId ? 'info' : 'danger'}
            label={RACE_LABEL[colony.raceId]?.name ?? colony.raceId} />
          <span className="text-xs text-white/40">pop {Math.floor(colony.population)}</span>
        </div>
      )}

      {/* Planetas */}
      {explored ? (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Planetas</p>
          <div className="space-y-1.5">
            {sys.planets.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm bg-space-dark rounded-lg px-3 py-2">
                <span>{p.name}</span>
                <span className="text-xs text-white/50">
                  {PLANET_TYPE_LABEL[p.type] ?? p.type} · {PLANET_SIZE_LABEL[p.size] ?? p.size} · {RICHNESS_LABEL[p.richness] ?? p.richness}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/40 mb-4">Envie uma frota para revelar este sistema.</p>
      )}

      {/* Colônia do jogador → gerenciar */}
      {colony?.raceId === state.playerRaceId && (
        <Button className="w-full mb-3" onClick={() => openPanel('colony')}>🏙️ Gerenciar Colônia</Button>
      )}

      {/* Frotas presentes */}
      <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Frotas aqui</p>
      {fleetsHere.length === 0 && <p className="text-sm text-white/30 mb-2">Nenhuma frota.</p>}
      <div className="space-y-2">
        {fleetsHere.map(f => {
          const mine = f.raceId === state.playerRaceId
          const move = pendingMove(f.id)
          const canColonize = mine && f.colonists > 0 && f.etaTurns <= 0 && explored && !colony
          return (
            <div key={f.id} className="bg-space-dark rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm" style={{ color: RACE_LABEL[f.raceId]?.color }}>{f.name}</span>
                <span className="text-xs text-white/50">{fleetSummary(f)}</span>
              </div>
              {f.etaTurns > 0 && <p className="text-xs text-neon-gold mt-1">em trânsito · {f.etaTurns} turnos</p>}
              {move && <p className="text-xs text-neon-blue mt-1">ordem: ir para {state.systems[move.targetSystemId]?.name}</p>}
              {mine && f.etaTurns <= 0 && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => startMove(f)}>➤ Mover</Button>
                  {canColonize && (
                    <Button size="sm" onClick={() => colonize(f)} disabled={hasColonizeOrder(f.id)}>
                      {hasColonizeOrder(f.id) ? '✓ Colonizando' : '🌍 Colonizar'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
