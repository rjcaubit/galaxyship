import { useState, useEffect } from 'react'
import { Panel, Button, EmptyState, ProgressBar } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { SHIP_LABEL } from '../game/labels'
import { SHIP_SPECS } from '@galaxyship/shared'

const RATIO_DEFS = [
  { key: 'ind',  label: 'Indústria',  icon: '🏗️', color: 'bg-neon-gold',   hint: 'Constrói fábricas (mais produção)' },
  { key: 'eco',  label: 'Ecologia',   icon: '🌱', color: 'bg-neon-green',  hint: 'Crescimento populacional' },
  { key: 'tech', label: 'Pesquisa',   icon: '🔬', color: 'bg-neon-blue',   hint: 'Pontos de tecnologia' },
  { key: 'ship', label: 'Naves',      icon: '🚀', color: 'bg-neon-purple', hint: 'Constrói a nave da fila' },
  { key: 'def',  label: 'Defesa',     icon: '🛡️', color: 'bg-neon-red',    hint: 'Bases de mísseis' },
] as const

type RatioKey = typeof RATIO_DEFS[number]['key']

export function ColonyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state          = useGameStore(s => s.state)
  const selectedSystem = useGameStore(s => s.selectedSystem)
  const addOrder       = useGameStore(s => s.addOrder)

  const colony = selectedSystem && state
    ? Object.values(state.colonies).find(c => c.systemId === selectedSystem && c.raceId === state.playerRaceId)
    : null

  // sliders em 0-100; normalizados ao enviar
  const [vals, setVals] = useState<Record<RatioKey, number>>({ ind: 30, eco: 25, tech: 20, ship: 15, def: 10 })
  useEffect(() => {
    if (colony) setVals({
      ind: Math.round(colony.ratios.ind * 100), eco: Math.round(colony.ratios.eco * 100),
      tech: Math.round(colony.ratios.tech * 100), ship: Math.round(colony.ratios.ship * 100),
      def: Math.round(colony.ratios.def * 100),
    })
  }, [colony?.systemId])

  if (!colony || !state) {
    return <Panel open={open} onClose={onClose} title="Colônia" position="bottom">
      <EmptyState title="Nenhuma colônia" description="Selecione uma colônia sua" icon="🏙️" />
    </Panel>
  }

  const weaponsTier = state.researchedTechs.filter(t => t.startsWith('weapons_')).length
  const total = RATIO_DEFS.reduce((a, d) => a + vals[d.key], 0) || 1

  function setRatio(key: RatioKey, v: number) {
    const next = { ...vals, [key]: v }
    setVals(next)
    const sum = RATIO_DEFS.reduce((a, d) => a + next[d.key], 0) || 1
    addOrder({ type: 'SET_RATIOS', colonySystemId: colony!.systemId, ratios: {
      ind: next.ind / sum, eco: next.eco / sum, tech: next.tech / sum, ship: next.ship / sum, def: next.def / sum,
    } })
  }
  function setShip(kind: string) {
    addOrder({ type: 'SET_SHIP', colonySystemId: colony!.systemId, kind })
  }

  const shipCost = colony.shipQueue ? SHIP_SPECS[colony.shipQueue as keyof typeof SHIP_SPECS]?.cost ?? 1 : 1

  return (
    <Panel open={open} onClose={onClose} title={`🏙️ ${colony.name}`} position="bottom">
      {/* Stats topo */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <Stat label="População" value={`${Math.floor(colony.population)} / ${colony.maxPopulation}`} />
        <Stat label="Fábricas" value={Math.floor(colony.factories)} />
        <Stat label="Bases" value={Math.floor(colony.bases)} />
      </div>

      {/* Sliders de produção */}
      <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Divisão da produção</p>
      <div className="space-y-2.5 mb-4">
        {RATIO_DEFS.map(d => (
          <div key={d.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5">{d.icon} {d.label}</span>
              <span className="text-white/50 text-xs">{Math.round((vals[d.key] / total) * 100)}%</span>
            </div>
            <input type="range" min={0} max={100} value={vals[d.key]}
              onChange={e => setRatio(d.key, Number(e.target.value))}
              className="w-full h-2 accent-neon-blue cursor-pointer"
              aria-label={d.label} />
          </div>
        ))}
      </div>

      {/* Construção de nave */}
      <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Construir nave</p>
      <div className="flex gap-2 flex-wrap mb-3">
        {(['scout', 'colony', 'frigate', 'destroyer'] as const).map(kind => {
          const locked = kind === 'destroyer' && weaponsTier < 2
          const active = colony.shipQueue === kind
          return (
            <button key={kind} disabled={locked} onClick={() => setShip(kind)}
              className={`px-3 h-10 rounded-lg text-sm border transition-colors
                ${active ? 'bg-neon-blue text-space-dark border-neon-blue font-semibold'
                  : locked ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                  : 'bg-space-dark text-white/80 border-white/15 hover:border-neon-blue'}`}>
              {locked ? '🔒 ' : ''}{SHIP_LABEL[kind]}
            </button>
          )
        })}
      </div>
      {colony.shipQueue && (
        <ProgressBar value={(colony.shipProgress / shipCost) * 100}
          label={`Construindo ${SHIP_LABEL[colony.shipQueue]}`} color="bg-neon-purple" />
      )}
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-space-dark rounded-lg py-2">
      <div className="font-bold text-neon-blue">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}
