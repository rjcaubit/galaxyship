import type { StarSystemData, PlanetData } from '../types/game'
import type { StarType, PlanetType, PlanetSize, Richness } from '../types/enums'

function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

const STAR_TYPES: StarType[]  = ['yellow', 'red', 'blue', 'white', 'orange']
const PLANET_TYPES: PlanetType[] = ['terran', 'desert', 'ocean', 'volcanic', 'frozen', 'dead']
const SIZES: PlanetSize[]     = ['tiny', 'small', 'medium', 'large', 'huge']
const RICHNESS: Richness[]    = ['ultra_poor', 'poor', 'abundant', 'rich', 'ultra_rich']

const STAR_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
]

export function generateGalaxy(seed: number, systemCount = 55): Record<string, StarSystemData> {
  const rand = seededRandom(seed)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const systems: Record<string, StarSystemData> = {}

  for (let i = 0; i < systemCount; i++) {
    const id = `sys_${i}`
    const planetCount = 1 + Math.floor(rand() * 5)
    const planets: PlanetData[] = []

    for (let p = 0; p < planetCount; p++) {
      planets.push({
        id:        `${id}_p${p}`,
        name:      `${STAR_NAMES[i % STAR_NAMES.length]} ${['I','II','III','IV','V'][p]}`,
        type:      pick(PLANET_TYPES),
        size:      pick(SIZES),
        richness:  pick(RICHNESS),
        gravity:   pick(['low', 'normal', 'high'] as const),
        radiation: Math.floor(rand() * 80)
      })
    }

    const suffix = Math.floor(i / STAR_NAMES.length) + 1
    systems[id] = {
      id,
      name: `${STAR_NAMES[i % STAR_NAMES.length]}${suffix > 1 ? ' ' + suffix : ''}`,
      x:        rand(),
      y:        rand(),
      starType: pick(STAR_TYPES),
      planets
    }
  }

  return systems
}
