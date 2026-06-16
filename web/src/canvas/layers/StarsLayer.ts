import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { StarSystemData } from '@galaxyship/shared'
import { mapX, mapY } from './coords'

const STAR_COLORS: Record<string, number> = {
  yellow: 0xFFD54F, red: 0xEF6E6E, blue: 0x4FC3F7, white: 0xFFFFFF, orange: 0xFFB74D
}

export class StarsLayer extends Container {
  private starGraphics: Map<string, { glow: Graphics; pulsePhase: number }> = new Map()

  render(
    systems: Record<string, StarSystemData>,
    exploredIds: string[],
    colonizedSystemIds: string[],
    width: number,
    height: number
  ) {
    this.removeChildren()
    this.starGraphics.clear()

    for (const sys of Object.values(systems)) {
      const explored = exploredIds.includes(sys.id)
      const colonized = colonizedSystemIds.includes(sys.id)
      const px = mapX(sys.x, width)
      const py = mapY(sys.y, height)
      const color = explored ? (STAR_COLORS[sys.starType] ?? 0xffffff) : 0x5b5b80

      // halo externo (glow) — animado
      const glow = new Graphics()
      glow.circle(0, 0, explored ? 26 : 12).fill({ color, alpha: 0.10 })
      glow.circle(0, 0, explored ? 16 : 8).fill({ color, alpha: 0.18 })
      glow.x = px; glow.y = py

      // corpo da estrela
      const body = new Graphics()
      if (colonized) body.circle(0, 0, 17).stroke({ color: 0x8effb0, width: 2.5, alpha: 0.9 })
      body.circle(0, 0, explored ? 8 : 4).fill({ color })
      if (explored) body.circle(0, 0, 3.5).fill({ color: 0xffffff, alpha: 0.9 }) // núcleo quente
      body.x = px; body.y = py
      body.eventMode = 'static'
      body.cursor    = 'pointer'
      body.hitArea   = { contains: (x: number, y: number) => (x * x + y * y) <= 22 * 22 }
      ;(body as Graphics & { __systemId: string }).__systemId = sys.id

      const label = new Text({
        text: explored ? sys.name : '',
        style: new TextStyle({
          fill: 0xffffff, fontSize: 13, fontFamily: 'Exo 2, sans-serif',
          fontWeight: '600', dropShadow: { color: 0x000000, blur: 4, distance: 0, alpha: 0.8 },
        })
      })
      label.x = px + 14; label.y = py - 8

      this.addChild(glow, body, label)
      this.starGraphics.set(sys.id, { glow, pulsePhase: (sys.x + sys.y) * Math.PI * 4 })
    }
  }

  tick(elapsed: number) {
    for (const { glow, pulsePhase } of this.starGraphics.values()) {
      const k = 0.7 + 0.3 * Math.sin(elapsed * 0.002 + pulsePhase)
      glow.scale.set(k)
    }
  }

  onStarClick(systemId: string, callback: (id: string) => void) {
    // encontra o body correspondente (tem __systemId)
    for (const child of this.children) {
      const sid = (child as Graphics & { __systemId?: string }).__systemId
      if (sid === systemId) child.on('pointertap', () => callback(systemId))
    }
  }
}
