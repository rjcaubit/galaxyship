// Mapeamento único usado por estrelas E frotas para que fiquem sempre alinhadas.
export const MAP_MARGIN = 56

export function mapX(x: number, width: number): number {
  return MAP_MARGIN + x * (width - 2 * MAP_MARGIN)
}
export function mapY(y: number, height: number): number {
  return MAP_MARGIN + y * (height - 2 * MAP_MARGIN)
}
