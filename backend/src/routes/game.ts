import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import { generateGalaxy } from '@galaxyship/shared'
import type { GameState, FleetData, ColonyData, DiplomacyRelation } from '@galaxyship/shared'
import { processTurn, applyDiplomacy } from '../services/turnService'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/new', asyncHandler(async (req: AuthRequest, res) => {
  const { raceId } = req.body
  if (!raceId) return res.status(400).json({ error: 'raceId obrigatório' })

  const seed = Math.floor(Math.random() * 1_000_000)
  const systems = generateGalaxy(seed)
  const systemIds = Object.keys(systems)
  const homeSystemId = systemIds[0]

  const homeFleetId = `fleet_${req.userId}_0`
  const homeColonyId = `colony_${homeSystemId}`

  const relations: Record<string, DiplomacyRelation> = {
    zorg:  { raceId: 'zorg',  status: 'neutral', treaties: [], lastActionTurn: 0 },
    sylar: { raceId: 'sylar', status: 'neutral', treaties: [], lastActionTurn: 0 },
  }
  if (raceId === 'zorg')  delete relations.zorg
  if (raceId === 'sylar') delete relations.sylar

  // Frota NPC inicial para cada raça adversária (semente de conflito)
  const npcFleets: Record<string, FleetData> = {}
  Object.keys(relations).forEach((npcRaceId, idx) => {
    const npcSystemId = systemIds[systemIds.length - 1 - idx]
    npcFleets[`fleet_${npcRaceId}`] = {
      id: `fleet_${npcRaceId}`, name: `Frota ${npcRaceId}`,
      raceId: npcRaceId, systemId: npcSystemId,
      shipCount: 2, attackPower: 5, defensePower: 4,
      hasColonist: false, orderType: null, orderTarget: null
    }
  })

  const initialFleet: FleetData = {
    id: homeFleetId, name: 'Frota Inicial',
    raceId, systemId: homeSystemId,
    shipCount: 3, attackPower: 5, defensePower: 5,
    hasColonist: true, orderType: null, orderTarget: null
  }

  const initialColony: ColonyData = {
    id: homeColonyId, name: `${systems[homeSystemId].name} Prime`,
    systemId: homeSystemId, raceId,
    population: 4, buildings: [], buildQueue: null, buildProgress: 0
  }

  const state: GameState = {
    turn: 1,
    playerRaceId: raceId,
    systems,
    colonies: { [homeColonyId]: initialColony },
    fleets: { [homeFleetId]: initialFleet, ...npcFleets },
    relations,
    researchedTechs: [],
    activeResearch: null,
    resources: { production: 10, research: 5, food: 8, credits: 50 },
    exploredSystems: [homeSystemId]
  }

  const game = await prisma.game.create({
    data: { userId: req.userId!, seed, turnNumber: 1, raceId, stateJson: state as object }
  })

  res.status(201).json({ gameId: game.id, state })
}))

router.get('/list', asyncHandler(async (req: AuthRequest, res) => {
  const games = await prisma.game.findMany({
    where: { userId: req.userId! },
    select: { id: true, raceId: true, turnNumber: true, createdAt: true, updatedAt: true }
  })
  res.json({ games })
}))

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })
  res.json({ gameId: game.id, state: game.stateJson, turn: game.turnNumber })
}))

router.post('/:id/turn', asyncHandler(async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })

  const { orders = [], diplomacyActions = [] } = req.body
  const { newState, events } = processTurn(game.stateJson as unknown as GameState, orders, diplomacyActions)

  await prisma.game.update({
    where: { id: req.params.id },
    data: { stateJson: newState as object, turnNumber: newState.turn }
  })

  res.json({ state: newState, events })
}))

// Ação diplomática isolada — aplica relação SEM avançar o turno (ver B1)
router.post('/:id/diplomacy', asyncHandler(async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })

  const { actions = [] } = req.body
  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: 'actions obrigatório' })
  }
  const state = game.stateJson as unknown as GameState
  applyDiplomacy(state, actions)

  await prisma.game.update({ where: { id: req.params.id }, data: { stateJson: state as object } })
  res.json({ state })
}))

router.put('/:id/save', asyncHandler(async (req: AuthRequest, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } })
  if (!game) return res.status(404).json({ error: 'not_found' })
  if (game.userId !== req.userId) return res.status(403).json({ error: 'forbidden' })
  const { state } = req.body
  await prisma.game.update({ where: { id: req.params.id }, data: { stateJson: state } })
  res.json({ ok: true })
}))

export default router
