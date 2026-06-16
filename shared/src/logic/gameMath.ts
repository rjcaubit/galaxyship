import type { GameState, FleetData, ColonyData, StarSystemData, ColonyRatios } from '../types/game'
import {
  SHIP_SPECS, BASE_SPEED, SCAN_RADIUS, RACE_MODIFIERS, NPC_TIER_COST,
} from './constants'
import { effectsFromTechs } from './techCatalog'

/** Helpers puros e determinísticos compartilhados pelo motor (sem efeitos colaterais de orquestração). */

export function dist(a: StarSystemData, b: StarSystemData): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function raceMod(raceId: string, stat: keyof typeof RACE_MODIFIERS['humans']): number {
  return RACE_MODIFIERS[raceId]?.[stat] ?? 0
}

export function npcTier(points: number): number {
  return Math.min(5, Math.floor(points / NPC_TIER_COST))
}

export function fleetSpeed(state: GameState, raceId: string): number {
  if (raceId === state.playerRaceId) {
    return BASE_SPEED + effectsFromTechs(state.researchedTechs).speedBonus
  }
  return BASE_SPEED + npcTier(state.npcTech[raceId] ?? 0) * 0.03
}

export function estimateEta(state: GameState, fleetId: string, targetSystemId: string): number {
  const fleet = state.fleets[fleetId]
  if (!fleet) return 0
  const from = state.systems[fleet.systemId]
  const to = state.systems[targetSystemId]
  if (!from || !to) return 0
  return Math.max(1, Math.ceil(dist(from, to) / fleetSpeed(state, fleet.raceId)))
}

export function colonyMaxPop(state: GameState, colony: ColonyData): number {
  if (colony.raceId === state.playerRaceId) {
    return Math.round(colony.maxPopulation * effectsFromTechs(state.researchedTechs).maxPopMult)
  }
  return colony.maxPopulation
}

export function normalizeRatios(r: ColonyRatios): ColonyRatios {
  const sum = r.ind + r.eco + r.tech + r.ship + r.def
  if (sum <= 0) return { ind: 0.2, eco: 0.2, tech: 0.2, ship: 0.2, def: 0.2 }
  return { ind: r.ind / sum, eco: r.eco / sum, tech: r.tech / sum, ship: r.ship / sum, def: r.def / sum }
}

export function shipCostFor(state: GameState, raceId: string, kind: string): number {
  const spec = SHIP_SPECS[kind as keyof typeof SHIP_SPECS]
  if (!spec) return Infinity
  const discount = raceId === state.playerRaceId ? effectsFromTechs(state.researchedTechs).shipDiscount : 0
  return Math.round(spec.cost * (1 - discount))
}

export function spawnFleet(state: GameState, raceId: string, systemId: string, kind: string): FleetData {
  const spec = SHIP_SPECS[kind as keyof typeof SHIP_SPECS]
  const id = `fleet_${state.fleetSeq++}`
  const fleet: FleetData = {
    id, name: spec.label, raceId, systemId,
    warships: spec.warships, colonists: spec.colonists, scouts: kind === 'scout' ? 1 : 0,
    attackPerShip: spec.attack, defensePerShip: spec.defense,
    destinationId: null, originSystemId: null, etaTurns: 0, etaTotal: 0,
  }
  state.fleets[id] = fleet
  return fleet
}

export function sizeRank(size: string): number {
  return ({ tiny: 1, small: 2, medium: 3, large: 4, huge: 5 } as Record<string, number>)[size] ?? 3
}
export function sizeMaxPop(size: string): number {
  return ({ tiny: 3, small: 5, medium: 8, large: 12, huge: 16 } as Record<string, number>)[size] ?? 5
}

export function colonyAt(s: GameState, systemId: string, raceId?: string): ColonyData | undefined {
  return Object.values(s.colonies).find(c => c.systemId === systemId && (raceId === undefined || c.raceId === raceId))
}

export function systemIsColonized(s: GameState, systemId: string): boolean {
  return Object.values(s.colonies).some(c => c.systemId === systemId)
}

/**
 * Funda uma colônia no sistema da frota, se possível (frota parada, com colono,
 * sistema não colonizado). Retorna o sistema fundado ou null. Reutilizado por
 * jogador e IA — quem chama decide eventos.
 */
export function tryColonize(s: GameState, fleetId: string): StarSystemData | null {
  const fleet = s.fleets[fleetId]
  if (!fleet || fleet.colonists <= 0 || fleet.etaTurns > 0) return null
  const sys = s.systems[fleet.systemId]
  if (!sys || systemIsColonized(s, sys.id)) return null

  const planet = [...sys.planets].sort((a, b) => sizeRank(b.size) - sizeRank(a.size))[0]
  s.colonies[`colony_${sys.id}`] = {
    id: `colony_${sys.id}`, name: `${sys.name} Colônia`, systemId: sys.id, planetId: planet.id,
    raceId: fleet.raceId, population: 2, maxPopulation: sizeMaxPop(planet.size),
    factories: 0, bases: 0,
    ratios: { ind: 0.4, eco: 0.3, tech: 0.15, ship: 0.1, def: 0.05 },
    shipQueue: null, shipProgress: 0,
  }
  fleet.colonists -= 1
  if (fleet.colonists <= 0 && fleet.warships <= 0 && fleet.scouts <= 0) delete s.fleets[fleetId]
  return sys
}

/** Revela um sistema e vizinhos próximos (só para o jogador). */
export function revealAround(s: GameState, raceId: string, systemId: string) {
  if (raceId !== s.playerRaceId) return
  if (!s.exploredSystems.includes(systemId)) s.exploredSystems.push(systemId)
  const here = s.systems[systemId]
  if (!here) return
  for (const sys of Object.values(s.systems)) {
    if (dist(here, sys) <= SCAN_RADIUS && !s.exploredSystems.includes(sys.id)) {
      s.exploredSystems.push(sys.id)
    }
  }
}

/**
 * Funde frotas militares puras (warships>0, sem colonos/batedores) da mesma raça
 * paradas no mesmo sistema numa única frota. Naves colônia e batedores ficam
 * separados para permitir micro de exploração/colonização. Concentra a força
 * naturalmente e mantém o nº de frotas gerenciável.
 */
export function mergeStationedFleets(s: GameState) {
  const groups: Record<string, FleetData[]> = {}
  for (const f of Object.values(s.fleets)) {
    if (f.etaTurns > 0) continue
    if (f.warships <= 0 || f.colonists > 0 || f.scouts > 0) continue
    ;(groups[`${f.raceId}@${f.systemId}`] ??= []).push(f)
  }
  for (const list of Object.values(groups)) {
    if (list.length < 2) continue
    const base = list[0]
    for (let i = 1; i < list.length; i++) {
      const f = list[i]
      // mantém o maior poder por nave da pilha
      base.attackPerShip = Math.max(base.attackPerShip, f.attackPerShip)
      base.defensePerShip = Math.max(base.defensePerShip, f.defensePerShip)
      base.warships += f.warships
      delete s.fleets[f.id]
    }
    base.name = `Frota (${base.warships})`
  }
}

/** Poder de combate efetivo de uma frota (com bônus de raça e tech). */
export function fleetPower(s: GameState, fleet: FleetData): number {
  if (fleet.warships <= 0) return fleet.scouts * 0.5
  const techAtk = fleet.raceId === s.playerRaceId
    ? effectsFromTechs(s.researchedTechs).attackBonus
    : npcTier(s.npcTech[fleet.raceId] ?? 0) * 3
  const atkMod = 1 + raceMod(fleet.raceId, 'attack')
  return fleet.warships * (fleet.attackPerShip + techAtk) * atkMod
}
