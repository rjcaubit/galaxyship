import type { TechCategory, RelationStatus } from './enums'

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

// Ratios de produção da colônia (estilo Master of Orion) — somam ~1
export interface ColonyRatios {
  ind:  number   // indústria → fábricas
  eco:  number   // ecologia → crescimento populacional
  tech: number   // pesquisa
  ship: number   // construção de naves
  def:  number   // bases de defesa
}

export interface ColonyData {
  id:            string
  name:          string
  systemId:      string
  planetId:      string
  raceId:        string
  population:    number
  maxPopulation: number
  factories:     number
  bases:         number
  ratios:        ColonyRatios
  shipQueue:     string | null   // ShipKind
  shipProgress:  number
}

export interface FleetData {
  id:             string
  name:           string
  raceId:         string
  systemId:       string         // sistema atual (origem enquanto viaja)
  warships:       number
  colonists:      number         // pods de colonização
  scouts:         number
  attackPerShip:  number
  defensePerShip: number
  // movimento
  destinationId:  string | null
  originSystemId: string | null
  etaTurns:       number         // turnos restantes até chegar (0 = parada)
  etaTotal:       number
}

export interface DiplomacyRelation {
  raceId:         string
  status:         RelationStatus
  treaties:       string[]
  lastActionTurn: number
}

export interface PlayerResources {
  production: number
  research:   number
  food:       number   // saldo de comida (crescimento)
  credits:    number
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  turn:            number
  playerRaceId:    string
  status:          GameStatus
  systems:         Record<string, StarSystemData>
  colonies:        Record<string, ColonyData>
  fleets:          Record<string, FleetData>
  relations:       Record<string, DiplomacyRelation>
  researchedTechs: string[]      // techs do jogador (ex.: "weapons_1")
  activeResearch:  { category: TechCategory; pointsAccumulated: number } | null
  npcTech:         Record<string, number>   // tier global de tech por raça NPC
  resources:       PlayerResources
  exploredSystems: string[]
  fleetSeq:        number         // contador p/ ids de novas frotas
}

export interface CombatLogLine {
  round: number
  text:  string
  type:  'attack' | 'defense' | 'result'
}

export interface CombatResult {
  winner:   string
  loser:    string
  log:      CombatLogLine[]
  systemId: string
}

export type TurnEventType =
  | 'COMBAT' | 'TECH_UNLOCKED' | 'COLONY_FOUNDED' | 'COLONY_CAPTURED'
  | 'FLEET_ARRIVED' | 'SHIP_BUILT' | 'DIPLOMACY' | 'VICTORY' | 'DEFEAT'

export interface TurnEvent {
  type:    TurnEventType
  payload: Record<string, unknown>
}
