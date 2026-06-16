import { create } from 'zustand'
import type { GameState, TurnEvent } from '@galaxyship/shared'

interface GameStore {
  gameId:         string | null
  state:          GameState | null
  selectedSystem: string | null
  activePanel:    string | null
  pendingEvents:  TurnEvent[]
  processingTurn: boolean
  setGame:        (gameId: string, state: GameState) => void
  updateState:    (state: GameState) => void
  selectSystem:   (id: string | null) => void
  openPanel:      (panel: string | null) => void
  setEvents:      (events: TurnEvent[]) => void
  setProcessing:  (v: boolean) => void
  reset:          () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameId: null, state: null, selectedSystem: null,
  activePanel: null, pendingEvents: [], processingTurn: false,
  setGame:      (gameId, state) => set({ gameId, state }),
  updateState:  (state)        => set({ state }),
  selectSystem: (id)           => set({ selectedSystem: id }),
  openPanel:    (panel)        => set({ activePanel: panel }),
  setEvents:    (events)       => set({ pendingEvents: events }),
  setProcessing: (v)           => set({ processingTurn: v }),
  reset:        ()             => set({ gameId: null, state: null, selectedSystem: null }),
}))
