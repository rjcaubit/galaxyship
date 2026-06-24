import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage }      from './pages/LoginPage'
import { RaceSelectPage } from './pages/RaceSelectPage'
import { GameScreen }     from './pages/GameScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/login" />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/game/new" element={<RaceSelectPage />} />
      <Route path="/game/:id" element={<GameScreen />} />
    </Routes>
  )
}
