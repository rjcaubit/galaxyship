import { Entity, EntityParams } from './Entity'
import type { StarType } from '../types/enums'
import type { Fleet } from './Fleet'

export interface StarSystemParams extends EntityParams {
  x:        number   // 0-1 normalizado
  y:        number
  starType: StarType
  wormholeToId?: string
}

export interface StarSystemActions {
  isExplored(byRaceId: string, exploredIds: string[]): boolean
  isColonized(colonies: Record<string, { systemId: string }>): boolean
  getColonizerRaceId(colonies: Record<string, { systemId: string; raceId: string }>): string | null
  distanceTo(other: StarSystem): number
  canBeReachedBy(fleet: Fleet, range: number): boolean
}

export abstract class StarSystem extends Entity implements StarSystemActions {
  readonly x:        number
  readonly y:        number
  readonly starType: StarType
  readonly wormholeToId?: string

  constructor(params: StarSystemParams) {
    super(params)
    this.x           = params.x
    this.y           = params.y
    this.starType    = params.starType
    this.wormholeToId = params.wormholeToId
  }

  distanceTo(other: StarSystem): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2)
  }

  isExplored(_byRaceId: string, exploredIds: string[]): boolean {
    return exploredIds.includes(this.id)
  }

  isColonized(colonies: Record<string, { systemId: string }>): boolean {
    return Object.values(colonies).some(c => c.systemId === this.id)
  }

  getColonizerRaceId(colonies: Record<string, { systemId: string; raceId: string }>): string | null {
    const col = Object.values(colonies).find(c => c.systemId === this.id)
    return col?.raceId ?? null
  }

  abstract canBeReachedBy(fleet: Fleet, range: number): boolean

  serialize(): Record<string, unknown> {
    return { id: this.id, name: this.name, x: this.x, y: this.y, starType: this.starType }
  }
}
