import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Button } from '../components/ui'

export function EndGameModal() {
  const state    = useGameStore(s => s.state)
  const reset    = useGameStore(s => s.reset)
  const navigate = useNavigate()
  if (!state || state.status === 'playing') return null

  const won = state.status === 'won'
  function newGame() { reset(); navigate('/game/new') }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative w-full max-w-md bg-space-mid rounded-2xl border border-white/15 shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">{won ? '🏆' : '💀'}</div>
        <h2 className={`text-3xl font-bold mb-2 ${won ? 'text-neon-gold' : 'text-neon-red'}`}>
          {won ? 'Vitória!' : 'Derrota'}
        </h2>
        <p className="text-white/60 mb-1">
          {won ? 'Você dominou a galáxia GalaxyShip!' : 'Seu império caiu. A galáxia foi conquistada.'}
        </p>
        <p className="text-sm text-white/40 mb-6">Turno {state.turn}</p>
        <Button size="lg" className="w-full" onClick={newGame}>🚀 Nova Partida</Button>
      </div>
    </div>
  )
}
