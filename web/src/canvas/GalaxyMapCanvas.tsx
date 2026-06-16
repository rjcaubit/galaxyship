import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { getPixiApp, destroyPixiApp } from './PixiApp'
import { StarsLayer }          from './layers/StarsLayer'
import { NebulaeLayer }        from './layers/NebulaeLayer'
import { BackgroundStarsLayer } from './layers/BackgroundStarsLayer'
import { FleetsLayer }         from './layers/FleetsLayer'
import { useGameStore } from '../store/gameStore'

export function GalaxyMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef    = useRef<Application | null>(null)
  const starsRef  = useRef<StarsLayer | null>(null)
  const fleetsRef = useRef<FleetsLayer | null>(null)
  const dimsRef   = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const hasState  = !!useGameStore(s => s.state)

  // Inicializa o canvas uma única vez quando o estado existe
  useEffect(() => {
    if (!canvasRef.current || !hasState) return
    let mounted = true

    getPixiApp(canvasRef.current).then(app => {
      if (!mounted) return
      appRef.current = app
      const state = useGameStore.getState().state!

      const viewport = new Container()
      app.stage.addChild(viewport)

      const nebulae = new NebulaeLayer()
      const bgStars = new BackgroundStarsLayer()
      const stars   = new StarsLayer()
      const fleets  = new FleetsLayer()
      viewport.addChild(nebulae, bgStars, stars, fleets)
      starsRef.current  = stars
      fleetsRef.current = fleets

      // Mundo = tela inteira (preenche o desktop); margem fica no mapeamento
      const width  = app.screen.width
      const height = app.screen.height
      dimsRef.current = { w: width, h: height }

      const colonizedSystemIds = Object.values(state.colonies).map(c => c.systemId)
      nebulae.render(42, width, height)
      bgStars.render(7, width, height)
      stars.render(state.systems, state.exploredSystems, colonizedSystemIds, width, height)
      fleets.render(state.fleets, state.systems, state.exploredSystems, state.playerRaceId, width, height)

      // Clique em estrela: seleciona e abre ColonyPanel se houver colônia
      Object.keys(state.systems).forEach(id => {
        stars.onStarClick(id, (sysId) => {
          useGameStore.getState().selectSystem(sysId)
          const hasColony = Object.values(useGameStore.getState().state?.colonies ?? {}).some(c => c.systemId === sysId)
          useGameStore.getState().openPanel(hasColony ? 'colony' : null)
        })
      })

      // Centraliza o viewport no sistema home
      const home = state.exploredSystems[0]
      const homeSys = home ? state.systems[home] : null
      if (homeSys) {
        viewport.x = width  / 2 - (56 + homeSys.x * (width  - 112))
        viewport.y = height / 2 - (56 + homeSys.y * (height - 112))
      }

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
        stars.tick(ticker.lastTime)
        bgStars.tick(ticker.lastTime)
      })
    })

    return () => {
      mounted = false
      destroyPixiApp()
      appRef.current = null
      starsRef.current = null
      fleetsRef.current = null
    }
  }, [hasState])

  // Re-renderiza estrelas e frotas quando o estado muda (após cada turno),
  // sem recriar o canvas — assim as naves se movem e novos sistemas aparecem.
  const gameState = useGameStore(s => s.state)
  useEffect(() => {
    if (!gameState || !starsRef.current || !fleetsRef.current) return
    const { w, h } = dimsRef.current
    if (!w || !h) return
    const colonizedSystemIds = Object.values(gameState.colonies).map(c => c.systemId)
    starsRef.current.render(gameState.systems, gameState.exploredSystems, colonizedSystemIds, w, h)
    Object.keys(gameState.systems).forEach(id => {
      starsRef.current!.onStarClick(id, (sysId) => {
        useGameStore.getState().selectSystem(sysId)
        const hasColony = Object.values(useGameStore.getState().state?.colonies ?? {}).some(c => c.systemId === sysId)
        useGameStore.getState().openPanel(hasColony ? 'colony' : null)
      })
    })
    fleetsRef.current.render(gameState.fleets, gameState.systems, gameState.exploredSystems, gameState.playerRaceId, w, h)
  }, [gameState])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
}
