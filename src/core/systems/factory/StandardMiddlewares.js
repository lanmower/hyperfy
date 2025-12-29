import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('StandardMiddlewares')

export class StandardMiddlewares {
  static createLoggerMiddleware(verbose = false) {
    return (system, world, options) => {
      if (verbose) {
        logger.info('Creating system', { system: system.constructor.name })
      }

      const originalInit = system.init?.bind(system)
      const originalStart = system.start?.bind(system)

      if (originalInit) {
        system.init = async function (...args) {
          if (verbose) {
            logger.info('Initializing system', { system: system.constructor.name })
          }
          const result = await originalInit(...args)
          if (verbose) {
            logger.info('System initialized', { system: system.constructor.name })
          }
          return result
        }
      }

      if (originalStart) {
        system.start = async function (...args) {
          if (verbose) {
            logger.info('Starting system', { system: system.constructor.name })
          }
          const result = await originalStart(...args)
          if (verbose) {
            logger.info('System started', { system: system.constructor.name })
          }
          return result
        }
      }

      return system
    }
  }

  static createErrorBoundaryMiddleware() {
    return (system, world, options) => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(system))

      for (const method of methods) {
        if (method === 'constructor') continue

        const original = system[method]
        if (typeof original !== 'function') continue

        system[method] = function (...args) {
          try {
            const result = original.apply(system, args)

            if (result instanceof Promise) {
              return result.catch(err => {
                logger.error('Error in system method', { system: system.constructor.name, method, error: err.message })
                throw err
              })
            }

            return result
          } catch (err) {
            logger.error('Error in system method', { system: system.constructor.name, method, error: err.message })
            throw err
          }
        }
      }

      return system
    }
  }

  static createConditionalMiddleware(condition) {
    return (system, world, options) => {
      if (!condition(world, options)) {
        return createNoOpProxy(system)
      }
      return system
    }
  }
}

function createNoOpProxy(system) {
  return new Proxy(system, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return function (...args) {
          return undefined
        }
      }
      return target[prop]
    },
  })
}
