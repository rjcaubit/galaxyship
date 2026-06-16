import type { TechCategory } from '../types/enums'
import { TECH_TIER_COST, TECH_EFFECTS, TECH_MAX_TIER } from './constants'

export const TECH_CATEGORIES: TechCategory[] = [
  'weapons', 'defense', 'propulsion', 'construction', 'computers', 'biology'
]

export const TECH_LABELS: Record<TechCategory, { label: string; icon: string }> = {
  weapons:      { label: 'Armas',        icon: '⚔️' },
  defense:      { label: 'Defesa',       icon: '🛡️' },
  propulsion:   { label: 'Propulsão',    icon: '🚀' },
  construction: { label: 'Construção',   icon: '🏗️' },
  computers:    { label: 'Computadores', icon: '💻' },
  biology:      { label: 'Biologia',     icon: '🧬' },
}

// nomes dos níveis por categoria (1-indexed por tier)
export const TECH_NAMES: Record<TechCategory, string[]> = {
  weapons:      ['Laser', 'Canhão Iônico', 'Míssil de Fusão', 'Disruptor', 'Aniquilador'],
  defense:      ['Escudo I', 'Blindagem', 'Escudo II', 'Campo de Força', 'Couraça Neutrônica'],
  propulsion:   ['Motor Iônico', 'Hiperdrive', 'Dobra 2', 'Dobra 3', 'Portal Estelar'],
  construction: ['Robótica', 'Automação', 'Nanofábricas', 'Replicadores', 'Construção Atômica'],
  computers:    ['Rede Neural', 'IA Tática', 'Supercomputador', 'Matriz Quântica', 'Mente Coletiva'],
  biology:      ['Hidropônica', 'Terraformação', 'Clonagem', 'Gaia', 'Eden'],
}

/** Custo (pontos de pesquisa) para alcançar o próximo tier a partir do tier atual. */
export function techCostForTier(tier: number): number {
  if (tier >= TECH_MAX_TIER) return Infinity
  return TECH_TIER_COST[tier]
}

/** Tier pesquisado de uma categoria a partir da lista de techs do jogador. */
export function tierOf(category: TechCategory, researchedTechs: string[]): number {
  return researchedTechs.filter(t => t.startsWith(category + '_')).length
}

export interface TechEffects {
  attackBonus:     number   // + por nave de combate
  defenseBonus:    number
  speedBonus:      number
  factoryCapBonus: number   // + fábricas por pop
  shipDiscount:    number   // 0..~0.4 fração de desconto
  researchMult:    number   // multiplicador (1.0 = sem bônus)
  maxPopMult:      number
  weaponsTier:     number
}

/** Agrega os efeitos de todas as techs pesquisadas de uma raça. */
export function effectsFromTechs(researchedTechs: string[]): TechEffects {
  const w = tierOf('weapons', researchedTechs)
  const d = tierOf('defense', researchedTechs)
  const p = tierOf('propulsion', researchedTechs)
  const c = tierOf('construction', researchedTechs)
  const k = tierOf('computers', researchedTechs)
  const b = tierOf('biology', researchedTechs)
  return {
    attackBonus:     w * TECH_EFFECTS.weaponsAtkPerTier,
    defenseBonus:    d * TECH_EFFECTS.defenseDefPerTier,
    speedBonus:      p * TECH_EFFECTS.propulsionSpeedPerTier,
    factoryCapBonus: c * TECH_EFFECTS.constructionFactoryCapPerTier,
    shipDiscount:    Math.min(0.5, c * TECH_EFFECTS.constructionShipDiscountPerTier),
    researchMult:    1 + k * TECH_EFFECTS.computersResearchPerTier,
    maxPopMult:      1 + b * TECH_EFFECTS.biologyMaxPopPerTier,
    weaponsTier:     w,
  }
}
