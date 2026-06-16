import { Panel, ProgressBar, Badge } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { TECH_CATEGORIES, TECH_LABELS, TECH_NAMES, tierOf, techCostForTier } from '@galaxyship/shared'

export function TechTreePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state    = useGameStore(s => s.state)
  const orders   = useGameStore(s => s.orders)
  const addOrder = useGameStore(s => s.addOrder)

  const pendingResearch = orders.find(o => o.type === 'SET_RESEARCH') as { category: string } | undefined
  const activeCategory = pendingResearch?.category ?? state?.activeResearch?.category ?? null

  return (
    <Panel open={open} onClose={onClose} title="🔬 Tecnologia" position="right">
      <p className="text-sm text-white/40 mb-4">Escolha uma área para pesquisar. Os pontos vêm do ratio <b>Pesquisa</b> das colônias.</p>
      <div className="space-y-3">
        {TECH_CATEGORIES.map(cat => {
          const tier = state ? tierOf(cat, state.researchedTechs) : 0
          const meta = TECH_LABELS[cat]
          const isActive = activeCategory === cat
          const nextName = tier < 5 ? TECH_NAMES[cat][tier] : null
          const cost = techCostForTier(tier)
          const points = isActive ? (state?.activeResearch?.pointsAccumulated ?? 0) : 0
          return (
            <button key={cat} onClick={() => addOrder({ type: 'SET_RESEARCH', category: cat })}
              className={`w-full text-left rounded-xl p-3 border transition-colors
                ${isActive ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-space-dark hover:border-white/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-semibold">{meta.icon} {meta.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Nível {tier}/5</span>
                  {isActive && <Badge variant="info" label="Pesquisando" />}
                </div>
              </div>
              {/* pips de tier */}
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < tier ? 'bg-neon-blue' : 'bg-white/10'}`} />
                ))}
              </div>
              {nextName
                ? <p className="text-xs text-white/50">Próximo: <span className="text-white/80">{nextName}</span> ({cost} pts)</p>
                : <p className="text-xs text-neon-green">Máximo alcançado ✓</p>}
              {isActive && nextName && (
                <div className="mt-2"><ProgressBar value={(points / cost) * 100} color="bg-neon-blue" /></div>
              )}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
