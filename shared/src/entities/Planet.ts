import { Entity, EntityParams } from './Entity'
import type { Race } from './Race'
import type { PlanetType, PlanetSize, Richness, Gravity, BuildingCategory } from '../types/enums'

export interface PlanetParams extends EntityParams {
  systemId:  string
  type:      PlanetType
  size:      PlanetSize
  richness:  Richness
  gravity:   Gravity
  radiation: number   // 0-100
}

export interface PlanetActions {
  canColonize(race: Race): boolean
  colonizationCost(race: Race): number
  getMaxPopulation(race: Race): number
  getBaseProduction(): number
  getBaseResearch(): number
  getBaseFood(): number
  canBuild(buildingCategory: BuildingCategory): boolean
}

export abstract class Planet extends Entity implements PlanetActions {
  readonly systemId:  string
  readonly type:      PlanetType
  readonly size:      PlanetSize
  readonly richness:  Richness
  readonly gravity:   Gravity
  readonly radiation: number

  protected static readonly SIZE_POP: Record<PlanetSize, number> = {
    tiny: 2, small: 4, medium: 6, large: 8, huge: 10
  }
  protected static readonly RICH_PROD: Record<Richness, number> = {
    ultra_poor: 1, poor: 2, abundant: 4, rich: 6, ultra_rich: 8
  }

  constructor(params: PlanetParams) {
    super(params)
    this.systemId  = params.systemId
    this.type      = params.type
    this.size      = params.size
    this.richness  = params.richness
    this.gravity   = params.gravity
    this.radiation = params.radiation
  }

  getBaseProduction(): number { return Planet.RICH_PROD[this.richness] }
  getBaseResearch():   number { return this.type === 'dead' ? 0 : 2 }
  getBaseFood():       number { return this.type === 'terran' ? 4 : this.type === 'ocean' ? 5 : 1 }

  abstract canColonize(race: Race): boolean
  abstract colonizationCost(race: Race): number
  abstract getMaxPopulation(race: Race): number
  abstract canBuild(buildingCategory: BuildingCategory): boolean

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, systemId: this.systemId,
      type: this.type, size: this.size, richness: this.richness,
      gravity: this.gravity, radiation: this.radiation
    }
  }
}
