import type { GameState, TurnEvent } from '@galaxyship/shared'
import { useAuthStore } from '../store/authStore'
import { apiCreateGame, apiLoadGame, apiEndTurn, apiDiplomacy } from '../api/gameApi'
import { soloCreateGame, soloLoadGame, soloEndTurn, soloDiplomacy } from './soloEngine'

// Camada única que os componentes usam. Decide entre partida online (backend)
// e solo (client-side) com base no modo do authStore. Assim a UI não conhece
// a diferença — só pede "cria partida", "fim de turno", etc.

function isSolo() {
  return useAuthStore.getState().mode === 'solo'
}
function token() {
  const t = useAuthStore.getState().token
  if (!t) throw new Error('Sessão expirada — faça login novamente')
  return t
}

export async function createGame(raceId: string): Promise<{ gameId: string; state: GameState }> {
  if (isSolo()) return soloCreateGame(raceId)
  return apiCreateGame(token(), raceId)
}

export async function loadGame(gameId: string): Promise<{ gameId: string; state: GameState; turn: number }> {
  if (isSolo()) {
    const loaded = soloLoadGame()
    if (!loaded) throw new Error('Nenhuma partida solo salva')
    return loaded
  }
  return apiLoadGame(token(), gameId)
}

export async function endTurn(gameId: string, orders: object[], diplomacy: object[]): Promise<{ state: GameState; events: TurnEvent[] }> {
  if (isSolo()) return soloEndTurn(orders, diplomacy)
  return apiEndTurn(token(), gameId, orders, diplomacy)
}

export async function diplomacy(gameId: string, actions: object[]): Promise<{ state: GameState }> {
  if (isSolo()) return soloDiplomacy(actions)
  return apiDiplomacy(token(), gameId, actions)
}
