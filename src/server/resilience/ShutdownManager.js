export class ShutdownManager {
  constructor(logger, options = {}) {
    this.logger = logger
    this.gracefulTimeout = options.gracefulTimeout || 30000
    this.forceTimeout = options.forceTimeout || 5000
    this.handlers = []
  }

  onShutdown(handler) {
    this.handlers.push(handler)
  }

  async shutdown() {
    this.logger.info('ShutdownManager: Starting graceful shutdown')
    await Promise.all(this.handlers.map(h => h()))
    this.logger.info('ShutdownManager: Shutdown complete')
  }
}
