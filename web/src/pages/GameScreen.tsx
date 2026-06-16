import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { loadGame } from '../game/gameService'
import { HUDOverlay } from '../panels/HUDOverlay'
import { GalaxyMapCanvas } from '../canvas/GalaxyMapCanvas'
import { Spinner } from '../components/ui'

export function GameScreen() {
  const { id }   = useParams<{ id: string }>()
  const mode     = useAuthStore(s => s.mode)
  const state    = useGameStore(s => s.state)
  const setGame  = useGameStore(s => s.setGame)
  const navigate = useNavigate()

  useEffect(() => {
    if (!mode) { navigate('/login'); return }
    if (!state && id) {
      loadGame(id).then(data => setGame(data.gameId, data.state)).catch(() => navigate('/login'))
    }
  }, [id, mode])

  if (!state) return (
    <div className="min-h-screen bg-space-dark flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-space-dark overflow-hidden">
      <GalaxyMapCanvas />
      <HUDOverlay />
    </div>
  )
}
