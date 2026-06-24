import { Entity, EntityParams } from './Entity'
import type { BuildingCategory } from '../types/enums'
import type { Colony, ColonyStats } from './Colony'
import type { Planet } from './Planet'

export interface BuildingEffect {
  stat:  keyof ColonyStats
  flat?: number
  pct?:  number
}

export interface BuildingParams extends EntityParams {
  category:        BuildingCategory
  cost:            number
  maintenanceCost: number
  effects:         BuildingEffect[]
  requirements:    { techIds?: string[]; minPopulation?: number }
  description:     string
}

export interface BuildingActions {
  canBuildOn(planet: Planet, colony: Colony, researchedTechs: string[]): boolean
  getEffectOn(colony: Colony): Partial<ColonyStats>
  getDescription(): string
}

export abstract class Building extends Entity implements BuildingActions {
  readonly category:        BuildingCategory
  readonly cost:            number
  readonly maintenanceCost: number
  readonly effects:         BuildingEffect[]
  readonly requirements:    { techIds?: string[]; minPopulation?: number }
  readonly description:     string

  constructor(params: BuildingParams) {
    super(params)
    this.category        = params.category
    this.cost            = params.cost
    this.maintenanceCost = params.maintenanceCost
    this.effects         = params.effects
    this.requirements    = params.requirements
    this.description     = params.description
  }

  canBuildOn(_planet: Planet, colony: Colony, researchedTechs: string[]): boolean {
    const techOk = !this.requirements.techIds ||
      this.requirements.techIds.every(t => researchedTechs.includes(t))
    const popOk = !this.requirements.minPopulation ||
      colony.population >= this.requirements.minPopulation
    return techOk && popOk
  }

  getEffectOn(colony: Colony): Partial<ColonyStats> {
    const result: Partial<ColonyStats> = {}
    for (const e of this.effects) {
      const base = colony.getStats()[e.stat] ?? 0
      result[e.stat] = base + (e.flat ?? 0) + Math.floor(base * (e.pct ?? 0) / 100)
    }
    return result
  }

  getDescription(): string { return this.description }

  serialize(): Record<string, unknown> {
    return { id: this.id, name: this.name, category: this.category, cost: this.cost }
  }
}
