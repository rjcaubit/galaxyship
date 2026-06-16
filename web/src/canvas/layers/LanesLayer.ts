import { Container, Graphics } from 'pixi.js'
import type { StarSystemData } from '@galaxyship/shared'
import { mapX, mapY } from './coords'

/**
 * Rotas estelares — liga cada sistema aos vizinhos mais próximos, formando a
 * malha da galáxia (elemento clássico de 4X). Rotas entre sistemas explorados
 * brilham; as demais ficam tênues.
 */
export class LanesLayer extends Container {
  render(systems: Record<string, StarSystemData>, exploredIds: string[], width: number, height: number) {
    this.removeChildren()
    const arr = Object.values(systems)
    const drawn = new Set<string>()
    const g = new Graphics()

    for (const sys of arr) {
      const nearest = arr
        .filter(o => o.id !== sys.id)
        .map(o => ({ o, d: (o.x - sys.x) ** 2 + (o.y - sys.y) ** 2 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)

      for (const { o } of nearest) {
        const key = sys.id < o.id ? `${sys.id}|${o.id}` : `${o.id}|${sys.id}`
        if (drawn.has(key)) continue
        drawn.add(key)

        const explored = exploredIds.includes(sys.id) && exploredIds.includes(o.id)
        g.moveTo(mapX(sys.x, width), mapY(sys.y, height))
         .lineTo(mapX(o.x, width), mapY(o.y, height))
         .stroke({ color: explored ? 0x4FC3F7 : 0x39507a, width: explored ? 1.5 : 1, alpha: explored ? 0.35 : 0.14 })
      }
    }
    this.addChild(g)
  }
}
