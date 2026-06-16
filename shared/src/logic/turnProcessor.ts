import type { GameState, ColonyData, TurnEvent, ColonyRatios } from '../types/game'
import type { TechCategory } from '../types/enums'
import {
  FACTORY_COST, BASE_COST, FACTORIES_PER_POP, PROD_PER_POP, PROD_PER_FACTORY,
  GROWTH_PER_ECO, BASE_GROWTH,
} from './constants'
import { effectsFromTechs, techCostForTier, tierOf } from './techCatalog'
import {
  raceMod, normalizeRatios, shipCostFor, spawnFleet, colonyAt, colonyMaxPop,
  tryColonize, revealAround, estimateEta, mergeStationedFleets,
} from './gameMath'
import { runAI } from './ai'
import { resolveCombats } from './combat'

// ---------- Ordens ----------
export type Order =
  | { type: 'MOVE_FLEET'; fleetId: string; targetSystemId: string }
  | { type: 'COLONIZE'; fleetId: string }
  | { type: 'SET_RATIOS'; colonySystemId: string; ratios: ColonyRatios }
  | { type: 'SET_SHIP'; colonySystemId: string; kind: string }
  | { type: 'SET_RESEARCH'; category: TechCategory }

export interface DiplomacyAction {
  targetRaceId: string
  action: 'DECLARE_WAR' | 'PROPOSE_PEACE' | 'OFFER_TECH'
}

/**
 * Processa um turno completo. Orquestra os módulos (economia, pesquisa, IA,
 * movimento, combate, fim de jogo). Imutável: clona o estado recebido.
 */
export function processTurn(
  state: GameState,
  orders: Order[],
  diplomacyActions: DiplomacyAction[]
): { newState: GameState; events: TurnEvent[] } {
  const events: TurnEvent[] = []
  const s: GameState = JSON.parse(JSON.stringify(state))
  if (s.status !== 'playing') return { newState: s, events }

  applyOrders(s, orders, events)
  applyDiplomacy(s, diplomacyActions)

  for (const colony of Object.values(s.colonies)) processColony(s, colony, events)

  advancePlayerResearch(s, events)
  runAI(s)
  moveFleets(s, events)
  mergeStationedFleets(s)   // concentra frotas militares que chegaram juntas
  resolveCombats(s, events)
  recomputePlayerResources(s)
  checkEndGame(s, events)

  s.turn += 1
  return { newState: s, events }
}

function applyOrders(s: GameState, orders: Order[], events: TurnEvent[]) {
  for (const order of orders) {
    switch (order.type) {
      case 'MOVE_FLEET': {
        const fleet = s.fleets[order.fleetId]
        if (fleet && fleet.raceId === s.playerRaceId && order.targetSystemId !== fleet.systemId) {
          const eta = estimateEta(s, order.fleetId, order.targetSystemId)
          fleet.originSystemId = fleet.systemId
          fleet.destinationId = order.targetSystemId
          fleet.etaTurns = eta
          fleet.etaTotal = eta
        }
        break
      }
      case 'COLONIZE': {
        const fleet = s.fleets[order.fleetId]
        if (fleet?.raceId === s.playerRaceId) {
          const sys = tryColonize(s, order.fleetId)
          if (sys) {
            revealAround(s, s.playerRaceId, sys.id)
            events.push({ type: 'COLONY_FOUNDED', payload: { systemId: sys.id, name: sys.name } })
          }
        }
        break
      }
      case 'SET_RATIOS': {
        const colony = colonyAt(s, order.colonySystemId, s.playerRaceId)
        if (colony) colony.ratios = normalizeRatios(order.ratios)
        break
      }
      case 'SET_SHIP': {
        const colony = colonyAt(s, order.colonySystemId, s.playerRaceId)
        if (colony) colony.shipQueue = order.kind
        break
      }
      case 'SET_RESEARCH': {
        if (s.activeResearch?.category !== order.category) {
          s.activeResearch = { category: order.category, pointsAccumulated: 0 }
        }
        break
      }
    }
  }
}

function processColony(s: GameState, colony: ColonyData, events: TurnEvent[]) {
  const isPlayer = colony.raceId === s.playerRaceId
  const eff = isPlayer ? effectsFromTechs(s.researchedTechs) : null
  const r = normalizeRatios(colony.ratios)

  const totalProd = (colony.population * PROD_PER_POP + colony.factories * PROD_PER_FACTORY)
    * (1 + raceMod(colony.raceId, 'production'))

  // INDÚSTRIA → fábricas (com teto)
  const factoryCap = colony.maxPopulation * (FACTORIES_PER_POP + (eff?.factoryCapBonus ?? 0))
  if (colony.factories < factoryCap) {
    colony.factories = Math.min(factoryCap, colony.factories + (totalProd * r.ind) / FACTORY_COST)
  }

  // ECOLOGIA → crescimento populacional
  const maxPop = colonyMaxPop(s, colony)
  if (colony.population < maxPop) {
    const growth = (BASE_GROWTH + totalProd * r.eco * GROWTH_PER_ECO) * (1 + raceMod(colony.raceId, 'growth'))
    colony.population = Math.min(maxPop, colony.population + growth)
  }

  // TECNOLOGIA → pesquisa
  const research = totalProd * r.tech * (1 + raceMod(colony.raceId, 'research')) * (eff?.researchMult ?? 1)
  if (isPlayer) {
    if (s.activeResearch) s.activeResearch.pointsAccumulated += research
  } else {
    s.npcTech[colony.raceId] = (s.npcTech[colony.raceId] ?? 0) + research
  }

  // NAVE → construção
  if (colony.shipQueue) {
    colony.shipProgress += totalProd * r.ship
    const cost = shipCostFor(s, colony.raceId, colony.shipQueue)
    if (colony.shipProgress >= cost) {
      colony.shipProgress -= cost
      spawnFleet(s, colony.raceId, colony.systemId, colony.shipQueue)
      if (isPlayer) events.push({ type: 'SHIP_BUILT', payload: { systemId: colony.systemId, kind: colony.shipQueue } })
    }
  }

  // DEFESA → bases (teto 10)
  if (colony.bases < 10) {
    colony.bases = Math.min(10, colony.bases + (totalProd * r.def) / BASE_COST)
  }
}

function advancePlayerResearch(s: GameState, events: TurnEvent[]) {
  if (!s.activeResearch) return
  const cat = s.activeResearch.category
  const tier = tierOf(cat, s.researchedTechs)
  const cost = techCostForTier(tier)
  if (s.activeResearch.pointsAccumulated >= cost && tier < 5) {
    s.activeResearch.pointsAccumulated -= cost
    s.researchedTechs.push(`${cat}_${tier + 1}`)
    events.push({ type: 'TECH_UNLOCKED', payload: { techId: `${cat}_${tier + 1}`, category: cat, tier: tier + 1 } })
  }
}

function moveFleets(s: GameState, events: TurnEvent[]) {
  for (const fleet of Object.values(s.fleets)) {
    if (fleet.etaTurns > 0 && fleet.destinationId) {
      fleet.etaTurns -= 1
      if (fleet.etaTurns <= 0) {
        fleet.systemId = fleet.destinationId
        fleet.destinationId = null
        fleet.originSystemId = null
        fleet.etaTotal = 0
        revealAround(s, fleet.raceId, fleet.systemId)
        if (fleet.raceId === s.playerRaceId) {
          events.push({ type: 'FLEET_ARRIVED', payload: { systemId: fleet.systemId, name: s.systems[fleet.systemId]?.name } })
        }
      }
    }
  }
}

function recomputePlayerResources(s: GameState) {
  let production = 0, research = 0, food = 0, credits = 0
  for (const c of Object.values(s.colonies)) {
    if (c.raceId !== s.playerRaceId) continue
    const r = normalizeRatios(c.ratios)
    const prod = c.population * PROD_PER_POP + c.factories * PROD_PER_FACTORY
    production += Math.round(prod)
    research += Math.round(prod * r.tech)
    food += Math.round(c.population)
    credits += Math.round(c.population)
  }
  s.resources = { production, research, food, credits }
}

function checkEndGame(s: GameState, events: TurnEvent[]) {
  const cols = Object.values(s.colonies)
  const playerCols = cols.filter(c => c.raceId === s.playerRaceId).length
  const enemyCols = cols.filter(c => c.raceId !== s.playerRaceId).length
  const hasColonyShip = Object.values(s.fleets).some(f => f.raceId === s.playerRaceId && f.colonists > 0)
  if (playerCols === 0 && !hasColonyShip) {
    s.status = 'lost'
    events.push({ type: 'DEFEAT', payload: {} })
  } else if (enemyCols === 0 && playerCols > 0) {
    s.status = 'won'
    events.push({ type: 'VICTORY', payload: { turn: s.turn } })
  }
}

/** Diplomacia isolada — aplica relações sem avançar o turno. */
export function applyDiplomacy(s: GameState, diplomacyActions: DiplomacyAction[]) {
  for (const da of diplomacyActions) {
    const rel = s.relations[da.targetRaceId]
    if (!rel) continue
    if (da.action === 'DECLARE_WAR') rel.status = 'war'
    if (da.action === 'PROPOSE_PEACE') rel.status = 'peace'
    rel.lastActionTurn = s.turn
  }
}
