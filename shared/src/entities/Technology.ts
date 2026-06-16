import { Entity, EntityParams } from './Entity'
import type { TechCategory } from '../types/enums'

export interface TechEffect {
  stat:  string
  value: number
  target: 'fleet' | 'colony' | 'global'
}

export interface TechnologyParams extends EntityParams {
  category:      TechCategory
  tier:          number
  cost:          number
  prerequisites: string[]
  effects:       TechEffect[]
  description:   string
}

export interface TechnologyActions {
  isAvailable(researchedTechs: string[]): boolean
  canResearch(researchedTechs: string[]): boolean
  getDescription(): string
}

export abstract class Technology extends Entity implements TechnologyActions {
  readonly category:      TechCategory
  readonly tier:          number
  readonly cost:          number
  readonly prerequisites: string[]
  readonly effects:       TechEffect[]
  readonly description:   string

  constructor(params: TechnologyParams) {
    super(params)
    this.category      = params.category
    this.tier          = params.tier
    this.cost          = params.cost
    this.prerequisites = params.prerequisites
    this.effects       = params.effects
    this.description   = params.description
  }

  isAvailable(researchedTechs: string[]): boolean {
    return this.prerequisites.every(p => researchedTechs.includes(p))
  }

  canResearch(researchedTechs: string[]): boolean {
    return this.isAvailable(researchedTechs) && !researchedTechs.includes(this.id)
  }

  getDescription(): string { return this.description }

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, category: this.category, tier: this.tier,
      cost: this.cost, prerequisites: this.prerequisites, effects: this.effects,
      description: this.description
    }
  }
}
