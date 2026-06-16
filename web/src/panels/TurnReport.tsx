import { useGameStore } from '../store/gameStore'
import { RACE_LABEL, SHIP_LABEL } from '../game/labels'
import { TECH_LABELS } from '@galaxyship/shared'
import type { GameState, TurnEvent } from '@galaxyship/shared'

function describe(ev: TurnEvent, state: GameState): { icon: string; text: string } | null {
  const p = ev.payload as Record<string, unknown>
  const sysName = (id: unknown) => state.systems[id as string]?.name ?? String(id)
  const race = (id: unknown) => RACE_LABEL[id as string]?.name ?? String(id)
  switch (ev.type) {
    case 'FLEET_ARRIVED':   return { icon: '🛰️', text: `Frota chegou a ${sysName(p.systemId)}` }
    case 'COLONY_FOUNDED':  return { icon: '🌍', text: `Colônia fundada em ${p.name ?? sysName(p.systemId)}` }
    case 'COLONY_CAPTURED': return { icon: '⚔️', text: `${race(p.to)} capturou ${sysName(p.systemId)} de ${race(p.from)}` }
    case 'COMBAT':          return { icon: '💥', text: `Batalha em ${sysName(p.systemId)}: vitória de ${race(p.winner)}` }
    case 'TECH_UNLOCKED':   return { icon: '🔬', text: `${TECH_LABELS[p.category as keyof typeof TECH_LABELS]?.label ?? p.category} nível ${p.tier} desbloqueado` }
    case 'SHIP_BUILT':      return { icon: '🚀', text: `${SHIP_LABEL[p.kind as string] ?? 'Nave'} construída em ${sysName(p.systemId)}` }
    default: return null
  }
}

export function TurnReport() {
  const state   = useGameStore(s => s.state)
  const events  = useGameStore(s => s.pendingEvents)
  const setEvents = useGameStore(s => s.setEvents)

  if (!state || state.status !== 'playing') return null
  const items = events.map(e => describe(e, state)).filter(Boolean) as { icon: string; text: string }[]
  if (items.length === 0) return null

  return (
    <div className="absolute top-16 right-3 z-30 w-72 max-w-[80vw] bg-space-mid/95 backdrop-blur border border-white/15 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-semibold text-neon-blue">Relatório do turno</span>
        <button onClick={() => setEvents([])} className="h-6 w-6 rounded hover:bg-white/10 text-white/60">✕</button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        {items.slice(0, 30).map((it, i) => (
          <div key={i} className="flex items-start gap-2 text-sm px-2 py-1">
            <span>{it.icon}</span><span className="text-white/80">{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
