import { Application } from 'pixi.js'

let _app: Application | null = null

export async function getPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  if (_app) return _app
  const app = new Application()
  await app.init({
    canvas,
    resizeTo: canvas.parentElement!,
    background: 0x0a0a1a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  })
  _app = app
  return app
}

export function destroyPixiApp() {
  _app?.destroy(false)
  _app = null
}
