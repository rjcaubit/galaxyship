import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { TurnCounter, ResourceHUD } from '../components/game'
import { Button, IconButton } from '../components/ui'
import { endTurn } from '../game/gameService'
import { ColonyPanel }    from './ColonyPanel'
import { TechTreePanel }  from './TechTreePanel'
import { DiplomacyPanel } from './DiplomacyPanel'
import { CombatModal }    from './CombatModal'

export function HUDOverlay() {
  const state         = useGameStore(s => s.state)
  const gameId        = useGameStore(s => s.gameId)
  const processing    = useGameStore(s => s.processingTurn)
  const pendingEvents = useGameStore(s => s.pendingEvents)
  const activePanel   = useGameStore(s => s.activePanel)
  const openPanel     = useGameStore(s => s.openPanel)
  const updateState   = useGameStore(s => s.updateState)
  const setEvents     = useGameStore(s => s.setEvents)
  const setProcessing = useGameStore(s => s.setProcessing)
  const logout        = useAuthStore(s => s.logout)
  const navigate      = useNavigate()

  if (!state || !gameId) return null

  const combatEvent = pendingEvents.find(e => e.type === 'COMBAT')

  async function handleEndTurn() {
    if (!gameId) return
    setProcessing(true)
    try {
      const { state: newState, events } = await endTurn(gameId, [], [])
      updateState(newState)
      setEvents(events)
    } finally {
      setProcessing(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* HUD superior */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-space-dark/90 backdrop-blur border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
          <TurnCounter turn={state.turn} />
          <ResourceHUD resources={state.resources} />
          <div className="flex items-center gap-2">
            <IconButton icon="🔬" label="Tecnologia" onClick={() => openPanel('tech')} />
            <IconButton icon="🤝" label="Diplomacia" onClick={() => openPanel('diplomacy')} />
            <IconButton icon="🚪" label="Sair" onClick={handleLogout} />
          </div>
        </div>
      </div>

      {/* Botão Fim de Turno (inferior centro) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <Button onClick={handleEndTurn} loading={processing} size="lg"
          className="shadow-[0_0_20px_rgba(79,195,247,0.3)]">
          {processing ? 'Processando...' : '⏭ Fim de Turno'}
        </Button>
      </div>

      {/* Painéis (estado no store) */}
      <ColonyPanel    open={activePanel === 'colony'}    onClose={() => openPanel(null)} />
      <TechTreePanel  open={activePanel === 'tech'}      onClose={() => openPanel(null)} />
      <DiplomacyPanel open={activePanel === 'diplomacy'} onClose={() => openPanel(null)} />
      {combatEvent && (
        <CombatModal open onClose={() => setEvents(pendingEvents.filter(e => e.type !== 'COMBAT'))}
          event={combatEvent} />
      )}
    </>
  )
}
