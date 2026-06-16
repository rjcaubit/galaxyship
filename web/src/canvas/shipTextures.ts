import { Assets } from 'pixi.js'

// Sprites Kenney (CC0) em web/public/ships. Brancos/claros → tingíveis por raça.
export const SHIP_URLS = {
  warship: '/ships/ship_C.png',     // nave do jogador
  npcWar:  '/ships/enemy_D.png',    // nave de guerra NPC (silhueta alien)
  colony:  '/ships/ship_G.png',     // nave colônia
  scout:   '/ships/ship_K.png',     // batedor
  station: '/ships/station_C.png',  // marcador de colônia
} as const

export const RACE_COLOR: Record<string, number> = {
  humans: 0x6FC8FF, zorg: 0xFF7A7A, sylar: 0x9CF5B0,
}

let loaded = false
/** Pré-carrega todas as texturas de nave uma única vez. */
export async function preloadShipTextures(): Promise<void> {
  if (loaded) return
  await Assets.load(Object.values(SHIP_URLS))
  loaded = true
}
