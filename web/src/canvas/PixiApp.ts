import { Application } from 'pixi.js'

let _app: Application | null = null
let _initPromise: Promise<Application> | null = null

// Cacheia a PROMISE de init: qualquer chamada concorrente recebe a mesma
// instância, evitando dois renderers Pixi competindo pela mesma canvas.
export async function getPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  if (_app) return _app
  if (_initPromise) return _initPromise
  const app = new Application()
  _initPromise = app.init({
    canvas,
    resizeTo: canvas.parentElement!,
    background: 0x0a0a1a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  }).then(() => { _app = app; return app })
  return _initPromise
}

export function destroyPixiApp() {
  _app?.destroy(false)
  _app = null
  _initPromise = null
}
