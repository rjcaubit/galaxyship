const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3301/api'

export interface AuthResponse { token: string; userId: string; username: string }

export async function apiRegister(username: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}

export async function apiLogin(username: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error((await r.json()).error)
  return r.json()
}
