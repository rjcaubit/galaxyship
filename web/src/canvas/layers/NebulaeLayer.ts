import { Container, Graphics } from 'pixi.js'

export class NebulaeLayer extends Container {
  render(seed: number, width: number, height: number) {
    this.removeChildren()
    let s = seed
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

    const colors = [0x1a0a3a, 0x0a1a3a, 0x0a2a1a, 0x2a0a1a]
    for (let i = 0; i < 8; i++) {
      const g = new Graphics()
      const cx = rand() * width
      const cy = rand() * height
      const rx = 80 + rand() * 180
      const ry = 50 + rand() * 120
      const color = colors[Math.floor(rand() * colors.length)]
      g.ellipse(cx, cy, rx, ry).fill({ color, alpha: 0.12 + rand() * 0.1 })
      this.addChild(g)
    }
  }
}
