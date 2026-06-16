import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { apiLogin, apiRegister } from '../api/authApi'

export function LoginPage() {
  const [mode, setMode]     = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth  = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? apiLogin : apiRegister
      const data = await fn(username, password)
      setAuth(data.token, data.userId, data.username)
      navigate('/game/new')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-dark p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-neon-blue mb-2">🚀 GalaxyShip</h1>
        <p className="text-center text-white/40 mb-8">Conquiste a galáxia</p>
        <form onSubmit={handleSubmit} className="bg-space-mid rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex gap-2 mb-2">
            <Button variant={mode === 'login' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('login')} type="button">Entrar</Button>
            <Button variant={mode === 'register' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('register')} type="button">Registrar</Button>
          </div>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Usuário" autoComplete="username"
            className="w-full h-11 px-4 rounded-lg bg-space-dark border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Senha" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full h-11 px-4 rounded-lg bg-space-dark border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue" />
          {error && <p className="text-neon-red text-sm">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
