import { Entity, EntityParams } from './Entity'

export interface ColonyParams extends EntityParams {
  systemId:   string
  raceId:     string
  population: number
  buildings:  string[]   // building ids
  buildQueue: string | null
  buildProgress: number
}

export interface ColonyStats {
  production: number
  research:   number
  food:       number
  growth:     number
}

export interface ColonyActions {
  getStats(): ColonyStats
  growthPerTurn(): number
  productionPerTurn(): number
  addBuilding(buildingId: string): void
}

export abstract class Colony extends Entity implements ColonyActions {
  systemId:      string
  raceId:        string
  population:    number
  buildings:     string[]
  buildQueue:    string | null
  buildProgress: number

  constructor(params: ColonyParams) {
    super(params)
    this.systemId      = params.systemId
    this.raceId        = params.raceId
    this.population    = params.population
    this.buildings     = params.buildings
    this.buildQueue    = params.buildQueue
    this.buildProgress = params.buildProgress
  }

  abstract getStats(): ColonyStats
  abstract growthPerTurn(): number
  abstract productionPerTurn(): number

  addBuilding(buildingId: string): void {
    if (!this.buildings.includes(buildingId)) {
      this.buildings.push(buildingId)
    }
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, systemId: this.systemId,
      raceId: this.raceId, population: this.population,
      buildings: this.buildings, buildQueue: this.buildQueue, buildProgress: this.buildProgress
    }
  }
}
