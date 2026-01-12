import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('InitializationHelper')

export class InitializationHelper {
  static async invokeSystemsMethod(world, methodName, ...args) {
    for (const key in world) {
      const system = world[key]
      if (system && typeof system[methodName] === 'function') {
        try {
          await system[methodName](...args)
        } catch (err) {
          logger.error(`System ${key} ${methodName} failed`, { error: err.message })
        }
      }
    }
  }

  static async executeHooks(hooks, hookName, ...args) {
    try {
      await hooks.execute(hookName, ...args)
    } catch (err) {
      logger.error(`Hook ${hookName} execution failed`, { error: err.message })
    }
  }

  static sortSystems(systemConfigs) {
    return systemConfigs.sort((a, b) => (b.priority || 50) - (a.priority || 50))
  }

  static filterSystemsByPlatform(systemConfigs, platform) {
    return systemConfigs.filter(config => {
      if (!config.platforms) return true
      return config.platforms.includes(platform)
    })
  }

  static validateSystem(name, SystemClass) {
    if (!SystemClass) {
      throw new Error(`Invalid system configuration for ${name}: class is required`)
    }
    return true
  }
}
