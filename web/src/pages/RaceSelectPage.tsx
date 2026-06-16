import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HumanRace, ZorgRace, SylarRace } from '@galaxyship/shared'
import { RaceCard } from '../components/game'
import { Button } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { createGame } from '../game/gameService'

const RACES = [new HumanRace(), new ZorgRace(), new SylarRace()]

export function RaceSelectPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const mode     = useAuthStore(s => s.mode)
  const setGame  = useGameStore(s => s.setGame)
  const navigate = useNavigate()

  async function handleStart() {
    if (!selected || !mode) return
    setLoading(true)
    try {
      const { gameId, state } = await createGame(selected)
      setGame(gameId, state)
      navigate(`/game/${gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro ao criar partida')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-space-dark p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-neon-blue mb-2">Escolha sua Raça</h1>
      <p className="text-white/40 mb-6 text-sm">Cada raça tem habilidades únicas que definem sua estratégia</p>
      <div className="w-full max-w-2xl space-y-3 mb-6">
        {RACES.map(race => (
          <RaceCard key={race.id} race={race} selected={selected === race.id} onSelect={() => setSelected(race.id)} />
        ))}
      </div>
      {error && <p className="text-neon-red text-sm mb-3">{error}</p>}
      <Button onClick={handleStart} loading={loading} disabled={!selected} size="lg">
        Iniciar Partida →
      </Button>
    </div>
  )
}
