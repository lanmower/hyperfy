import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('SystemLifecycleManager')

export class SystemLifecycleManager {
  constructor(world) {
    this.world = world
    this.registry = new Map()
    this.shutdownOrder = []
    this.initialized = false
    this.isShuttingDown = false
  }

  registerSystem(name, system) {
    if (this.registry.has(name)) {
      logger.warn('System already registered, overwriting', { name })
    }

    this.registry.set(name, {
      name,
      system,
      initialized: false,
      disposed: false,
      dependencies: [],
      dependents: []
    })

    return this
  }

  addDependency(systemName, dependsOn) {
    const entry = this.registry.get(systemName)
    if (!entry) {
      logger.warn('System not registered', { systemName })
      return this
    }

    if (!entry.dependencies.includes(dependsOn)) {
      entry.dependencies.push(dependsOn)
    }

    const depEntry = this.registry.get(dependsOn)
    if (depEntry && !depEntry.dependents.includes(systemName)) {
      depEntry.dependents.push(systemName)
    }

    return this
  }

  async initializeAll(options = {}) {
    if (this.initialized) {
      logger.warn('Systems already initialized')
      return
    }

    try {
      const sorted = this.topologicalSort()
      this.shutdownOrder = [...sorted].reverse()

      for (const name of sorted) {
        const entry = this.registry.get(name)
        if (!entry) continue

        try {
          if (typeof entry.system.init === 'function') {
            await entry.system.init(options)
          }
          entry.initialized = true
          logger.info('System initialized', { name })
        } catch (err) {
          logger.error('System initialization failed', { name, error: err.message })
          throw err
        }
      }

      this.initialized = true
      logger.info('All systems initialized', { count: this.registry.size })
    } catch (err) {
      logger.error('Initialization failed', { error: err.message })
      await this.cleanupAll()
      throw err
    }
  }

  async disposeAll() {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress')
      return
    }

    this.isShuttingDown = true

    try {
      for (const name of this.shutdownOrder) {
        const entry = this.registry.get(name)
        if (!entry || entry.disposed) continue

        try {
          if (typeof entry.system.destroy === 'function') {
            await entry.system.destroy()
          }
          if (typeof entry.system.dispose === 'function') {
            await entry.system.dispose()
          }
          entry.disposed = true
          logger.info('System disposed', { name })
        } catch (err) {
          logger.error('System disposal failed', { name, error: err.message })
        }
      }

      logger.info('All systems disposed', { count: this.registry.size })
    } finally {
      this.isShuttingDown = false
      this.initialized = false
      this.registry.clear()
    }
  }

  async cleanupAll() {
    return this.disposeAll()
  }

  topologicalSort() {
    const sorted = []
    const visited = new Set()
    const visiting = new Set()

    const visit = (name) => {
      if (visited.has(name)) return
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`)
      }

      visiting.add(name)

      const entry = this.registry.get(name)
      if (entry) {
        for (const dep of entry.dependencies) {
          visit(dep)
        }
      }

      visiting.delete(name)
      visited.add(name)
      sorted.push(name)
    }

    for (const name of this.registry.keys()) {
      visit(name)
    }

    return sorted
  }

  validateDependencies() {
    const errors = []

    for (const [name, entry] of this.registry) {
      for (const dep of entry.dependencies) {
        if (!this.registry.has(dep)) {
          errors.push(`System '${name}' depends on missing system '${dep}'`)
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dependency validation failed:\n${errors.join('\n')}`)
    }

    return true
  }

  getStatus(name) {
    const entry = this.registry.get(name)
    if (!entry) return null

    return {
      name,
      initialized: entry.initialized,
      disposed: entry.disposed,
      dependencies: entry.dependencies,
      dependents: entry.dependents
    }
  }

  getStats() {
    const stats = {
      total: this.registry.size,
      initialized: 0,
      disposed: 0,
      dependencies: []
    }

    for (const entry of this.registry.values()) {
      if (entry.initialized) stats.initialized++
      if (entry.disposed) stats.disposed++
      if (entry.dependencies.length > 0) {
        stats.dependencies.push({
          system: entry.name,
          count: entry.dependencies.length
        })
      }
    }

    return stats
  }

  listSystemsInOrder() {
    try {
      return this.topologicalSort()
    } catch (err) {
      logger.error('Failed to sort systems', { error: err.message })
      return []
    }
  }

  async gracefulShutdown(timeout = 30000) {
    logger.info('Initiating graceful shutdown', { timeout })

    const shutdownPromise = this.disposeAll()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
    )

    try {
      await Promise.race([shutdownPromise, timeoutPromise])
      logger.info('Graceful shutdown completed')
    } catch (err) {
      logger.error('Graceful shutdown failed', { error: err.message })
      throw err
    }
  }

  destroy() {
    this.registry.clear()
    this.shutdownOrder = []
    this.world = null
  }
}
