import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

router.post('/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username e password obrigatórios' })
  const hash = await bcrypt.hash(password, 10)
  try {
    const user = await prisma.user.create({ data: { username, passwordHash: hash } })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, userId: user.id, username: user.username })
  } catch {
    res.status(409).json({ error: 'username já existe' })
  }
}))

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'credenciais inválidas' })
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, userId: user.id, username: user.username })
}))

export default router
