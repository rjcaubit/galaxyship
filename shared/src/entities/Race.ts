import { Entity, EntityParams } from './Entity'
import type { Planet } from './Planet'
import type { StatKey, TraitKey } from '../types/enums'

export interface RaceParams extends EntityParams {
  description: string
  bonuses:     Partial<Record<StatKey, number>>
  penalties:   Partial<Record<StatKey, number>>
  traits:      TraitKey[]
  color:       string
  homeSystemId?: string
}

export interface RaceActions {
  canDiplomatize(other: Race): boolean
  getDiplomacyModifier(other: Race): number
  canColonizePlanet(planet: Planet): boolean
  getProductionBonus(): number
  getResearchBonus(): number
  getGrowthBonus(): number
}

export abstract class Race extends Entity implements RaceActions {
  readonly description: string
  readonly bonuses:     Partial<Record<StatKey, number>>
  readonly penalties:   Partial<Record<StatKey, number>>
  readonly traits:      TraitKey[]
  readonly color:       string
  homeSystemId?: string

  constructor(params: RaceParams) {
    super(params)
    this.description  = params.description
    this.bonuses      = params.bonuses
    this.penalties    = params.penalties
    this.traits       = params.traits
    this.color        = params.color
    this.homeSystemId = params.homeSystemId
  }

  getProductionBonus(): number { return this.bonuses.production ?? 0 }
  getResearchBonus():   number { return this.bonuses.research   ?? 0 }
  getGrowthBonus():     number { return this.bonuses.growth     ?? 0 }

  abstract canDiplomatize(other: Race): boolean
  abstract getDiplomacyModifier(other: Race): number
  abstract canColonizePlanet(planet: Planet): boolean

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, description: this.description,
      bonuses: this.bonuses, penalties: this.penalties,
      traits: this.traits, color: this.color, homeSystemId: this.homeSystemId
    }
  }
}
