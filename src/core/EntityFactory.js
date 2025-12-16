// Entity factory - unified entity creation and registration

import { App } from './entities/App.js'
import { PlayerLocal } from './entities/PlayerLocal.js'
import { PlayerRemote } from './entities/PlayerRemote.js'

const types = {
  app: App,
  playerLocal: PlayerLocal,
  playerRemote: PlayerRemote,
}

export class EntityFactory {
  constructor(world) {
    this.world = world
  }

  create(type, data = {}, local = false) {
    const Type = types[type]
    if (!Type) throw new Error(`Unknown entity type: ${type}`)
    return new Type(this.world, data, local)
  }

  register(name, Type) {
    types[name] = Type
    return this
  }

  get(type) {
    return types[type]
  }

  has(type) {
    return type in types
  }

  list() {
    return Object.keys(types)
  }
}

export { types as entityTypes }
