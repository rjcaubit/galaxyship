import type { GameState, TurnEvent, FleetData, TechCategory } from '@galaxyship/shared'

interface TurnOrder {
  type:          string
  fleetId?:      string
  targetSystemId?: string
  category?:     string
  colonySystemId?: string
  buildingId?:   string
}

interface DiplomacyAction {
  targetRaceId: string
  action:       'DECLARE_WAR' | 'PROPOSE_PEACE' | 'OFFER_TECH'
}

export function processTurn(
  state: GameState,
  orders: TurnOrder[],
  diplomacyActions: DiplomacyAction[]
): { newState: GameState; events: TurnEvent[] } {
  const events: TurnEvent[] = []
  const s: GameState = JSON.parse(JSON.stringify(state))   // deep clone

  // 1. Aplicar ordens do jogador
  for (const order of orders) {
    if (order.type === 'MOVE_FLEET' && order.fleetId && order.targetSystemId) {
      const fleet = s.fleets[order.fleetId]
      if (fleet && fleet.raceId === s.playerRaceId) {
        fleet.systemId   = order.targetSystemId
        fleet.orderType  = null
        fleet.orderTarget = null
        if (!s.exploredSystems.includes(order.targetSystemId)) {
          s.exploredSystems.push(order.targetSystemId)
        }
      }
    }
    if (order.type === 'SET_RESEARCH' && order.category) {
      s.activeResearch = { category: order.category as TechCategory, pointsAccumulated: 0 }
    }
    if (order.type === 'START_BUILD' && order.colonySystemId && order.buildingId) {
      const colony = Object.values(s.colonies).find(c => c.systemId === order.colonySystemId)
      if (colony) { colony.buildQueue = order.buildingId; colony.buildProgress = 0 }
    }
  }

  // 2. Acumular pesquisa
  if (s.activeResearch) {
    s.activeResearch.pointsAccumulated += s.resources.research
  }

  // 3. Diplomacia do jogador
  for (const da of diplomacyActions) {
    if (s.relations[da.targetRaceId]) {
      if (da.action === 'DECLARE_WAR')   s.relations[da.targetRaceId].status = 'war'
      if (da.action === 'PROPOSE_PEACE') s.relations[da.targetRaceId].status = 'peace'
      s.relations[da.targetRaceId].lastActionTurn = s.turn
    }
  }

  // 4. IA age (simplificada no MVP: mover frota NPC para sistema aleatório)
  const npcRaces = ['zorg', 'sylar'].filter(r => r !== s.playerRaceId)
  const systemIds = Object.keys(s.systems)
  for (const npcRaceId of npcRaces) {
    const npcFleets = Object.values(s.fleets).filter(f => f.raceId === npcRaceId)
    for (const fleet of npcFleets) {
      const target = systemIds[Math.floor(Math.random() * systemIds.length)]
      if (target !== fleet.systemId) fleet.systemId = target
    }
  }

  // 5. Verificar combates (frotas de raças diferentes no mesmo sistema)
  const systemFleets: Record<string, FleetData[]> = {}
  for (const fleet of Object.values(s.fleets)) {
    if (!systemFleets[fleet.systemId]) systemFleets[fleet.systemId] = []
    systemFleets[fleet.systemId].push(fleet)
  }
  for (const [systemId, fleets] of Object.entries(systemFleets)) {
    const races = [...new Set(fleets.map(f => f.raceId))]
    if (races.length > 1) {
      const playerFleets = fleets.filter(f => f.raceId === s.playerRaceId)
      const enemyFleets  = fleets.filter(f => f.raceId !== s.playerRaceId)
      if (playerFleets.length && enemyFleets.length) {
        const playerPower = playerFleets.reduce((acc, f) => acc + f.attackPower * f.shipCount, 0)
        const enemyPower  = enemyFleets.reduce((acc, f) => acc + f.attackPower * f.shipCount, 0)
        const winner = playerPower >= enemyPower ? s.playerRaceId : enemyFleets[0].raceId
        events.push({
          type: 'COMBAT',
          payload: { systemId, winner, log: [
            { round: 1, text: `Poder do jogador: ${playerPower} vs inimigo: ${enemyPower}`, type: 'attack' },
            { round: 1, text: `Vitória: ${winner}`, type: 'result' }
          ]}
        })
        if (winner !== s.playerRaceId) {
          for (const f of playerFleets) delete s.fleets[f.id]
        } else {
          for (const f of enemyFleets) delete s.fleets[f.id]
        }
      }
    }
  }

  // 6. Avançar turno
  s.turn += 1

  return { newState: s, events }
}
