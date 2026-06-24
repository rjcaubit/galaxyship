import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { apiLoadGame } from '../api/gameApi'
import { HUDOverlay } from '../panels/HUDOverlay'
import { GalaxyMapCanvas } from '../canvas/GalaxyMapCanvas'
import { Spinner } from '../components/ui'

export function GameScreen() {
  const { id }   = useParams<{ id: string }>()
  const token    = useAuthStore(s => s.token)
  const state    = useGameStore(s => s.state)
  const setGame  = useGameStore(s => s.setGame)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    if (!state && id) {
      apiLoadGame(token, id).then(data => setGame(data.gameId, data.state)).catch(() => navigate('/login'))
    }
  }, [id, token])

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
