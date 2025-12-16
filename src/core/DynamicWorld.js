// Dynamic world creation - zero-config complete world setup

import { DynamicFactory } from './DynamicFactory.js'
import { Bootstrap } from './Bootstrap.js'
import { Config } from './Config.js'

export class DynamicWorld {
  static async createServerWorld(World) {
    const world = await DynamicFactory.createWorldWithEntities(World, true)

    if (!world.isInitialized) {
      await this.initializeServerServices(world)
      world.isInitialized = true
    }

    return world
  }

  static async createClientWorld(World) {
    const world = await DynamicFactory.createWorldWithEntities(World, false)

    if (!world.isInitialized) {
      await this.initializeClientServices(world)
      world.isInitialized = true
    }

    return world
  }

  static async initializeServerServices(world) {
    const boot = new Bootstrap('ServerServices')

    const services = await boot.init(world)
    world.services = services

    await boot.start(world, services)
  }

  static async initializeClientServices(world) {
    const boot = new Bootstrap('ClientServices')

    const services = await boot.init(world)
    world.services = services

    await boot.start(world, services)
  }

  static configure(config = {}) {
    const defaults = {
      port: Config.env('PORT', 'number', 3000),
      env: Config.env('NODE_ENV', 'string', 'development'),
      world: Config.env('WORLD', 'string', './world'),
      saveInterval: Config.env('SAVE_INTERVAL', 'number', 60),
      pingRate: Config.env('PING_RATE', 'number', 1),
    }

    return { ...defaults, ...config }
  }
}
