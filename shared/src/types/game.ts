import type { TechCategory, RelationStatus, OrderType } from './enums'

export interface ColonyData {
  id:            string
  name:          string
  systemId:      string
  raceId:        string
  population:    number
  buildings:     string[]
  buildQueue:    string | null
  buildProgress: number
}

export interface FleetData {
  id:           string
  name:         string
  raceId:       string
  systemId:     string
  shipCount:    number
  attackPower:  number
  defensePower: number
  hasColonist:  boolean
  orderType:    OrderType | null
  orderTarget:  string | null
}

export interface PlanetData {
  id:        string
  name:      string
  type:      string
  size:      string
  richness:  string
  gravity:   string
  radiation: number
}

export interface StarSystemData {
  id:       string
  name:     string
  x:        number
  y:        number
  starType: string
  planets:  PlanetData[]
}

export interface DiplomacyRelation {
  raceId:        string
  status:        RelationStatus
  treaties:      string[]
  lastActionTurn: number
}

export interface PlayerResources {
  production: number
  research:   number
  food:       number
  credits:    number
}

export interface GameState {
  turn:            number
  playerRaceId:    string
  systems:         Record<string, StarSystemData>
  colonies:        Record<string, ColonyData>
  fleets:          Record<string, FleetData>
  relations:       Record<string, DiplomacyRelation>
  researchedTechs: string[]
  activeResearch:  { category: TechCategory; pointsAccumulated: number } | null
  resources:       PlayerResources
  exploredSystems: string[]
}

export interface CombatLogLine {
  round:   number
  text:    string
  type:    'attack' | 'defense' | 'result'
}

export interface CombatResult {
  winner:    string    // raceId
  loser:     string
  log:       CombatLogLine[]
  systemId:  string
}

export interface TurnEvent {
  type:     'COMBAT' | 'TECH_UNLOCKED' | 'COLONY_FOUNDED' | 'DIPLOMACY'
  payload:  Record<string, unknown>
}
