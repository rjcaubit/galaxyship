import { Race } from '../Race'
import type { Planet } from '../Planet'

export class SylarRace extends Race {
  constructor(homeSystemId?: string) {
    super({
      id: 'sylar',
      name: 'Sylar',
      description: 'Cientistas expansionistas. Colonizam qualquer planeta, incluindo hostis.',
      bonuses:   { research: 30, growth: 20 },
      penalties: { attack: -20, production: -10 },
      traits:    ['scientist', 'expansionist'],
      color:     '#A5D6A7',
      homeSystemId
    })
  }
  canDiplomatize(_other: Race): boolean       { return true }
  getDiplomacyModifier(_other: Race): number  { return 10 }
  canColonizePlanet(_planet: Planet): boolean { return true }
  static override deserialize(data: Record<string, unknown>): SylarRace {
    return new SylarRace(data.homeSystemId as string | undefined)
  }
}
