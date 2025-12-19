export class StandardMiddlewares {
  static createLoggerMiddleware(verbose = false) {
    return (system, world, options) => {
      if (verbose) {
        console.log(`[System] Creating ${system.constructor.name}`)
      }

      const originalInit = system.init?.bind(system)
      const originalStart = system.start?.bind(system)

      if (originalInit) {
        system.init = async function (...args) {
          if (verbose) {
            console.log(`[System] Initializing ${system.constructor.name}`)
          }
          const result = await originalInit(...args)
          if (verbose) {
            console.log(`[System] Initialized ${system.constructor.name}`)
          }
          return result
        }
      }

      if (originalStart) {
        system.start = async function (...args) {
          if (verbose) {
            console.log(`[System] Starting ${system.constructor.name}`)
          }
          const result = await originalStart(...args)
          if (verbose) {
            console.log(`[System] Started ${system.constructor.name}`)
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
                console.error(`Error in ${system.constructor.name}.${method}:`, err)
                throw err
              })
            }

            return result
          } catch (err) {
            console.error(`Error in ${system.constructor.name}.${method}:`, err)
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
