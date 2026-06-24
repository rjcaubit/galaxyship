import { Entity, EntityParams } from './Entity'
import type { OrderType } from '../types/enums'

export interface FleetParams extends EntityParams {
  raceId:      string
  systemId:    string
  shipCount:   number
  attackPower: number
  defensePower: number
  hasColonist: boolean
  orderType:   OrderType | null
  orderTarget: string | null
}

export interface FleetActions {
  canMoveTo(targetSystemId: string, distance: number, range: number): boolean
  movementRange(): number
  totalAttackPower(): number
  totalDefensePower(): number
  canColonize(): boolean
}

export abstract class Fleet extends Entity implements FleetActions {
  raceId:       string
  systemId:     string
  shipCount:    number
  attackPower:  number
  defensePower: number
  hasColonist:  boolean
  orderType:    OrderType | null
  orderTarget:  string | null

  constructor(params: FleetParams) {
    super(params)
    this.raceId       = params.raceId
    this.systemId     = params.systemId
    this.shipCount    = params.shipCount
    this.attackPower  = params.attackPower
    this.defensePower = params.defensePower
    this.hasColonist  = params.hasColonist
    this.orderType    = params.orderType
    this.orderTarget  = params.orderTarget
  }

  totalAttackPower():  number { return this.attackPower * this.shipCount }
  totalDefensePower(): number { return this.defensePower * this.shipCount }
  canColonize(): boolean      { return this.hasColonist && this.shipCount > 0 }

  abstract canMoveTo(targetSystemId: string, distance: number, range: number): boolean
  abstract movementRange(): number

  serialize(): Record<string, unknown> {
    return {
      id: this.id, name: this.name, raceId: this.raceId,
      systemId: this.systemId, shipCount: this.shipCount,
      attackPower: this.attackPower, defensePower: this.defensePower,
      hasColonist: this.hasColonist, orderType: this.orderType, orderTarget: this.orderTarget
    }
  }
}
