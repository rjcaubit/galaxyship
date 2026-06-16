import type { GameState, TurnEvent } from '@galaxyship/shared'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3301/api'

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export async function apiCreateGame(token: string, raceId: string): Promise<{ gameId: string; state: GameState }> {
  const r = await fetch(`${BASE}/game/new`, { method: 'POST', headers: headers(token), body: JSON.stringify({ raceId }) })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiLoadGame(token: string, gameId: string): Promise<{ gameId: string; state: GameState; turn: number }> {
  const r = await fetch(`${BASE}/game/${gameId}`, { headers: headers(token) })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiEndTurn(token: string, gameId: string, orders: object[], diplomacy: object[]): Promise<{ state: GameState; events: TurnEvent[] }> {
  const r = await fetch(`${BASE}/game/${gameId}/turn`, {
    method: 'POST', headers: headers(token), body: JSON.stringify({ orders, diplomacyActions: diplomacy })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiListGames(token: string) {
  const r = await fetch(`${BASE}/game/list`, { headers: headers(token) })
  return r.json()
}
