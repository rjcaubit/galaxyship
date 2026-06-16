import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { TurnCounter, ResourceHUD } from '../components/game'
import { Button, IconButton, Badge } from '../components/ui'
import { endTurn } from '../game/gameService'
import { RACE_LABEL } from '../game/labels'
import { StarSystemPanel } from './StarSystemPanel'
import { ColonyPanel }     from './ColonyPanel'
import { TechTreePanel }   from './TechTreePanel'
import { DiplomacyPanel }  from './DiplomacyPanel'
import { TurnReport }      from './TurnReport'
import { EndGameModal }    from './EndGameModal'

export function HUDOverlay() {
  const state         = useGameStore(s => s.state)
  const gameId        = useGameStore(s => s.gameId)
  const processing    = useGameStore(s => s.processingTurn)
  const activePanel   = useGameStore(s => s.activePanel)
  const orders        = useGameStore(s => s.orders)
  const moveMode      = useGameStore(s => s.moveMode)
  const openPanel     = useGameStore(s => s.openPanel)
  const updateState   = useGameStore(s => s.updateState)
  const setEvents     = useGameStore(s => s.setEvents)
  const setProcessing = useGameStore(s => s.setProcessing)
  const clearOrders   = useGameStore(s => s.clearOrders)
  const selectFleet   = useGameStore(s => s.selectFleet)
  const setMoveMode   = useGameStore(s => s.setMoveMode)
  const logout        = useAuthStore(s => s.logout)
  const navigate      = useNavigate()

  if (!state || !gameId) return null
  const race = RACE_LABEL[state.playerRaceId]

  async function handleEndTurn() {
    if (!gameId) return
    setProcessing(true)
    try {
      const { state: newState, events } = await endTurn(gameId, orders, [])
      updateState(newState)
      setEvents(events)
      clearOrders()
      selectFleet(null)
      setMoveMode(false)
    } finally {
      setProcessing(false)
    }
  }

  function handleLogout() { logout(); navigate('/login') }

  return (
    <>
      {/* HUD superior */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-space-dark/90 backdrop-blur border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <TurnCounter turn={state.turn} />
            {race && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: race.color }} title={race.name} />}
          </div>
          <ResourceHUD resources={state.resources} />
          <div className="flex items-center gap-2">
            <IconButton icon="🔬" label="Tecnologia" onClick={() => openPanel('tech')} />
            <IconButton icon="🤝" label="Diplomacia" onClick={() => openPanel('diplomacy')} />
            <IconButton icon="🚪" label="Sair" onClick={handleLogout} />
          </div>
        </div>
      </div>

      {/* Aviso de modo mover */}
      {moveMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button onClick={() => { setMoveMode(false); selectFleet(null) }}
            className="px-4 py-1.5 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/40 text-sm">
            🎯 Escolha o destino · toque para cancelar
          </button>
        </div>
      )}

      {/* Botão Fim de Turno */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <Button onClick={handleEndTurn} loading={processing} size="lg"
          className="shadow-[0_0_20px_rgba(79,195,247,0.3)] relative">
          {processing ? 'Processando...' : '⏭ Fim de Turno'}
          {orders.length > 0 && !processing && (
            <span className="absolute -top-2 -right-2"><Badge variant="warn" label={String(orders.length)} /></span>
          )}
        </Button>
      </div>

      {/* Painéis */}
      <StarSystemPanel open={activePanel === 'system'}    onClose={() => openPanel(null)} />
      <ColonyPanel     open={activePanel === 'colony'}    onClose={() => openPanel('system')} />
      <TechTreePanel   open={activePanel === 'tech'}      onClose={() => openPanel(null)} />
      <DiplomacyPanel  open={activePanel === 'diplomacy'} onClose={() => openPanel(null)} />

      <TurnReport />
      <EndGameModal />
    </>
  )
}
