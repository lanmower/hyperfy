import { BaseManager } from '../../core/patterns/index.js'

export class ShutdownManager extends BaseManager {
  constructor(options = {}) {
    super(null, 'ShutdownManager')
    this.gracefulTimeout = options.gracefulTimeout || 30000
    this.forceTimeout = options.forceTimeout || 5000
    this.handlers = []
  }

  async initInternal() {
  }

  addShutdownHandler(name, handler) {
    this.handlers.push(handler)
  }

  isAcceptingConnections() {
    return true
  }

  async shutdown() {
    this.logger.info('Starting graceful shutdown')
    await Promise.all(this.handlers.map(h => h()))
    this.logger.info('Shutdown complete')
  }

  async destroyInternal() {
    this.handlers = []
  }
}
