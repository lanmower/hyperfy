import { StructuredLogger } from '../utils/logging/index.js'
import { AsyncInitializer } from './AsyncInitializer.js'

const logger = new StructuredLogger('SystemInitializer')

export class SystemInitializer {
  constructor(system, world) {
    this.system = system
    this.world = world
    this.initializer = new AsyncInitializer(`System:${system.constructor.name}`)
    this.dependencies = new Map()
    this.readyPromise = null
    this.readyResolve = null
  }

  async waitReady() {
    if (this.initializer.isReady()) {
      return true
    }

    if (!this.readyPromise) {
      this.readyPromise = new Promise(resolve => {
        this.readyResolve = resolve
      })
    }

    return this.readyPromise
  }

  addDependency(name, systemName) {
    this.dependencies.set(name, systemName)
    return this
  }

  async resolveDependencies() {
    const resolved = {}

    for (const [depName, systemName] of this.dependencies) {
      const system = this.world[systemName]
      if (!system) {
        throw new Error(`Dependency not found: ${systemName}`)
      }

      if (system._initializer) {
        const ready = await system._initializer.waitReady()
        if (!ready) {
          throw new Error(`Dependency failed to initialize: ${systemName}`)
        }
      }

      resolved[depName] = system
    }

    return resolved
  }

  addPhase(name, fn) {
    this.initializer.addPhase(name, fn, false)
    return this
  }

  async init() {
    try {
      const dependencies = await this.resolveDependencies()
      const success = await this.initializer.init()

      if (success && this.readyResolve) {
        this.readyResolve(true)
      }

      return {
        success,
        duration: this.initializer.endTime ? this.initializer.endTime - this.initializer.startTime : null,
        error: this.initializer.error?.message || null,
      }
    } catch (error) {
      logger.error(`System initialization failed: ${this.system.constructor.name}`, {
        error: error.message,
      })

      if (this.readyResolve) {
        this.readyResolve(false)
      }

      return {
        success: false,
        duration: this.initializer.endTime ? this.initializer.endTime - this.initializer.startTime : null,
        error: error.message,
      }
    }
  }

  getState() {
    return this.initializer.getState()
  }

  isReady() {
    return this.initializer.isReady()
  }
}

export function withAsyncInit(System) {
  return class AsyncSystem extends System {
    constructor(world) {
      super(world)
      this._initializer = new SystemInitializer(this, world)
    }

    async init(options) {
      const result = await this._initializer.init()

      if (!result.success) {
        throw new Error(`System initialization failed: ${result.error}`)
      }

      return result
    }

    async waitReady() {
      return this._initializer.waitReady()
    }

    addInitPhase(name, fn) {
      this._initializer.addPhase(name, fn)
      return this
    }

    addInitDependency(name, systemName) {
      this._initializer.addDependency(name, systemName)
      return this
    }

    getInitState() {
      return this._initializer.getState()
    }
  }
}
