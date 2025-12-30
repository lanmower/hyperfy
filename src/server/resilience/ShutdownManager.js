export class ShutdownManager {
  constructor(logger, options = {}) {
    this.logger = logger
    this.gracefulTimeout = options.gracefulTimeout || 30000
    this.forceTimeout = options.forceTimeout || 5000
    this.handlers = []
  }

  addShutdownHandler(name, handler) {
    this.handlers.push(handler)
  }

  isAcceptingConnections() {
    return true
  }

  async shutdown() {
    this.logger.info('ShutdownManager: Starting graceful shutdown')
    await Promise.all(this.handlers.map(h => h()))
    this.logger.info('ShutdownManager: Shutdown complete')
  }
}
