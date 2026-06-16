import type { GameState, FleetData, ColonyData, StarSystemData, ColonyRatios } from '../types/game'
import { RACE_AI_PERSONA, AI_MIN_WARSHIPS_TO_ATTACK, type AiPersona } from './constants'
import {
  dist, estimateEta, npcTier, colonyAt, systemIsColonized, tryColonize, revealAround,
} from './gameMath'

// Perfis de produção por personalidade
const RATIOS_BY_PERSONA: Record<AiPersona, ColonyRatios> = {
  expansionist: { ind: 0.30, eco: 0.25, tech: 0.25, ship: 0.20, def: 0.00 },
  aggressive:   { ind: 0.30, eco: 0.20, tech: 0.10, ship: 0.30, def: 0.10 },
  balanced:     { ind: 0.30, eco: 0.25, tech: 0.20, ship: 0.20, def: 0.05 },
}

// Alvo de nº de colônias antes de priorizar guerra
const COLONY_TARGET: Record<AiPersona, number> = { expansionist: 6, aggressive: 3, balanced: 4 }

/** Decisões de todas as raças NPC neste turno. */
export function runAI(s: GameState) {
  const npcRaces = [...new Set(Object.values(s.colonies).map(c => c.raceId).concat(
    Object.values(s.fleets).map(f => f.raceId)
  ))].filter(r => r !== s.playerRaceId)

  for (const race of npcRaces) {
    const persona = RACE_AI_PERSONA[race] ?? 'balanced'
    const myColonies = Object.values(s.colonies).filter(c => c.raceId === race)
    const myFleets = Object.values(s.fleets).filter(f => f.raceId === race)
    const colonyShipsInFlight = myFleets.filter(f => f.colonists > 0).length
    const reach = myColonies.length + colonyShipsInFlight

    manageColonies(s, race, persona, myColonies, reach)
    manageFleets(s, race, persona, myFleets)
  }
}

function manageColonies(s: GameState, race: string, persona: AiPersona, colonies: ColonyData[], reach: number) {
  const wantColony = reach < COLONY_TARGET[persona]
  const warship = npcTier(s.npcTech[race] ?? 0) >= 2 ? 'destroyer' : 'frigate'

  colonies.forEach((colony, idx) => {
    colony.ratios = { ...RATIOS_BY_PERSONA[persona] }
    // A primeira colônia foca expansão; as demais alternam guerra/colônia
    if (wantColony && idx % 2 === 0) colony.shipQueue = 'colony'
    else colony.shipQueue = warship
  })
}

function manageFleets(s: GameState, race: string, persona: AiPersona, fleets: FleetData[]) {
  const idle = fleets.filter(f => f.etaTurns <= 0)

  for (const fleet of idle) {
    if (fleet.colonists > 0) {
      // chegou num sistema vazio? coloniza. senão, vai ao mais próximo vazio.
      if (!systemIsColonized(s, fleet.systemId)) {
        const sys = tryColonize(s, fleet.id)
        if (sys) { revealAround(s, race, sys.id); continue }
      }
      const target = nearestUncolonized(s, fleet.systemId)
      if (target) orderMove(s, fleet, target.id)
      continue
    }

    if (fleet.warships > 0) {
      const totalWar = fleets.reduce((a, f) => a + f.warships, 0)
      const shouldAttack =
        persona === 'aggressive' ? totalWar >= AI_MIN_WARSHIPS_TO_ATTACK :
        persona === 'balanced'   ? totalWar >= AI_MIN_WARSHIPS_TO_ATTACK + 1 :
        totalWar >= AI_MIN_WARSHIPS_TO_ATTACK + 3   // expansionista só ataca se muito forte
      if (shouldAttack) {
        const target = nearestEnemyColony(s, race, fleet.systemId)
        if (target) orderMove(s, fleet, target)
      }
    }
  }
}

function orderMove(s: GameState, fleet: FleetData, targetSystemId: string) {
  if (targetSystemId === fleet.systemId) return
  const eta = estimateEta(s, fleet.id, targetSystemId)
  fleet.originSystemId = fleet.systemId
  fleet.destinationId = targetSystemId
  fleet.etaTurns = eta
  fleet.etaTotal = eta
}

function nearestUncolonized(s: GameState, fromSystemId: string): StarSystemData | null {
  const from = s.systems[fromSystemId]
  if (!from) return null
  let best: StarSystemData | null = null
  let bestD = Infinity
  for (const sys of Object.values(s.systems)) {
    if (systemIsColonized(s, sys.id)) continue
    const d = dist(from, sys)
    if (d < bestD) { bestD = d; best = sys }
  }
  return best
}

function nearestEnemyColony(s: GameState, race: string, fromSystemId: string): string | null {
  const from = s.systems[fromSystemId]
  if (!from) return null
  let best: string | null = null
  let bestD = Infinity
  for (const colony of Object.values(s.colonies)) {
    if (colony.raceId === race) continue
    const sys = s.systems[colony.systemId]
    if (!sys) continue
    const d = dist(from, sys)
    if (d < bestD) { bestD = d; best = colony.systemId }
  }
  return best
}
