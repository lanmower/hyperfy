/**
 * System Factory
 *
 * Factory pattern for creating system instances with middleware and proxies.
 * Enables:
 * - Middleware wrapping (lifecycle hooks, monitoring, logging)
 * - System proxies (lazy loading, error boundaries)
 * - Performance monitoring
 * - Conditional system creation
 */

export class SystemFactory {
  constructor() {
    this.middleware = []
    this.proxies = []
    this.monitors = []
  }

  /**
   * Add middleware that wraps system instances
   * Middleware receives (system, world, config) and can return wrapper
   */
  use(middleware) {
    this.middleware.push(middleware)
    return this
  }

  /**
   * Add a performance monitor
   */
  monitor(monitorFn) {
    this.monitors.push(monitorFn)
    return this
  }

  /**
   * Add a system proxy
   */
  addProxy(proxy) {
    this.proxies.push(proxy)
    return this
  }

  /**
   * Create a system instance with all middleware applied
   */
  create(SystemClass, world, options = {}) {
    // Create base instance
    let instance = new SystemClass(world)

    // Apply middleware
    for (const middlewareFn of this.middleware) {
      const wrapped = middlewareFn(instance, world, options)
      if (wrapped) {
        instance = wrapped
      }
    }

    // Wrap with performance monitoring if needed
    if (this.monitors.length > 0) {
      instance = this.wrapWithMonitoring(instance, this.monitors)
    }

    // Apply proxies
    for (const proxy of this.proxies) {
      instance = proxy(instance)
    }

    return instance
  }

  /**
   * Wrap a system with performance monitoring
   */
  wrapWithMonitoring(system, monitors) {
    const wrappedSystem = Object.create(Object.getPrototypeOf(system))

    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(system))) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(system), key)

      if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
        wrappedSystem[key] = function (...args) {
          const start = performance.now()

          for (const monitor of monitors) {
            monitor({ system, method: key, start })
          }

          try {
            const result = system[key].apply(system, args)
            return result
          } finally {
            const duration = performance.now() - start

            for (const monitor of monitors) {
              monitor({
                system,
                method: key,
                duration,
                end: performance.now(),
              })
            }
          }
        }
      }
    }

    // Copy properties
    for (const key of Object.keys(system)) {
      wrappedSystem[key] = system[key]
    }

    return wrappedSystem
  }

  /**
   * Create a logger middleware
   */
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

  /**
   * Create an error boundary middleware
   */
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

            // Handle promises
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

  /**
   * Create a conditional system middleware
   */
  static createConditionalMiddleware(condition) {
    return (system, world, options) => {
      if (!condition(world, options)) {
        // Return a no-op proxy
        return createNoOpProxy(system)
      }
      return system
    }
  }
}

/**
 * Create a no-op proxy that silently ignores calls
 */
function createNoOpProxy(system) {
  return new Proxy(system, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return function (...args) {
          // Silently do nothing
          return undefined
        }
      }
      return target[prop]
    },
  })
}

/**
 * Create a default system factory with standard middleware
 */
export function createDefaultSystemFactory(options = {}) {
  const factory = new SystemFactory()

  // Add error boundary
  factory.use(SystemFactory.createErrorBoundaryMiddleware())

  // Add logging if verbose
  if (options.verbose) {
    factory.use(SystemFactory.createLoggerMiddleware(true))
  }

  return factory
}
