export interface EntityParams {
  id: string
  name: string
}

export abstract class Entity {
  readonly id: string
  readonly name: string

  constructor(params: EntityParams) {
    this.id   = params.id
    this.name = params.name
  }

  abstract serialize(): Record<string, unknown>

  static deserialize(_data: Record<string, unknown>): Entity {
    throw new Error('Subclass must implement static deserialize()')
  }
}
