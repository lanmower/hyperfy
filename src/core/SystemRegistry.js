
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('SystemRegistry')

export class SystemRegistry {
  constructor() {
    this.systems = new Map()
    this.initialized = new Set()
    this.priority = new Map()
  }

  register(name, SystemClass, options = {}) {
    if (this.systems.has(name)) {
      logger.warn('System already registered, overwriting', { name })
    }
    this.systems.set(name, { Class: SystemClass, options, name })
    this.priority.set(name, options.priority || 0)
    return this
  }

  registerBatch(systemMap) {
    for (const [name, config] of Object.entries(systemMap)) {
      const { Class, ...options } = config
      this.register(name, Class, options)
    }
    return this
  }

  async initialize(world) {
    const sorted = Array.from(this.systems.entries())
      .sort((a, b) => (this.priority.get(b[0]) || 0) - (this.priority.get(a[0]) || 0))

    for (const [name, { Class, options }] of sorted) {
      try {
        const instance = new Class(world)
        world[name] = instance

        if (typeof instance.init === 'function') {
          await instance.init(options)
        }
        if (typeof instance.start === 'function') {
          await instance.start()
        }

        this.initialized.add(name)
        logger.info('System initialized', { name })
      } catch (err) {
        logger.error('System initialization failed', { name, error: err.message })
        throw err
      }
    }
    return world
  }

  async destroy(world) {
    for (const name of Array.from(this.initialized).reverse()) {
      const instance = world[name]
      if (instance && typeof instance.destroy === 'function') {
        try {
          await instance.destroy()
          delete world[name]
          this.initialized.delete(name)
        } catch (err) {
          logger.error('System destruction failed', { name, error: err.message })
        }
      }
    }
  }

  get(name) {
    return this.systems.get(name)
  }

  has(name) {
    return this.systems.has(name)
  }

  isInitialized(name) {
    return this.initialized.has(name)
  }

  list() {
    return Array.from(this.systems.keys())
  }

  stats() {
    return {
      total: this.systems.size,
      initialized: this.initialized.size,
      systems: this.list()
    }
  }
}
