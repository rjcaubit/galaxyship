import { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'
import { getPixiApp, destroyPixiApp } from './PixiApp'
import { StarsLayer }   from './layers/StarsLayer'
import { NebulaeLayer } from './layers/NebulaeLayer'
import { useGameStore } from '../store/gameStore'

export function GalaxyMapCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const appRef       = useRef<Application | null>(null)
  const state        = useGameStore(s => s.state)

  useEffect(() => {
    if (!canvasRef.current || !state) return
    let mounted = true

    getPixiApp(canvasRef.current).then(app => {
      if (!mounted) { return }
      appRef.current = app

      const viewport = new Container()
      app.stage.addChild(viewport)

      const nebulae = new NebulaeLayer()
      const stars   = new StarsLayer()
      viewport.addChild(nebulae, stars)

      // Mundo um pouco maior que a tela para dar amplitude ao mapa
      const width  = app.screen.width  * 1.4
      const height = app.screen.height * 1.4

      const colonizedSystemIds = Object.values(state.colonies).map(c => c.systemId)
      nebulae.render(42, width, height)
      stars.render(state.systems, state.exploredSystems, colonizedSystemIds, width, height)

      // H1 — clique em estrela: seleciona e abre ColonyPanel se houver colônia
      Object.keys(state.systems).forEach(id => {
        stars.onStarClick(id, (sysId) => {
          useGameStore.getState().selectSystem(sysId)
          const hasColony = Object.values(useGameStore.getState().state?.colonies ?? {}).some(c => c.systemId === sysId)
          useGameStore.getState().openPanel(hasColony ? 'colony' : null)
        })
      })

      // Drag para mover viewport (mouse + touch de 1 dedo)
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

      // H2 — pinch-to-zoom (2 dedos)
      let lastPinchDist = 0
      app.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          dragging = false
          lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          )
        }
      })
      app.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && lastPinchDist > 0) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          )
          const scale = viewport.scale.x * (dist / lastPinchDist)
          viewport.scale.set(Math.max(0.3, Math.min(3, scale)))
          lastPinchDist = dist
        }
      })

      // Animação de pulso das estrelas
      app.ticker.add(ticker => { stars.tick(ticker.lastTime) })
    })

    return () => {
      mounted = false
      destroyPixiApp()
      appRef.current = null
    }
  }, [!!state])   // recria apenas quando state vai de null → definido

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
}
