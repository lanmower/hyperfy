import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('SystemRegistry')

export class SystemRegistry {
  constructor() {
    this.systems = []
    this.systemsByName = new Map()
  }

  register(name, system) {
    if (this.systemsByName.has(name)) {
      logger.warn('System already registered', { name })
      return
    }
    this.systems.push(system)
    this.systemsByName.set(name, system)
  }

  get(name) {
    return this.systemsByName.get(name) ?? null
  }

  has(name) {
    return this.systemsByName.has(name)
  }

  getAll() {
    return Array.from(this.systems)
  }

  async init(options) {
    for (const system of this.systems) {
      if (system.init) {
        try {
          await system.init(options)
        } catch (err) {
          logger.error('System init failed', { system: system.constructor.name, error: err.message })
        }
      }
    }
  }

  async start() {
    for (const system of this.systems) {
      if (system.start) {
        try {
          await system.start()
        } catch (err) {
          logger.error('System start failed', { system: system.constructor.name, error: err.message })
        }
      }
    }
  }

  preTick() {
    for (const system of this.systems) {
      system.preTick?.()
    }
  }

  preFixedUpdate(willFixedStep) {
    for (const system of this.systems) {
      system.preFixedUpdate?.(willFixedStep)
    }
  }

  fixedUpdate(delta) {
    for (const system of this.systems) {
      system.fixedUpdate?.(delta)
    }
  }

  postFixedUpdate(delta) {
    for (const system of this.systems) {
      system.postFixedUpdate?.(delta)
    }
  }

  preUpdate(alpha) {
    for (const system of this.systems) {
      system.preUpdate?.(alpha)
    }
  }

  update(delta) {
    for (const system of this.systems) {
      system.update?.(delta)
    }
  }

  postUpdate(delta) {
    for (const system of this.systems) {
      system.postUpdate?.(delta)
    }
  }

  lateUpdate(delta) {
    for (const system of this.systems) {
      system.lateUpdate?.(delta)
    }
  }

  postLateUpdate(delta) {
    for (const system of this.systems) {
      system.postLateUpdate?.(delta)
    }
  }

  commit() {
    for (const system of this.systems) {
      system.commit?.()
    }
  }

  postTick() {
    for (const system of this.systems) {
      system.postTick?.()
    }
  }

  destroy() {
    for (const system of this.systems) {
      system.destroy?.()
    }
  }
}
