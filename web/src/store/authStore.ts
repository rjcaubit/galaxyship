import { create } from 'zustand'

export type GameMode = 'online' | 'solo'

interface AuthState {
  token:    string | null
  userId:   string | null
  username: string | null
  mode:     GameMode | null
  setAuth:  (token: string, userId: string, username: string) => void
  playSolo: () => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null, userId: null, username: null, mode: null,
  setAuth: (token, userId, username) => set({ token, userId, username, mode: 'online' }),
  playSolo: () => set({ token: null, userId: null, username: 'Comandante Solo', mode: 'solo' }),
  logout: () => set({ token: null, userId: null, username: null, mode: null }),
}))
