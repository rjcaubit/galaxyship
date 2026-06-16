/* Simulador headless — joga uma partida completa e valida o loop de jogo.
 * Usa um "bot jogador" guloso para exercitar mover/colonizar/pesquisar/construir.
 * Rodar: node shared/scripts/sim.cjs */
const GS = require('../dist/index.js')

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }

function nearestUncolonized(state, fromId) {
  const from = state.systems[fromId]
  let best = null, bestD = Infinity
  for (const sys of Object.values(state.systems)) {
    if (GS.systemIsColonized(state, sys.id)) continue
    const d = dist(from, sys)
    if (d < bestD) { bestD = d; best = sys }
  }
  return best
}

function nearestUnexplored(state, fromId) {
  const from = state.systems[fromId]
  let best = null, bestD = Infinity
  for (const sys of Object.values(state.systems)) {
    if (state.exploredSystems.includes(sys.id)) continue
    const d = dist(from, sys)
    if (d < bestD) { bestD = d; best = sys }
  }
  return best
}

function nearestEnemyColony(state, fromId) {
  const from = state.systems[fromId]
  let best = null, bestD = Infinity
  for (const c of Object.values(state.colonies)) {
    if (c.raceId === state.playerRaceId) continue
    const sys = state.systems[c.systemId]
    const d = dist(from, sys)
    if (d < bestD) { bestD = d; best = c.systemId }
  }
  return best
}

/** Bot do jogador competente: expande, defende, pesquisa com foco e ataca quando forte. */
const RESEARCH_PLAN = ['construction', 'weapons', 'biology', 'propulsion', 'computers', 'defense']
function playerOrders(state) {
  const orders = []
  const me = state.playerRaceId
  const myColonies = Object.values(state.colonies).filter(c => c.raceId === me)
  const myFleets = Object.values(state.fleets).filter(f => f.raceId === me)
  const homeSystemId = myColonies[0]?.systemId
  const wantColony = myColonies.length < 7
  // Doutrina: colônia ainda jovem (lar enquanto expande) guarda a frota; quando
  // o império está formado, toda frota militar avança e conquista (as bases
  // defendem as colônias). A fusão de frotas concentra a força no alvo.
  const conquer = !wantColony

  for (const f of myFleets) {
    if (f.etaTurns > 0) continue
    if (f.colonists > 0) {
      if (!GS.systemIsColonized(state, f.systemId)) orders.push({ type: 'COLONIZE', fleetId: f.id })
      else {
        const t = nearestUncolonized(state, f.systemId)
        if (t) orders.push({ type: 'MOVE_FLEET', fleetId: f.id, targetSystemId: t.id })
      }
    } else if (f.scouts > 0) {
      const t = nearestUnexplored(state, f.systemId)
      if (t) orders.push({ type: 'MOVE_FLEET', fleetId: f.id, targetSystemId: t.id })
    } else if (f.warships > 0 && conquer) {
      const t = nearestEnemyColony(state, f.systemId)
      if (t) orders.push({ type: 'MOVE_FLEET', fleetId: f.id, targetSystemId: t })
    }
    // enquanto expande, naves de guerra ficam defendendo
  }

  // produção: toda colônia investe forte em defesa (bases) + economia
  myColonies.forEach((c) => {
    const expanding = wantColony && c.systemId !== homeSystemId && c.population < 5
    orders.push({ type: 'SET_RATIOS', colonySystemId: c.systemId,
      ratios: expanding ? { ind: .35, eco: .30, tech: .10, ship: .20, def: .05 }
                        : { ind: .22, eco: .13, tech: .15, ship: .25, def: .25 } })
    const kind = (wantColony && c.systemId === homeSystemId) ? 'colony' : 'frigate'
    orders.push({ type: 'SET_SHIP', colonySystemId: c.systemId, kind })
  })

  // pesquisa: foca uma categoria por vez (avança no plano conforme desbloqueia tiers)
  const idx = Math.min(RESEARCH_PLAN.length - 1, Math.floor(state.researchedTechs.length / 2))
  orders.push({ type: 'SET_RESEARCH', category: RESEARCH_PLAN[idx] })
  return orders
}

// ---------- roda a simulação ----------
let pass = 0, fail = 0
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`✅ ${name} ${extra}`) }
  else { fail++; console.log(`❌ ${name} ${extra}`) }
}

const RACE = process.env.RACE || 'humans'
const SEED = parseInt(process.env.SEED || '12345', 10)
let state = GS.createInitialState(RACE, SEED)
check('estado inicial: jogador tem 1 colônia', Object.values(state.colonies).filter(c => c.raceId === RACE).length === 1)
check('estado inicial: 3 raças têm colônia', new Set(Object.values(state.colonies).map(c => c.raceId)).size === 3)
check('estado inicial: jogador tem nave colônia', Object.values(state.fleets).some(f => f.raceId === RACE && f.colonists > 0))

const NPC_RACES = ['humans', 'zorg', 'sylar'].filter(r => r !== RACE)
const seen = { arrived: false, founded: false, tech: 0, combat: false, captured: false }
let maxPlayerColonies = 1, maxNpcColonies = {}, firstColonyTurn = null, anyError = null
let peakPop = 0, peakFactories = 0

for (let i = 0; i < 400 && state.status === 'playing'; i++) {
  let res
  try { res = GS.processTurn(state, playerOrders(state), []) }
  catch (e) { anyError = e; break }
  state = res.newState
  for (const ev of res.events) {
    if (ev.type === 'FLEET_ARRIVED') seen.arrived = true
    if (ev.type === 'COLONY_FOUNDED') { seen.founded = true; if (!firstColonyTurn) firstColonyTurn = state.turn }
    if (ev.type === 'TECH_UNLOCKED') seen.tech++
    if (ev.type === 'COMBAT') seen.combat = true
    if (ev.type === 'COLONY_CAPTURED') seen.captured = true
  }
  const pc = Object.values(state.colonies).filter(c => c.raceId === RACE).length
  maxPlayerColonies = Math.max(maxPlayerColonies, pc)
  for (const c of Object.values(state.colonies)) {
    if (c.raceId !== RACE) continue
    peakPop = Math.max(peakPop, c.population); peakFactories = Math.max(peakFactories, c.factories)
  }
  if (process.env.TRACE && state.turn % 15 === 0) {
    const cc = {}; for (const c of Object.values(state.colonies)) cc[c.raceId] = (cc[c.raceId]||0)+1
    const war = {}; for (const f of Object.values(state.fleets)) war[f.raceId] = (war[f.raceId]||0)+f.warships
    console.log(`  t${state.turn}: colônias ${JSON.stringify(cc)} | naves-guerra ${JSON.stringify(war)} | techJ ${state.researchedTechs.length}`)
  }
  for (const r of NPC_RACES) {
    const n = Object.values(state.colonies).filter(c => c.raceId === r).length
    maxNpcColonies[r] = Math.max(maxNpcColonies[r] || 0, n)
  }
}

console.log(`\n--- resultado após turno ${state.turn} (status: ${state.status}) ---`)
check('sem exceções durante a simulação', !anyError, anyError ? String(anyError.stack || anyError) : '')
check('frota se move e chega (ETA)', seen.arrived)
check('jogador funda 2ª+ colônia', seen.founded, `(máx ${maxPlayerColonies} colônias, 1ª no turno ${firstColonyTurn})`)
check('expansão real do jogador (≥3 colônias)', maxPlayerColonies >= 3, `(${maxPlayerColonies})`)
check('pesquisa desbloqueia techs', seen.tech >= 3, `(${seen.tech} techs)`)
check('economia cresce (pico de pop/fábricas)', peakPop > 6 && peakFactories > 5, `(pop ${peakPop.toFixed(1)}, fábricas ${peakFactories.toFixed(1)})`)
for (const r of NPC_RACES) {
  check(`IA ${r} expande`, (maxNpcColonies[r] || 0) >= 2, `(${r} máx ${maxNpcColonies[r]})`)
}
check('combate acontece', seen.combat)
check('jogo progride (turno > 20)', state.turn > 20, `(turno ${state.turn})`)

// estatística final
const counts = {}
for (const c of Object.values(state.colonies)) counts[c.raceId] = (counts[c.raceId] || 0) + 1
console.log('\nColônias finais por raça:', JSON.stringify(counts))
console.log('Techs do jogador:', state.researchedTechs.length, '| Frotas vivas:', Object.keys(state.fleets).length)
console.log('Captura de colônia ocorreu:', seen.captured)

console.log(`\n${pass} passou, ${fail} falhou`)
process.exit(fail ? 1 : 0)
