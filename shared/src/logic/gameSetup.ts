import { generateGalaxy } from './galaxyGenerator'
import { SIZE_MAX_POP } from './constants'
import type { GameState, FleetData, ColonyData, DiplomacyRelation, StarSystemData, PlanetData, ColonyRatios } from '../types/game'
import type { PlanetSize } from '../types/enums'

const ALL_RACES = ['humans', 'zorg', 'sylar']

const DEFAULT_RATIOS: ColonyRatios = { ind: 0.35, eco: 0.25, tech: 0.20, ship: 0.15, def: 0.05 }

function bestPlanet(sys: StarSystemData): PlanetData {
  // prioriza planetas habitáveis maiores
  const order: Record<string, number> = { terran: 5, ocean: 4, desert: 3, frozen: 2, volcanic: 1, dead: 0, gas_giant: -1 }
  return [...sys.planets].sort((a, b) =>
    (order[b.type] ?? 0) - (order[a.type] ?? 0) ||
    (SIZE_MAX_POP[b.size as PlanetSize] ?? 0) - (SIZE_MAX_POP[a.size as PlanetSize] ?? 0)
  )[0]
}

function maxPopOf(planet: PlanetData): number {
  return SIZE_MAX_POP[planet.size as PlanetSize] ?? 5
}

function makeColony(raceId: string, sys: StarSystemData, pop: number): ColonyData {
  const planet = bestPlanet(sys)
  return {
    id: `colony_${sys.id}`,
    name: `${sys.name} Prime`,
    systemId: sys.id,
    planetId: planet.id,
    raceId,
    population: pop,
    maxPopulation: maxPopOf(planet),
    factories: 0,
    bases: 0,
    ratios: { ...DEFAULT_RATIOS },
    shipQueue: null,
    shipProgress: 0,
  }
}

/**
 * Estado inicial — galáxia + colônia/frotas para o jogador e cada NPC.
 * Os lares são espalhados (jogador no início da lista, NPCs nas pontas).
 */
export function createInitialState(raceId: string, seed: number): GameState {
  const systems = generateGalaxy(seed)
  const systemIds = Object.keys(systems)

  const npcRaces = ALL_RACES.filter(r => r !== raceId)

  // lares espalhados: jogador no índice 0, NPCs nas extremidades
  const homeIds: Record<string, string> = { [raceId]: systemIds[0] }
  npcRaces.forEach((npc, i) => {
    homeIds[npc] = systemIds[systemIds.length - 1 - i]
  })

  const colonies: Record<string, ColonyData> = {}
  const fleets:   Record<string, FleetData>  = {}
  let fleetSeq = 0

  const mkFleet = (f: Partial<FleetData> & { raceId: string; systemId: string }): FleetData => ({
    id: `fleet_${fleetSeq++}`,
    name: 'Frota',
    warships: 0, colonists: 0, scouts: 0,
    attackPerShip: 6, defensePerShip: 5,
    destinationId: null, originSystemId: null, etaTurns: 0, etaTotal: 0,
    ...f,
  })

  for (const race of [raceId, ...npcRaces]) {
    const homeSys = systems[homeIds[race]]
    colonies[`colony_${homeSys.id}`] = makeColony(race, homeSys, 4)
  }

  // Frotas do jogador: nave colônia + batedor + fragata (paridade com NPC + batedor de bônus)
  const pHome = homeIds[raceId]
  fleets[`fleet_${fleetSeq}`] = mkFleet({ raceId, systemId: pHome, name: 'Nave Colônia', colonists: 1 })
  fleetSeq++
  fleets[`fleet_${fleetSeq}`] = mkFleet({ raceId, systemId: pHome, name: 'Batedor', scouts: 1, attackPerShip: 1, defensePerShip: 1 })
  fleetSeq++
  fleets[`fleet_${fleetSeq}`] = mkFleet({ raceId, systemId: pHome, name: 'Fragata', warships: 1 })
  fleetSeq++

  // Cada NPC começa com 1 nave colônia + 1 fragata
  for (const npc of npcRaces) {
    const h = homeIds[npc]
    fleets[`fleet_${fleetSeq}`] = mkFleet({ raceId: npc, systemId: h, name: 'Colônia', colonists: 1 }); fleetSeq++
    fleets[`fleet_${fleetSeq}`] = mkFleet({ raceId: npc, systemId: h, name: 'Fragata', warships: 1 }); fleetSeq++
  }

  const relations: Record<string, DiplomacyRelation> = {}
  for (const npc of npcRaces) {
    relations[npc] = { raceId: npc, status: 'neutral', treaties: [], lastActionTurn: 0 }
  }

  const npcTech: Record<string, number> = {}
  for (const npc of npcRaces) npcTech[npc] = 0

  return {
    turn: 1,
    playerRaceId: raceId,
    status: 'playing',
    systems,
    colonies,
    fleets,
    relations,
    researchedTechs: [],
    activeResearch: null,
    npcTech,
    resources: { production: 0, research: 0, food: 0, credits: 50 },
    exploredSystems: [pHome],
    fleetSeq,
  }
}
