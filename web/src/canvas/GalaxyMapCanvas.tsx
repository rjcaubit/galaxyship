import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { getPixiApp, destroyPixiApp } from './PixiApp'
import { StarsLayer }           from './layers/StarsLayer'
import { NebulaeLayer }         from './layers/NebulaeLayer'
import { BackgroundStarsLayer } from './layers/BackgroundStarsLayer'
import { LanesLayer }           from './layers/LanesLayer'
import { FleetsLayer }          from './layers/FleetsLayer'
import { preloadShipTextures }  from './shipTextures'
import { useGameStore } from '../store/gameStore'
import type { GameState } from '@galaxyship/shared'

export function GalaxyMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef    = useRef<Application | null>(null)
  const layersRef = useRef<{
    nebulae: NebulaeLayer; bgStars: BackgroundStarsLayer; lanes: LanesLayer;
    stars: StarsLayer; fleets: FleetsLayer
  } | null>(null)
  const hasState = !!useGameStore(s => s.state)

  function onStarTap(sysId: string) {
    const st = useGameStore.getState()
    if (st.moveMode && st.selectedFleet) {
      st.addOrder({ type: 'MOVE_FLEET', fleetId: st.selectedFleet, targetSystemId: sysId })
      st.setMoveMode(false)
    }
    st.selectSystem(sysId)
    st.openPanel('system')
  }

  function onFleetTap(fleetId: string) {
    const st = useGameStore.getState()
    const fleet = st.state?.fleets[fleetId]
    if (!fleet) return
    st.selectFleet(fleetId)
    st.setMoveMode(true)
    st.selectSystem(fleet.systemId)
    st.openPanel('system')
  }

  function renderWorld(state: GameState, w: number, h: number) {
    const L = layersRef.current
    if (!L) return
    const colonized = Object.values(state.colonies).filter(c => c.raceId === state.playerRaceId).map(c => c.systemId)
    const selectedFleet = useGameStore.getState().selectedFleet
    L.nebulae.render(42, w, h)
    L.bgStars.render(7, w, h, 1000)
    L.lanes.render(state.systems, state.exploredSystems, w, h)
    L.stars.render(state.systems, state.exploredSystems, colonized, w, h)
    L.fleets.render(state, w, h, selectedFleet)
    Object.keys(state.systems).forEach(id => L.stars.onStarClick(id, onStarTap))
    L.fleets.fleetIds().forEach(id => L.fleets.onFleetClick(id, onFleetTap))
  }

  useEffect(() => {
    if (!canvasRef.current || !hasState) return
    let mounted = true

    Promise.all([getPixiApp(canvasRef.current), preloadShipTextures()]).then(([app]) => {
      if (!mounted) return
      appRef.current = app
      const state = useGameStore.getState().state!

      const viewport = new Container()
      app.stage.addChild(viewport)
      const layers = {
        nebulae: new NebulaeLayer(), bgStars: new BackgroundStarsLayer(),
        lanes: new LanesLayer(), stars: new StarsLayer(), fleets: new FleetsLayer(),
      }
      viewport.addChild(layers.nebulae, layers.bgStars, layers.lanes, layers.stars, layers.fleets)
      layersRef.current = layers

      renderWorld(state, app.screen.width, app.screen.height)

      app.renderer.on('resize', (w: number, h: number) => {
        const s = useGameStore.getState().state
        if (s) renderWorld(s, w, h)
      })

      // Drag (mouse + 1 dedo)
      let dragging = false, moved = false, lastX = 0, lastY = 0
      app.canvas.addEventListener('pointerdown', e => { dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY })
      app.canvas.addEventListener('pointermove', e => {
        if (!dragging) return
        const dx = e.clientX - lastX, dy = e.clientY - lastY
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
        viewport.x += dx; viewport.y += dy
        lastX = e.clientX; lastY = e.clientY
      })
      app.canvas.addEventListener('pointerup',     () => { dragging = false })
      app.canvas.addEventListener('pointercancel', () => { dragging = false })

      // Pinch-zoom (2 dedos)
      let lastPinch = 0
      app.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) { dragging = false
          lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) }
      })
      app.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && lastPinch > 0) {
          const dst = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
          viewport.scale.set(Math.max(0.4, Math.min(3, viewport.scale.x * (dst / lastPinch))))
          lastPinch = dst
        }
      })

      app.ticker.add(ticker => { layers.stars.tick(ticker.lastTime); layers.bgStars.tick(ticker.lastTime) })
    })

    return () => { mounted = false; destroyPixiApp(); appRef.current = null; layersRef.current = null }
  }, [hasState])

  // Re-renderiza ao mudar estado, seleção de frota ou modo mover
  const gameState = useGameStore(s => s.state)
  const selectedFleet = useGameStore(s => s.selectedFleet)
  const moveMode = useGameStore(s => s.moveMode)
  useEffect(() => {
    const app = appRef.current
    if (gameState && app && layersRef.current) renderWorld(gameState, app.screen.width, app.screen.height)
  }, [gameState, selectedFleet, moveMode])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
}
