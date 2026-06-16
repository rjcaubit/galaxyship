import { create } from 'zustand'
import type { GameState, TurnEvent } from '@galaxyship/shared'

// Ordem do jogador acumulada durante o turno (espelha o tipo Order do shared)
export type PlayerOrder =
  | { type: 'MOVE_FLEET'; fleetId: string; targetSystemId: string }
  | { type: 'COLONIZE'; fleetId: string }
  | { type: 'SET_RATIOS'; colonySystemId: string; ratios: { ind: number; eco: number; tech: number; ship: number; def: number } }
  | { type: 'SET_SHIP'; colonySystemId: string; kind: string }
  | { type: 'SET_RESEARCH'; category: string }

interface GameStore {
  gameId:         string | null
  state:          GameState | null
  selectedSystem: string | null
  selectedFleet:  string | null
  moveMode:       boolean          // escolhendo destino para a frota selecionada
  activePanel:    string | null
  pendingEvents:  TurnEvent[]
  processingTurn: boolean
  orders:         PlayerOrder[]     // ordens acumuladas para o próximo turno

  setGame:        (gameId: string, state: GameState) => void
  updateState:    (state: GameState) => void
  selectSystem:   (id: string | null) => void
  selectFleet:    (id: string | null) => void
  setMoveMode:    (v: boolean) => void
  openPanel:      (panel: string | null) => void
  setEvents:      (events: TurnEvent[]) => void
  setProcessing:  (v: boolean) => void
  addOrder:       (order: PlayerOrder) => void
  removeFleetOrders: (fleetId: string) => void
  clearOrders:    () => void
  reset:          () => void
}

// Ordens "última vence" por alvo, para não acumular duplicatas
function mergeOrder(orders: PlayerOrder[], order: PlayerOrder): PlayerOrder[] {
  const keep = orders.filter(o => {
    if (order.type === 'MOVE_FLEET' || order.type === 'COLONIZE')
      return !((o.type === 'MOVE_FLEET' || o.type === 'COLONIZE') && o.fleetId === order.fleetId)
    if (order.type === 'SET_RATIOS') return !(o.type === 'SET_RATIOS' && o.colonySystemId === order.colonySystemId)
    if (order.type === 'SET_SHIP')   return !(o.type === 'SET_SHIP' && o.colonySystemId === order.colonySystemId)
    if (order.type === 'SET_RESEARCH') return o.type !== 'SET_RESEARCH'
    return true
  })
  return [...keep, order]
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: null, state: null, selectedSystem: null, selectedFleet: null,
  moveMode: false, activePanel: null, pendingEvents: [], processingTurn: false, orders: [],

  setGame:       (gameId, state) => set({ gameId, state, orders: [], selectedFleet: null, moveMode: false }),
  updateState:   (state)         => set({ state }),
  selectSystem:  (id)            => set({ selectedSystem: id }),
  selectFleet:   (id)            => set({ selectedFleet: id }),
  setMoveMode:   (v)             => set({ moveMode: v }),
  openPanel:     (panel)         => set({ activePanel: panel }),
  setEvents:     (events)        => set({ pendingEvents: events }),
  setProcessing: (v)             => set({ processingTurn: v }),
  addOrder:      (order)         => set(s => ({ orders: mergeOrder(s.orders, order) })),
  removeFleetOrders: (fleetId)   => set(s => ({ orders: s.orders.filter(o => !('fleetId' in o && o.fleetId === fleetId)) })),
  clearOrders:   ()             => set({ orders: [] }),
  reset:         ()             => set({ gameId: null, state: null, selectedSystem: null, selectedFleet: null, moveMode: false, orders: [] }),
}))
