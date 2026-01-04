import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('WorldSystemLifecycle')

export class WorldSystemLifecycle {
  constructor(world) {
    this.world = world
  }

  async initializeSystems(options = {}) {
    const keys = Object.keys(this.world).filter(k => this.world[k] && typeof this.world[k].init === 'function')
    logger.info(`Initializing ${keys.length} systems: ${keys.join(', ')}`)
    for (const key of keys) {
      const system = this.world[key]
      try {
        logger.info(`System ${key} init starting`)
        await system.init(options)
        logger.info(`System ${key} init complete`)
      } catch (err) {
        logger.error(`System ${key} init failed`, { error: err.message, stack: err.stack })
      }
    }
  }

  async startSystems() {
    for (const key in this.world) {
      const system = this.world[key]
      if (system && typeof system.start === 'function') {
        try {
          await system.start()
        } catch (err) {
          logger.error(`System ${key} start failed`, { error: err.message })
        }
      }
    }
  }

  destroySystems() {
    for (const key in this.world) {
      const system = this.world[key]
      if (system && typeof system.destroy === 'function') {
        try {
          system.destroy()
        } catch (err) {
          logger.error(`System ${key} destroy failed`, { error: err.message })
        }
      }
    }
  }
}
