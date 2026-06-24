import { Modal } from '../components/ui'
import { CombatLogEntry } from '../components/game'
import { useGameStore } from '../store/gameStore'
import type { TurnEvent, CombatLogLine } from '@galaxyship/shared'

export function CombatModal({ open, onClose, event }: { open: boolean; onClose: () => void; event: TurnEvent }) {
  const playerRaceId = useGameStore(s => s.state?.playerRaceId)
  const payload = event.payload as unknown as { winner: string; log: CombatLogLine[]; systemId: string }
  const systemName = useGameStore(s => s.state?.systems[payload.systemId]?.name ?? payload.systemId)
  const playerWon = payload.winner === playerRaceId

  return (
    <Modal open={open} onClose={onClose} title="⚔️ Combate">
      <p className="text-sm text-white/50 mb-3">Sistema: <span className="text-white">{systemName}</span></p>
      <div className="bg-space-dark rounded-xl p-4 space-y-1 mb-4 max-h-48 overflow-y-auto">
        {payload.log.map((entry, i) => <CombatLogEntry key={i} entry={entry} />)}
      </div>
      <div className={`text-center font-bold text-lg ${playerWon ? 'text-neon-green' : 'text-neon-red'}`}>
        {playerWon ? '🏆 Vitória!' : '💀 Derrota'}
      </div>
    </Modal>
  )
}
