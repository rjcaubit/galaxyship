import { createInitialState, processTurn, applyDiplomacy } from '@galaxyship/shared'
import type { GameState, TurnEvent } from '@galaxyship/shared'
import { storage } from './storage'

// Modo solo: a partida roda inteiramente no browser, sem backend nem login.
// Persistência em localStorage. Usa o MESMO motor (shared) da partida online.

const SAVE_KEY = 'galaxyship_solo_save'
export const SOLO_GAME_ID = 'solo'

function persist(state: GameState) {
  storage.set(SAVE_KEY, JSON.stringify(state))
}

export function soloHasSave(): boolean {
  return !!storage.get(SAVE_KEY)
}

export function soloCreateGame(raceId: string): { gameId: string; state: GameState } {
  const seed = Math.floor(Math.random() * 1_000_000) + Date.now() % 100000
  const state = createInitialState(raceId, seed)
  persist(state)
  return { gameId: SOLO_GAME_ID, state }
}

export function soloLoadGame(): { gameId: string; state: GameState; turn: number } | null {
  const raw = storage.get(SAVE_KEY)
  if (!raw) return null
  const state = JSON.parse(raw) as GameState
  return { gameId: SOLO_GAME_ID, state, turn: state.turn }
}

export function soloEndTurn(orders: object[], diplomacy: object[]): { state: GameState; events: TurnEvent[] } {
  const raw = storage.get(SAVE_KEY)
  if (!raw) throw new Error('Nenhuma partida solo salva')
  const current = JSON.parse(raw) as GameState
  const { newState, events } = processTurn(current, orders as never[], diplomacy as never[])
  persist(newState)
  return { state: newState, events }
}

export function soloDiplomacy(actions: object[]): { state: GameState } {
  const raw = storage.get(SAVE_KEY)
  if (!raw) throw new Error('Nenhuma partida solo salva')
  const state = JSON.parse(raw) as GameState
  applyDiplomacy(state, actions as never[])
  persist(state)
  return { state }
}

export function soloDelete() {
  storage.remove(SAVE_KEY)
}
