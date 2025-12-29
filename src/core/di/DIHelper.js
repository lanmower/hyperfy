import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DIHelper')

export class DIHelper {
  static getService(world, serviceName) {
    if (!world || !world.di) {
      logger.error('getService called without valid world DI container', { serviceName })
      return null
    }

    try {
      return world.di.get(serviceName)
    } catch (err) {
      logger.error('Failed to get service', { serviceName, error: err.message })
      return null
    }
  }

  static hasService(world, serviceName) {
    if (!world || !world.di) return false
    return world.di.has(serviceName)
  }

  static getServiceOrThrow(world, serviceName) {
    if (!world || !world.di) {
      throw new Error('getServiceOrThrow called without valid world DI container')
    }
    return world.di.get(serviceName)
  }

  static setupDIProxy(system, world) {
    const handler = {
      get(target, prop) {
        if (prop in target) {
          return Reflect.get(target, prop)
        }
        const service = DIHelper.getService(world, prop)
        if (service) {
          return service
        }
        return undefined
      }
    }
    return new Proxy(system, handler)
  }

  static validateDependencies(system, requiredServices) {
    if (!system || !system.world) {
      throw new Error('System missing world reference')
    }

    const missing = []
    for (const serviceName of requiredServices) {
      if (!DIHelper.hasService(system.world, serviceName)) {
        missing.push(serviceName)
      }
    }

    if (missing.length > 0) {
      logger.error('System missing required dependencies', {
        system: system.constructor.name,
        missing
      })
      throw new Error(`System missing dependencies: ${missing.join(', ')}`)
    }
  }

  static getMultiple(world, serviceNames) {
    const result = {}
    for (const name of serviceNames) {
      result[name] = DIHelper.getService(world, name)
    }
    return result
  }

  static createServiceProxy(services) {
    return new Proxy({}, {
      get(target, prop) {
        return services[prop]
      }
    })
  }
}
