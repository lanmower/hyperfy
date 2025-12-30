export class ErrorTracker {
  constructor(options = {}) {
    this.logger = options.logger
    this.samplingRate = options.samplingRate || 1.0
  }

  track(error) {
    if (Math.random() > this.samplingRate) return
    this.logger?.error('Error tracked', { error: error.message, stack: error.stack })
  }

  captureException(error) {
    this.track(error)
  }

  getStats() {
    return { total: 0, recent: [] }
  }
}
