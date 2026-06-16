import { Container, Sprite, Text, TextStyle, Graphics, Texture } from 'pixi.js'
import type { GameState, FleetData } from '@galaxyship/shared'
import { mapX, mapY } from './coords'
import { SHIP_URLS, RACE_COLOR } from '../shipTextures'

function texFor(fleet: FleetData, isPlayer: boolean): Texture {
  let url: string = SHIP_URLS.warship
  if (fleet.colonists > 0) url = SHIP_URLS.colony
  else if (fleet.scouts > 0) url = SHIP_URLS.scout
  else if (fleet.warships > 0) url = isPlayer ? SHIP_URLS.warship : SHIP_URLS.npcWar
  return Texture.from(url)
}

/** Posição de tela de uma frota (parada no sistema ou interpolada na rota). */
function fleetPos(state: GameState, fleet: FleetData, w: number, h: number): { x: number; y: number; angle: number } {
  if (fleet.etaTurns > 0 && fleet.destinationId && fleet.originSystemId) {
    const o = state.systems[fleet.originSystemId]
    const d = state.systems[fleet.destinationId]
    if (o && d) {
      const prog = fleet.etaTotal > 0 ? 1 - fleet.etaTurns / fleet.etaTotal : 1
      const x = mapX(o.x + (d.x - o.x) * prog, w)
      const y = mapY(o.y + (d.y - o.y) * prog, h)
      const angle = Math.atan2(d.y - o.y, d.x - o.x) + Math.PI / 2
      return { x, y, angle }
    }
  }
  const sys = state.systems[fleet.systemId]
  return { x: mapX(sys.x, w), y: mapY(sys.y, h), angle: 0 }
}

export class FleetsLayer extends Container {
  private hit: Map<string, Sprite> = new Map()

  render(state: GameState, w: number, h: number, selectedFleetId: string | null) {
    this.removeChildren()
    this.hit.clear()
    // agrupa frotas paradas por sistema para empilhar visualmente
    const stackIdx: Record<string, number> = {}

    for (const fleet of Object.values(state.fleets)) {
      const isPlayer = fleet.raceId === state.playerRaceId
      // visibilidade: frotas do jogador sempre; NPC só em sistema explorado
      if (!isPlayer && !state.exploredSystems.includes(fleet.systemId)) continue

      const { x, y, angle } = fleetPos(state, fleet, w, h)
      const traveling = fleet.etaTurns > 0
      const key = traveling ? `t_${fleet.id}` : fleet.systemId
      const idx = stackIdx[key] = (stackIdx[key] ?? -1) + 1
      const ox = traveling ? 0 : 18 + idx * 16   // empilha à direita da estrela

      // rota da frota em viagem (linha pontilhada tênue)
      if (traveling && fleet.originSystemId && fleet.destinationId) {
        const d = state.systems[fleet.destinationId]
        const line = new Graphics()
        line.moveTo(x, y).lineTo(mapX(d.x, w), mapY(d.y, h))
          .stroke({ color: RACE_COLOR[fleet.raceId] ?? 0xffffff, width: 1, alpha: 0.3 })
        this.addChild(line)
      }

      const sprite = new Sprite(texFor(fleet, isPlayer))
      sprite.anchor.set(0.5)
      sprite.tint = RACE_COLOR[fleet.raceId] ?? 0xffffff
      sprite.scale.set(0.42)
      sprite.rotation = angle
      sprite.x = x + ox
      sprite.y = y + (traveling ? 0 : 16)
      if (isPlayer) { sprite.eventMode = 'static'; sprite.cursor = 'pointer' }

      // anel de seleção
      if (fleet.id === selectedFleetId) {
        const ring = new Graphics()
        ring.circle(sprite.x, sprite.y, 16).stroke({ color: 0xFFD54F, width: 2.5 })
        this.addChild(ring)
      }

      this.addChild(sprite)
      if (isPlayer) this.hit.set(fleet.id, sprite)

      // badge: nº de naves de guerra ou ícone de colônia/batedor
      const badgeText = fleet.warships > 0 ? String(fleet.warships)
        : fleet.colonists > 0 ? '⚲' : '∇'
      const badge = new Text({
        text: badgeText,
        style: new TextStyle({ fill: 0xffffff, fontSize: 10, fontFamily: 'Exo 2, sans-serif', fontWeight: '700',
          dropShadow: { color: 0x000000, blur: 3, distance: 0, alpha: 0.9 } }),
      })
      badge.x = sprite.x + 8; badge.y = sprite.y - 14
      this.addChild(badge)

      // ETA em viagem
      if (traveling) {
        const eta = new Text({ text: `${fleet.etaTurns}⏳`,
          style: new TextStyle({ fill: 0xFFD54F, fontSize: 9, fontFamily: 'Exo 2, sans-serif' }) })
        eta.x = sprite.x + 8; eta.y = sprite.y + 4
        this.addChild(eta)
      }
    }
  }

  onFleetClick(fleetId: string, cb: (id: string) => void) {
    const s = this.hit.get(fleetId)
    if (s) s.on('pointertap', () => cb(fleetId))
  }

  fleetIds(): string[] { return [...this.hit.keys()] }
}
