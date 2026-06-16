import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { FleetData, StarSystemData } from '@galaxyship/shared'
import { mapX, mapY } from './coords'

const RACE_COLOR: Record<string, number> = {
  humans: 0x4FC3F7, zorg: 0xEF6E6E, sylar: 0x8effb0,
}

/**
 * Frotas no mapa — desenha um ícone de nave na cor da raça, deslocado da
 * estrela para não sobrepor. Frotas do jogador sempre visíveis; NPC só em
 * sistemas explorados.
 */
export class FleetsLayer extends Container {
  render(
    fleets: Record<string, FleetData>,
    systems: Record<string, StarSystemData>,
    exploredIds: string[],
    playerRaceId: string,
    width: number,
    height: number
  ) {
    this.removeChildren()

    // agrupa frotas por sistema para empilhar quando houver mais de uma
    const bySystem: Record<string, FleetData[]> = {}
    for (const f of Object.values(fleets)) {
      const isPlayer = f.raceId === playerRaceId
      if (!isPlayer && !exploredIds.includes(f.systemId)) continue
      ;(bySystem[f.systemId] ??= []).push(f)
    }

    for (const [systemId, list] of Object.entries(bySystem)) {
      const sys = systems[systemId]
      if (!sys) continue
      const baseX = mapX(sys.x, width)
      const baseY = mapY(sys.y, height)

      list.forEach((fleet, idx) => {
        const color = RACE_COLOR[fleet.raceId] ?? 0xffffff
        const ox = 16 + idx * 18           // empilha à direita da estrela
        const g = new Graphics()
        // casco triangular (nave apontando p/ cima-direita)
        g.poly([0, -8, 6, 7, 0, 3, -6, 7]).fill({ color })
        g.poly([0, -8, 6, 7, 0, 3, -6, 7]).stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
        g.x = baseX + ox
        g.y = baseY + 14

        // contador de naves
        const count = new Text({
          text: String(fleet.shipCount),
          style: new TextStyle({ fill: 0xffffff, fontSize: 10, fontFamily: 'Exo 2, sans-serif', fontWeight: '700' })
        })
        count.x = g.x + 7
        count.y = g.y - 6

        this.addChild(g, count)
      })
    }
  }
}
