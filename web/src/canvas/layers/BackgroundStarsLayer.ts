import { Container, Graphics } from 'pixi.js'

interface Twinkle { g: Graphics; phase: number; speed: number; baseAlpha: number }

/**
 * Campo de estrelas de fundo — centenas de pontos sutis que preenchem o vazio
 * e dão profundidade ao espaço. Puramente decorativo (não interativo).
 */
export class BackgroundStarsLayer extends Container {
  private stars: Twinkle[] = []

  render(seed: number, width: number, height: number, count = 600) {
    this.removeChildren()
    this.stars = []
    let s = seed * 7919 + 13
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

    const tints = [0xffffff, 0xbfd8ff, 0xfff0c0, 0xd9c2ff, 0xc0ffe8]
    for (let i = 0; i < count; i++) {
      const r = rand() * rand() * 1.8 + 0.3          // maioria minúscula, algumas maiores
      const baseAlpha = 0.15 + rand() * 0.55
      const g = new Graphics()
      g.circle(0, 0, r).fill({ color: tints[Math.floor(rand() * tints.length)], alpha: 1 })
      g.x = rand() * width
      g.y = rand() * height
      g.alpha = baseAlpha
      this.addChild(g)
      this.stars.push({ g, phase: rand() * Math.PI * 2, speed: 0.0006 + rand() * 0.0015, baseAlpha })
    }
  }

  tick(elapsed: number) {
    for (const st of this.stars) {
      st.g.alpha = st.baseAlpha * (0.55 + 0.45 * Math.sin(elapsed * st.speed + st.phase))
    }
  }
}
