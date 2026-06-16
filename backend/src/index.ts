import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import gameRouter from './routes/game'

const app = express()
const PORT = process.env.PORT || 3301

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3300' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/game', gameRouter)

// Placeholder multiplayer (socket.io) — habilitado em issue futura
// import { Server } from 'socket.io'
// const io = new Server(server, { cors: { origin: '*' } })

// Rede de proteção: nunca derrubar o processo por erro assíncrono solto
// (ex.: banco temporariamente fora do ar). Loga e segue.
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason))
process.on('uncaughtException',  (err)    => console.error('[uncaughtException]', err))

app.listen(PORT, () => console.log(`Backend rodando em :${PORT}`))

export default app
