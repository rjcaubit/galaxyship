const BASE = 'http://localhost:3301/api'
const j = (r) => r.json()
let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`✅ ${name} ${extra}`) }
  else { fail++; console.log(`❌ ${name} ${extra}`) }
}

const u = 'smoke_' + Date.now()

// CT05 — sem token → 401
let r = await fetch(`${BASE}/game/x`)
check('CT05 GET sem token → 401', r.status === 401)

// register → 201
r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: 'orion123' }) })
check('register → 201', r.status === 201)
const { token } = await j(r)
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

// login senha errada → 401
r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: 'errada' }) })
check('CT login senha errada → 401', r.status === 401)

// CT01 — game/new → 201, 50-60 sistemas, 1 explorado
r = await fetch(`${BASE}/game/new`, { method: 'POST', headers: H, body: JSON.stringify({ raceId: 'humans' }) })
check('CT01 game/new → 201', r.status === 201)
const { gameId, state } = await j(r)
const nSys = Object.keys(state.systems).length
check('CT01 50-60 sistemas', nSys >= 50 && nSys <= 60, `(${nSys})`)
check('CT01 1 sistema explorado (home)', state.exploredSystems.length === 1)
check('CT01 colônia home criada', Object.keys(state.colonies).length === 1)
check('CT01 frota player + NPCs', Object.keys(state.fleets).length === 3)

// CT04 — load mantém estado
r = await fetch(`${BASE}/game/${gameId}`, { headers: H })
const loaded = await j(r)
check('CT04 load → mesmo nº de sistemas', Object.keys(loaded.state.systems).length === nSys)
check('CT04 load → colônia presente', Object.keys(loaded.state.colonies).length === 1)

// CT02/turn — mover frota + avançar turno
const playerFleetId = Object.keys(state.fleets).find(f => state.fleets[f].raceId === 'humans')
const homeSys = state.exploredSystems[0]
const targetSys = Object.keys(state.systems).find(s => s !== homeSys)
r = await fetch(`${BASE}/game/${gameId}/turn`, { method: 'POST', headers: H, body: JSON.stringify({
  orders: [{ type: 'MOVE_FLEET', fleetId: playerFleetId, targetSystemId: targetSys }, { type: 'SET_RESEARCH', category: 'weapons' }]
}) })
const turnRes = await j(r)
check('CT02 turn avança para 2', turnRes.state.turn === 2, `(turn=${turnRes.state.turn})`)
check('CT02 frota moveu', turnRes.state.fleets[playerFleetId]?.systemId === targetSys)
check('turn pesquisa ativa acumulou', turnRes.state.activeResearch?.pointsAccumulated > 0)

// CT06 — game de outro user → 403
r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u + '_b', password: 'x123456' }) })
const { token: t2 } = await j(r)
r = await fetch(`${BASE}/game/${gameId}`, { headers: { Authorization: `Bearer ${t2}` } })
check('CT06 game de outro user → 403', r.status === 403)

console.log(`\n${pass} passou, ${fail} falhou`)
process.exit(fail ? 1 : 0)
