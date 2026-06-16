import { Container, Graphics } from 'pixi.js'

/**
 * Nebulosas de fundo — manchas coloridas suaves que dão atmosfera ao mapa.
 * Cada nebulosa é composta por camadas concêntricas para um gradiente macio.
 */
export class NebulaeLayer extends Container {
  render(seed: number, width: number, height: number) {
    this.removeChildren()
    let s = seed
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

    // paletas vibrantes (núcleo → borda)
    const palettes = [
      0x6a2cc4, // roxo
      0x2c5fc4, // azul
      0x1f9c8a, // teal
      0xc42c7a, // magenta
      0x2c8ac4, // ciano
      0x7a3cd0, // violeta
    ]

    const blobCount = 10
    for (let i = 0; i < blobCount; i++) {
      const cx = rand() * width
      const cy = rand() * height
      const baseR = 160 + rand() * 320
      const color = palettes[Math.floor(rand() * palettes.length)]
      const stretch = 0.6 + rand() * 0.8

      // 4 camadas concêntricas decrescentes em raio e crescentes em alpha
      for (let layer = 0; layer < 4; layer++) {
        const t = layer / 3
        const rx = baseR * (1 - t * 0.65)
        const ry = rx * stretch
        const alpha = 0.04 + t * 0.07
        const g = new Graphics()
        g.ellipse(cx, cy, rx, ry).fill({ color, alpha })
        this.addChild(g)
      }
    }
  }
}
