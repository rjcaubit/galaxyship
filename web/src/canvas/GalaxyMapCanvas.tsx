import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { getPixiApp, destroyPixiApp } from './PixiApp'
import { StarsLayer }           from './layers/StarsLayer'
import { NebulaeLayer }         from './layers/NebulaeLayer'
import { BackgroundStarsLayer } from './layers/BackgroundStarsLayer'
import { LanesLayer }           from './layers/LanesLayer'
import { FleetsLayer }          from './layers/FleetsLayer'
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

  // Re-renderiza todas as camadas para um dado tamanho de tela
  function renderWorld(state: GameState, w: number, h: number) {
    const L = layersRef.current
    if (!L) return
    const colonized = Object.values(state.colonies).map(c => c.systemId)
    L.nebulae.render(42, w, h)
    L.bgStars.render(7, w, h, 1000)
    L.lanes.render(state.systems, state.exploredSystems, w, h)
    L.stars.render(state.systems, state.exploredSystems, colonized, w, h)
    L.fleets.render(state.fleets, state.systems, state.exploredSystems, state.playerRaceId, w, h)
    // (re)liga cliques nas estrelas
    Object.keys(state.systems).forEach(id => {
      L.stars.onStarClick(id, (sysId) => {
        useGameStore.getState().selectSystem(sysId)
        const hasColony = Object.values(useGameStore.getState().state?.colonies ?? {}).some(c => c.systemId === sysId)
        useGameStore.getState().openPanel(hasColony ? 'colony' : null)
      })
    })
  }

  useEffect(() => {
    if (!canvasRef.current || !hasState) return
    let mounted = true

    getPixiApp(canvasRef.current).then(app => {
      if (!mounted) return
      appRef.current = app
      const state = useGameStore.getState().state!

      const viewport = new Container()
      app.stage.addChild(viewport)

      const layers = {
        nebulae: new NebulaeLayer(),
        bgStars: new BackgroundStarsLayer(),
        lanes:   new LanesLayer(),
        stars:   new StarsLayer(),
        fleets:  new FleetsLayer(),
      }
      viewport.addChild(layers.nebulae, layers.bgStars, layers.lanes, layers.stars, layers.fleets)
      layersRef.current = layers

      renderWorld(state, app.screen.width, app.screen.height)

      // Re-renderiza ao redimensionar a janela (Pixi já ajusta o canvas)
      app.renderer.on('resize', (w: number, h: number) => {
        const s = useGameStore.getState().state
        if (s) renderWorld(s, w, h)
      })

      // Drag para mover viewport (mouse + 1 dedo)
      let dragging = false, lastX = 0, lastY = 0
      app.canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY })
      app.canvas.addEventListener('pointermove', e => {
        if (!dragging) return
        viewport.x += e.clientX - lastX
        viewport.y += e.clientY - lastY
        lastX = e.clientX; lastY = e.clientY
      })
      app.canvas.addEventListener('pointerup',     () => { dragging = false })
      app.canvas.addEventListener('pointercancel', () => { dragging = false })

      // Pinch-to-zoom (2 dedos)
      let lastPinchDist = 0
      app.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          dragging = false
          lastPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        }
      })
      app.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && lastPinchDist > 0) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
          const scale = viewport.scale.x * (dist / lastPinchDist)
          viewport.scale.set(Math.max(0.4, Math.min(3, scale)))
          lastPinchDist = dist
        }
      })

      // Animação contínua (pulso das estrelas + cintilar do fundo)
      app.ticker.add(ticker => {
        layers.stars.tick(ticker.lastTime)
        layers.bgStars.tick(ticker.lastTime)
      })
    })

    return () => {
      mounted = false
      destroyPixiApp()
      appRef.current = null
      layersRef.current = null
    }
  }, [hasState])

  // Re-renderiza ao mudar o estado (após cada turno) sem recriar o canvas
  const gameState = useGameStore(s => s.state)
  useEffect(() => {
    const app = appRef.current
    if (!gameState || !app || !layersRef.current) return
    renderWorld(gameState, app.screen.width, app.screen.height)
  }, [gameState])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
}
