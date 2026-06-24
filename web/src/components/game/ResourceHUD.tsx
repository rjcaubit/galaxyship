import type { PlayerResources } from '@galaxyship/shared'
import { ResourceDisplay } from '../ui'

export function ResourceHUD({ resources }: { resources: PlayerResources }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <ResourceDisplay icon="⚙️" value={resources.production} label="Produção" />
      <ResourceDisplay icon="🔬" value={resources.research}   label="Pesquisa" />
      <ResourceDisplay icon="🌾" value={resources.food}       label="Comida" />
      <ResourceDisplay icon="💰" value={resources.credits}    label="Créditos" />
    </div>
  )
}
