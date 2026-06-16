import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import { createInitialState, processTurn, applyDiplomacy } from '@galaxyship/shared'
import type { GameState } from '@galaxyship/shared'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/new', asyncHandler(async (req: AuthRequest, res) => {
  const { raceId } = req.body
  if (!raceId) return res.status(400).json({ error: 'raceId obrigatório' })

  const seed = Math.floor(Math.random() * 1_000_000)
  const state = createInitialState(raceId, seed)

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
