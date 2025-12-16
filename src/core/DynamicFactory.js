// Dynamic factory system - automatic zero-config entity and system registration

import { Auto } from './Auto.js'
import { EntityFactory } from './EntityFactory.js'
import { SystemFactory, serverSystems, clientSystems } from './SystemFactory.js'

export class DynamicFactory {
  static async loadEntities(world, pattern = '../../src/core/entities/*.js') {
    const modules = await Auto.discover(pattern)
    const factory = new EntityFactory(world)

    for (const [name, Entity] of Object.entries(modules)) {
      const key = name[0].toLowerCase() + name.slice(1)
      factory.register(key, Entity)
    }

    return factory
  }

  static async loadSystems(world, isServer = true) {
    const systems = isServer ? serverSystems : clientSystems
    const factory = SystemFactory

    for (const [name, System] of Object.entries(systems)) {
      world.register(name, System)
    }

    return world
  }

  static async loadCustomSystems(world, pattern = '../../src/systems/*.js') {
    const modules = await Auto.discover(pattern)

    for (const [name, System] of Object.entries(modules)) {
      const key = name[0].toLowerCase() + name.slice(1)
      world.register(key, System)
    }

    return world
  }

  static async createWorld(World, isServer = true) {
    const world = new World()
    world.isServer = isServer

    await this.loadSystems(world, isServer)
    await this.loadCustomSystems(world)

    return world
  }

  static async createWorldWithEntities(World, isServer = true) {
    const world = await this.createWorld(World, isServer)
    await this.loadEntities(world)

    return world
  }
}
