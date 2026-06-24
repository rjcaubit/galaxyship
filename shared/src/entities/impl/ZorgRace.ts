import { Race } from '../Race'
import type { Planet } from '../Planet'

export class ZorgRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'zorg',
      name: 'Zorg',
      description: 'Guerreiros implacáveis. Bônus em combate, penalidade diplomática.',
      bonuses:   { attack: 30, defense: 20, production: 10 },
      penalties: { diplomacy: -30, research: -10 },
      traits:    ['militarist', 'industrialist'],
      color:     '#EF9A9A',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean       { return false }
  getDiplomacyModifier(_other: Race): number  { return -30 }
  canColonizePlanet(planet: Planet): boolean  { return planet.type !== 'gas_giant' }
  static override deserialize(data: Record<string, unknown>): ZorgRace {
    return new ZorgRace(data.homeSystemId as string | undefined)
  }
}
