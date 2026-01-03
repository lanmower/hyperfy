import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('WorldSystemLifecycle')

export class WorldSystemLifecycle {
  constructor(world) {
    this.world = world
  }

  async initializeSystems(options = {}) {
    for (const key in this.world) {
      const system = this.world[key]
      if (system && typeof system.init === 'function') {
        try {
          await system.init(options)
        } catch (err) {
          logger.error(`System ${key} init failed`, { error: err.message })
        }
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
