import type { GameState, FleetData, TurnEvent, CombatLogLine } from '../types/game'
import { fleetPower, colonyAt, raceMod, npcTier } from './gameMath'
import { effectsFromTechs } from './techCatalog'

const BASE_STRENGTH = 12
const PLANET_DEF_PER_POP = 6       // defesa planetária inerente por pop
const PLANET_DEF_PER_FACTORY = 1.0
const MAX_ATTRITION = 0.85         // perda máxima de naves do vencedor numa batalha dura

/**
 * Defesa total do dono da colônia no sistema: defesa planetária inerente
 * (população + fábricas) + bases de mísseis, com bônus de tech e raça.
 * Colônias desenvolvidas são difíceis de capturar — capturar exige superioridade real.
 */
function baseDefense(s: GameState, raceId: string, systemId: string): number {
  const colony = colonyAt(s, systemId, raceId)
  if (!colony) return 0
  const techDef = raceId === s.playerRaceId
    ? effectsFromTechs(s.researchedTechs).defenseBonus
    : npcTier(s.npcTech[raceId] ?? 0) * 3
  const defMod = 1 + raceMod(raceId, 'defense')
  const planetary = colony.population * PLANET_DEF_PER_POP + colony.factories * PLANET_DEF_PER_FACTORY
  return (planetary + colony.bases * (BASE_STRENGTH + techDef)) * defMod
}

/**
 * Resolve combates em todos os sistemas onde frotas paradas de raças diferentes
 * coexistem. O vencedor destrói as frotas perdedoras e, se tiver naves de guerra
 * e houver colônia inimiga, captura o sistema.
 */
export function resolveCombats(s: GameState, events: TurnEvent[]) {
  // agrupa frotas paradas por sistema
  const bySystem: Record<string, FleetData[]> = {}
  for (const f of Object.values(s.fleets)) {
    if (f.etaTurns > 0) continue          // em trânsito não luta
    ;(bySystem[f.systemId] ??= []).push(f)
  }

  for (const [systemId, fleets] of Object.entries(bySystem)) {
    const races = [...new Set(fleets.map(f => f.raceId))]
    if (races.length < 2) continue

    // poder por raça (frotas + bases se dona da colônia local)
    const noise = () => 0.85 + Math.random() * 0.3
    const power: Record<string, number> = {}
    for (const race of races) {
      const fleetSum = fleets.filter(f => f.raceId === race).reduce((a, f) => a + fleetPower(s, f), 0)
      power[race] = (fleetSum + baseDefense(s, race, systemId)) * noise()
    }

    const winner = races.reduce((best, r) => (power[r] > power[best] ? r : best), races[0])

    // destrói frotas perdedoras neste sistema
    const loserPower = races.filter(r => r !== winner).reduce((a, r) => a + power[r], 0)
    for (const f of fleets) {
      if (f.raceId !== winner) delete s.fleets[f.id]
    }

    // ATRITO: o vencedor perde naves proporcional à resistência enfrentada.
    // Conquistar custa caro — evita que uma única frota engula a galáxia.
    const winnerPower = power[winner] || 1
    const attrition = Math.min(MAX_ATTRITION, loserPower / (winnerPower + loserPower))
    if (attrition > 0) {
      for (const f of fleets) {
        if (f.raceId !== winner || f.warships <= 0) continue
        const lost = Math.round(f.warships * attrition)
        f.warships = Math.max(0, f.warships - lost)
        if (f.warships <= 0 && f.colonists <= 0 && f.scouts <= 0) delete s.fleets[f.id]
      }
    }
    const winnerHasWarships = Object.values(s.fleets).some(
      f => f.raceId === winner && f.systemId === systemId && f.etaTurns <= 0 && f.warships > 0)

    const playerInvolved = races.includes(s.playerRaceId)
    if (playerInvolved) {
      const log: CombatLogLine[] = races.map(r => ({
        round: 1, text: `${r}: poder ${Math.round(power[r])}`, type: r === winner ? 'result' : 'attack',
      }))
      log.push({ round: 1, text: `Vencedor: ${winner}`, type: 'result' })
      events.push({ type: 'COMBAT', payload: { systemId, winner, log } })
    }

    // captura de colônia
    const colony = colonyAt(s, systemId)
    if (colony && colony.raceId !== winner && winnerHasWarships) {
      const previous = colony.raceId
      colony.raceId = winner
      colony.population = Math.max(1, Math.floor(colony.population * 0.5))
      colony.bases = 0
      colony.shipQueue = null
      colony.shipProgress = 0
      if (winner === s.playerRaceId || previous === s.playerRaceId) {
        events.push({ type: 'COLONY_CAPTURED', payload: { systemId, from: previous, to: winner } })
      }
      if (winner === s.playerRaceId && !s.exploredSystems.includes(systemId)) {
        s.exploredSystems.push(systemId)
      }
    }
  }
}
