import { Panel, Badge, Button } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { apiDiplomacy } from '../api/gameApi'

const RACE_LABELS: Record<string, { name: string; color: string }> = {
  zorg:  { name: 'Zorg',  color: '#EF9A9A' },
  sylar: { name: 'Sylar', color: '#A5D6A7' },
}
const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'neutral' | 'info'> = {
  peace: 'success', war: 'danger', neutral: 'neutral', alliance: 'info'
}
const STATUS_LABEL: Record<string, string> = {
  peace: 'Paz', war: 'Guerra', neutral: 'Neutro', alliance: 'Aliança'
}

export function DiplomacyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state       = useGameStore(s => s.state)
  const gameId      = useGameStore(s => s.gameId)
  const updateState = useGameStore(s => s.updateState)
  const token       = useAuthStore(s => s.token)
  const relations   = state ? Object.values(state.relations) : []

  async function act(targetRaceId: string, action: 'DECLARE_WAR' | 'PROPOSE_PEACE') {
    if (!token || !gameId) return
    const { state: newState } = await apiDiplomacy(token, gameId, [{ targetRaceId, action }])
    updateState(newState)
  }

  return (
    <Panel open={open} onClose={onClose} title="🤝 Diplomacia" position="right">
      {relations.length === 0
        ? <p className="text-sm text-white/40">Nenhuma raça conhecida ainda.</p>
        : relations.map(rel => (
          <div key={rel.raceId} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: RACE_LABELS[rel.raceId]?.color ?? '#888' }} />
              <div>
                <div className="font-medium">{RACE_LABELS[rel.raceId]?.name ?? rel.raceId}</div>
                <Badge variant={STATUS_VARIANT[rel.status]} label={STATUS_LABEL[rel.status] ?? rel.status} />
              </div>
            </div>
            <div className="flex gap-1">
              {rel.status !== 'war' && <Button variant="danger"    size="sm" onClick={() => act(rel.raceId, 'DECLARE_WAR')}>⚔️</Button>}
              {rel.status === 'war' && <Button variant="secondary" size="sm" onClick={() => act(rel.raceId, 'PROPOSE_PEACE')}>🕊</Button>}
            </div>
          </div>
        ))
      }
    </Panel>
  )
}
