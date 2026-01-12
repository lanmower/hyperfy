import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Plugin')

export class Plugin {
  constructor(world, options = {}) {
    this.world = world
    this.options = options
    this.enabled = true
    this.name = this.constructor.name
    this.version = '1.0.0'
  }

  async init() {
  }

  async destroy() {
  }

  enable() {
    this.enabled = true
    logger.info(`Plugin enabled: ${this.name}`)
  }

  disable() {
    this.enabled = false
    logger.info(`Plugin disabled: ${this.name}`)
  }

  getAPI() {
    return {}
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.enabled,
      options: this.options
    }
  }
}
