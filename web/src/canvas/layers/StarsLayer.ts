import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { StarSystemData } from '@galaxyship/shared'

const STAR_COLORS: Record<string, number> = {
  yellow: 0xFFD54F, red: 0xEF9A9A, blue: 0x4FC3F7, white: 0xFFFFFF, orange: 0xFFB74D
}

export class StarsLayer extends Container {
  private starGraphics: Map<string, { g: Graphics; t: Text; pulsePhase: number }> = new Map()

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
      const px = sys.x * width
      const py = sys.y * height
      const color = explored ? (STAR_COLORS[sys.starType] ?? 0xffffff) : 0x444466

      const g = new Graphics()
      g.circle(0, 0, explored ? 6 : 3).fill({ color, alpha: explored ? 1 : 0.4 })
      g.circle(0, 0, explored ? 12 : 6).fill({ color, alpha: 0.1 })
      if (colonized) g.circle(0, 0, 14).stroke({ color: 0xA5D6A7, width: 2 })
      g.x = px; g.y = py
      g.eventMode = 'static'
      g.cursor    = 'pointer'
      g.hitArea   = { contains: (x: number, y: number) => (x * x + y * y) <= 18 * 18 }

      const label = new Text({
        text: explored ? sys.name : '???',
        style: new TextStyle({ fill: explored ? 0xffffff : 0x555577, fontSize: 10, fontFamily: 'Exo 2, sans-serif' })
      })
      label.x = px + 12; label.y = py - 6

      this.addChild(g, label)
      this.starGraphics.set(sys.id, { g, t: label, pulsePhase: (sys.x + sys.y) * Math.PI * 4 })
    }
  }

  tick(elapsed: number) {
    for (const { g, pulsePhase } of this.starGraphics.values()) {
      g.alpha = 0.8 + 0.2 * Math.sin(elapsed * 0.002 + pulsePhase)
    }
  }

  onStarClick(systemId: string, callback: (id: string) => void) {
    const entry = this.starGraphics.get(systemId)
    if (entry) entry.g.on('pointertap', () => callback(systemId))
  }
}
