import type { GameState, TurnEvent, FleetData, TechCategory, PlayerResources } from '@galaxyship/shared'

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

const POP_CAP = 10            // população máxima por colônia no MVP
const BUILD_COST = 100        // progresso necessário para concluir um edifício
const TECH_COST = 50          // pontos de pesquisa por tecnologia desbloqueada

/** Recalcula os recursos do jogador a partir das colônias que ele controla. */
function computeResources(state: GameState): PlayerResources {
  const playerColonies = Object.values(state.colonies).filter(c => c.raceId === state.playerRaceId)
  let production = 0, research = 0, food = 0, credits = 0
  for (const c of playerColonies) {
    production += c.population * 2 + c.buildings.length
    research   += c.population
    food       += Math.round(c.population * 1.5) - c.population   // saldo de comida
    credits    += c.population
  }
  return { production, research, food, credits }
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
      // troca de categoria preserva pontos só se for a mesma; senão reinicia
      if (s.activeResearch?.category !== order.category) {
        s.activeResearch = { category: order.category as TechCategory, pointsAccumulated: 0 }
      }
    }
    if (order.type === 'START_BUILD' && order.colonySystemId && order.buildingId) {
      const colony = Object.values(s.colonies).find(c => c.systemId === order.colonySystemId && c.raceId === s.playerRaceId)
      if (colony) { colony.buildQueue = order.buildingId; colony.buildProgress = 0 }
    }
  }

  // 2. Crescimento populacional + progresso de construção (colônias do jogador)
  const foodSurplus = computeResources(s).food
  for (const colony of Object.values(s.colonies)) {
    if (colony.raceId !== s.playerRaceId) continue
    // crescimento: +1 pop por turno se há saldo de comida e abaixo do cap
    if (foodSurplus >= 0 && colony.population < POP_CAP) {
      colony.population += 1
    }
    // construção: avança proporcional à produção da colônia
    if (colony.buildQueue) {
      colony.buildProgress += Math.max(10, colony.population * 2 + colony.buildings.length)
      if (colony.buildProgress >= BUILD_COST) {
        colony.buildings.push(colony.buildQueue)
        events.push({ type: 'COLONY_FOUNDED', payload: { systemId: colony.systemId, building: colony.buildQueue } })
        colony.buildQueue = null
        colony.buildProgress = 0
      }
    }
  }

  // 3. Recalcular recursos já com a população crescida (HUD == ColonyPanel)
  s.resources = computeResources(s)

  // 4. Acumular pesquisa e desbloquear tecnologia ao atingir o custo
  if (s.activeResearch) {
    s.activeResearch.pointsAccumulated += s.resources.research
    if (s.activeResearch.pointsAccumulated >= TECH_COST) {
      const tier = s.researchedTechs.filter(t => t.startsWith(s.activeResearch!.category)).length + 1
      const techId = `${s.activeResearch.category}_${tier}`
      if (!s.researchedTechs.includes(techId)) {
        s.researchedTechs.push(techId)
        events.push({ type: 'TECH_UNLOCKED', payload: { techId, category: s.activeResearch.category, tier } })
      }
      s.activeResearch.pointsAccumulated = 0
    }
  }

  // 5. Diplomacia do jogador (também aceita ações junto do turno)
  applyDiplomacy(s, diplomacyActions)

  // 6. IA age (simplificada no MVP: mover frota NPC para sistema aleatório — ver N1)
  const npcRaces = ['zorg', 'sylar'].filter(r => r !== s.playerRaceId)
  const systemIds = Object.keys(s.systems)
  for (const npcRaceId of npcRaces) {
    const npcFleets = Object.values(s.fleets).filter(f => f.raceId === npcRaceId)
    for (const fleet of npcFleets) {
      const target = systemIds[Math.floor(Math.random() * systemIds.length)]
      if (target !== fleet.systemId) fleet.systemId = target
    }
  }

  // 7. Combate (frotas de raças diferentes no mesmo sistema)
  resolveCombats(s, events)

  // 8. Avançar turno
  s.turn += 1

  return { newState: s, events }
}

/** Aplica ações diplomáticas ao estado (sem avançar turno). Reutilizado pela rota dedicada. */
export function applyDiplomacy(s: GameState, diplomacyActions: DiplomacyAction[]) {
  for (const da of diplomacyActions) {
    const rel = s.relations[da.targetRaceId]
    if (!rel) continue
    if (da.action === 'DECLARE_WAR')   rel.status = 'war'
    if (da.action === 'PROPOSE_PEACE') rel.status = 'peace'
    rel.lastActionTurn = s.turn
  }
}

function resolveCombats(s: GameState, events: TurnEvent[]) {
  const systemFleets: Record<string, FleetData[]> = {}
  for (const fleet of Object.values(s.fleets)) {
    if (!systemFleets[fleet.systemId]) systemFleets[fleet.systemId] = []
    systemFleets[fleet.systemId].push(fleet)
  }
  for (const [systemId, fleets] of Object.entries(systemFleets)) {
    const races = [...new Set(fleets.map(f => f.raceId))]
    if (races.length < 2) continue
    const playerFleets = fleets.filter(f => f.raceId === s.playerRaceId)
    const enemyFleets  = fleets.filter(f => f.raceId !== s.playerRaceId)
    if (!playerFleets.length || !enemyFleets.length) continue

    // poder = ataque ofensivo do atacante vs defesa do defensor, com ruído
    const noise = () => 0.85 + Math.random() * 0.3
    const playerPower = playerFleets.reduce((a, f) => a + (f.attackPower + f.defensePower) * f.shipCount, 0) * noise()
    const enemyPower  = enemyFleets.reduce((a, f) => a + (f.attackPower + f.defensePower) * f.shipCount, 0) * noise()
    const winner = playerPower >= enemyPower ? s.playerRaceId : enemyFleets[0].raceId

    events.push({
      type: 'COMBAT',
      payload: { systemId, winner, log: [
        { round: 1, text: `Poder do jogador: ${Math.round(playerPower)} vs inimigo: ${Math.round(enemyPower)}`, type: 'attack' },
        { round: 1, text: winner === s.playerRaceId ? 'Frota inimiga destruída!' : 'Sua frota foi destruída!', type: 'result' }
      ]}
    })

    if (winner !== s.playerRaceId) {
      for (const f of playerFleets) delete s.fleets[f.id]
    } else {
      for (const f of enemyFleets) delete s.fleets[f.id]
    }
  }
}
