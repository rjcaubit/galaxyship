import { Race } from '../Race'
import type { Planet } from '../Planet'

export class HumanRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'humans',
      name: 'Humanos',
      description: 'Adaptáveis e diplomáticos. Crescem em qualquer planeta habitável.',
      bonuses:   { diplomacy: 25, growth: 10 },
      penalties: { research: -10 },
      traits:    ['creative', 'diplomatic'],
      color:     '#4FC3F7',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean          { return true }
  getDiplomacyModifier(_other: Race): number     { return 25 }
  canColonizePlanet(planet: Planet): boolean     { return planet.type !== 'dead' && planet.type !== 'gas_giant' }
  static override deserialize(data: Record<string, unknown>): HumanRace {
    return new HumanRace(data.homeSystemId as string | undefined)
  }
}
