import { Panel } from '../components/ui'
import { LockedFeature } from '../components/game'
import { useGameStore } from '../store/gameStore'

const TECH_CATEGORIES = ['weapons', 'defense', 'propulsion', 'construction', 'computers', 'biology'] as const
const CATEGORY_ICONS: Record<string, string> = {
  weapons: '⚔️', defense: '🛡️', propulsion: '🚀', construction: '🏗️', computers: '💻', biology: '🧬'
}
const CATEGORY_LABELS: Record<string, string> = {
  weapons: 'Armas', defense: 'Defesa', propulsion: 'Propulsão',
  construction: 'Construção', computers: 'Computadores', biology: 'Biologia'
}

export function TechTreePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore(s => s.state)

  return (
    <Panel open={open} onClose={onClose} title="🔬 Árvore de Tecnologias" position="right">
      <p className="text-sm text-white/40 mb-4">
        Pesquisa ativa: <span className="text-neon-blue">{state?.activeResearch?.category ?? 'Nenhuma'}</span>
      </p>
      <div className="space-y-3">
        {TECH_CATEGORIES.map(cat => (
          <div key={cat} className="bg-space-dark rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
              {state?.activeResearch?.category === cat && (
                <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full">Pesquisando</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5].map(tier => (
                <LockedFeature key={tier} label={`Nível ${tier}`}>
                  <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-xs text-white/40">{tier}</div>
                </LockedFeature>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
