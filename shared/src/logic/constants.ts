import type { PlanetSize } from '../types/enums'

// ---- Naves construíveis ----
export type ShipKind = 'scout' | 'colony' | 'frigate' | 'destroyer'

export interface ShipSpec {
  kind:      ShipKind
  label:     string
  cost:      number   // pontos de produção (modificado por tech de construção)
  warships:  number   // capacidade de combate (0 = não combate)
  colonists: number   // pods de colonização
  attack:    number
  defense:   number
  minWeaponsTier?: number  // requer tier de armas p/ destrava
}

export const SHIP_SPECS: Record<ShipKind, ShipSpec> = {
  scout:     { kind: 'scout',     label: 'Batedor',     cost: 20,  warships: 0, colonists: 0, attack: 1,  defense: 1 },
  colony:    { kind: 'colony',    label: 'Nave Colônia', cost: 60,  warships: 0, colonists: 1, attack: 0,  defense: 1 },
  frigate:   { kind: 'frigate',   label: 'Fragata',     cost: 45,  warships: 1, colonists: 0, attack: 6,  defense: 5 },
  destroyer: { kind: 'destroyer', label: 'Destróier',   cost: 110, warships: 1, colonists: 0, attack: 16, defense: 12, minWeaponsTier: 2 },
}

// ---- Economia de colônia ----
export const FACTORY_COST = 5          // produção por fábrica
export const BASE_COST    = 25         // produção por base de mísseis
export const FACTORIES_PER_POP = 2     // teto base de fábricas por pop (× tech construção)
export const PROD_PER_POP = 1
export const PROD_PER_FACTORY = 1
export const GROWTH_PER_ECO = 0.5      // pop ganha por ponto de eco
export const BASE_GROWTH = 0.3         // crescimento mínimo por turno

export const SIZE_MAX_POP: Record<PlanetSize, number> = {
  tiny: 3, small: 5, medium: 8, large: 12, huge: 16
}

// ---- Movimento ----
export const BASE_SPEED = 0.12         // unidades normalizadas por turno (× tech propulsão)
export const SCAN_RADIUS = 0.20        // raio de revelação ao chegar num sistema

// ---- Tecnologia ----
export const TECH_TIER_COST = [60, 140, 280, 480, 750]  // custo cumulativo por tier (0-indexed)
export const TECH_MAX_TIER = 5

// efeitos por tier (multiplicados pelo nº de tiers pesquisados na categoria)
export const TECH_EFFECTS = {
  weaponsAtkPerTier:    3,
  defenseDefPerTier:    3,
  propulsionSpeedPerTier: 0.04,
  constructionFactoryCapPerTier: 0.5,
  constructionShipDiscountPerTier: 0.08,  // -8% custo de nave por tier
  computersResearchPerTier: 0.12,         // +12% pesquisa por tier
  biologyMaxPopPerTier: 0.12,             // +12% pop máx por tier
}

// ---- IA ----
export const NPC_TIER_COST = 160         // pontos de pesquisa NPC por tier de combate
export const AI_MIN_WARSHIPS_TO_ATTACK = 5   // estoca uma frota antes de atacar (sem rush precoce)

// ---- Modificadores por raça (frações; espelham as classes Race) ----
export interface RaceModifier {
  production: number; research: number; growth: number
  attack: number; defense: number; diplomacy: number
}
export const RACE_MODIFIERS: Record<string, RaceModifier> = {
  humans: { production: 0,    research: -0.10, growth: 0.10, attack: 0,     defense: 0,    diplomacy: 0.25 },
  zorg:   { production: 0.10, research: -0.10, growth: 0,    attack: 0.30,  defense: 0.20, diplomacy: -0.30 },
  sylar:  { production: -0.10, research: 0.30, growth: 0.20, attack: -0.20, defense: 0,    diplomacy: 0.10 },
}

// ---- Personalidade de IA por raça ----
export type AiPersona = 'aggressive' | 'expansionist' | 'balanced'
export const RACE_AI_PERSONA: Record<string, AiPersona> = {
  zorg:  'aggressive',
  sylar: 'expansionist',
  humans: 'balanced',
}
