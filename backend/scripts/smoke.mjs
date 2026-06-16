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
const homePopBefore = Object.values(state.colonies)[0].population
r = await fetch(`${BASE}/game/${gameId}/turn`, { method: 'POST', headers: H, body: JSON.stringify({
  orders: [{ type: 'MOVE_FLEET', fleetId: playerFleetId, targetSystemId: targetSys }, { type: 'SET_RESEARCH', category: 'weapons' }, { type: 'START_BUILD', colonySystemId: homeSys, buildingId: 'factory' }]
}) })
const t1 = await j(r)
check('CT02 turn avança para 2', t1.state.turn === 2, `(turn=${t1.state.turn})`)
check('CT02 frota moveu', t1.state.fleets[playerFleetId]?.systemId === targetSys)

// B2 — economia: população cresceu, recursos recalculados, construção em progresso
const homeColony1 = Object.values(t1.state.colonies).find(c => c.systemId === homeSys)
check('B2 população cresceu', homeColony1.population > homePopBefore, `(${homePopBefore}→${homeColony1.population})`)
check('B2 recursos recalculados das colônias', t1.state.resources.production === homeColony1.population * 2 + homeColony1.buildings.length, `(prod=${t1.state.resources.production})`)
check('B2 construção em progresso', homeColony1.buildProgress > 0 || homeColony1.buildings.includes('factory'), `(progress=${homeColony1.buildProgress}, edif=${homeColony1.buildings})`)

// B2 — pesquisa desbloqueia após vários turnos
let st = t1.state
for (let i = 0; i < 12; i++) {
  r = await fetch(`${BASE}/game/${gameId}/turn`, { method: 'POST', headers: H, body: JSON.stringify({ orders: [] }) })
  st = (await j(r)).state
}
check('B2 tecnologia desbloqueada após pesquisa', st.researchedTechs.length >= 1, `(techs=${JSON.stringify(st.researchedTechs)})`)
check('B2 edifício concluído após turnos', Object.values(st.colonies).find(c => c.systemId === homeSys).buildings.length >= 1)

// B1 — diplomacia NÃO avança o turno
const turnBeforeDiplo = st.turn
r = await fetch(`${BASE}/game/${gameId}/diplomacy`, { method: 'POST', headers: H, body: JSON.stringify({ actions: [{ targetRaceId: 'zorg', action: 'DECLARE_WAR' }] }) })
check('B1 diplomacia → 200', r.status === 200)
const diplo = await j(r)
check('B1 diplomacia NÃO avança turno', diplo.state.turn === turnBeforeDiplo, `(antes=${turnBeforeDiplo}, depois=${diplo.state.turn})`)
check('B1 relação virou guerra', diplo.state.relations.zorg.status === 'war')

// CT06 — game de outro user → 403
r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u + '_b', password: 'x123456' }) })
const { token: t2 } = await j(r)
r = await fetch(`${BASE}/game/${gameId}`, { headers: { Authorization: `Bearer ${t2}` } })
check('CT06 game de outro user → 403', r.status === 403)

console.log(`\n${pass} passou, ${fail} falhou`)
process.exit(fail ? 1 : 0)
