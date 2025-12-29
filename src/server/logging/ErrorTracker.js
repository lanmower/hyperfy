export class ErrorTracker {
  constructor(options = {}) {
    this.logger = options.logger || null
    this.errorBuffer = []
    this.errorMap = new Map()
    this.maxBufferSize = options.maxBufferSize || 1000
    this.samplingRate = options.samplingRate || 1.0
    this.breadcrumbs = []
    this.maxBreadcrumbs = 100
  }

  captureException(error, context = {}) {
    if (!this.shouldSample()) return

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      category: context.category || 'unknown',
      level: context.level || 'error',
      timestamp: Date.now(),
      context,
      fingerprint: this.generateFingerprint(error, context),
    }

    const fingerprintKey = errorInfo.fingerprint.join(':')
    const existing = this.errorMap.get(fingerprintKey)

    if (existing) {
      existing.count = (existing.count || 1) + 1
      existing.lastSeen = Date.now()
    } else {
      errorInfo.count = 1
      this.errorBuffer.push(errorInfo)
      this.errorMap.set(fingerprintKey, errorInfo)

      if (this.logger) {
        this.logger.error(error.message, {
          category: context.category,
          module: context.module,
          stack: error.stack.split('\n').slice(0, 5).join('\n'),
        })
      }
    }

    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer.shift()
    }
  }

  captureMessage(message, context = {}) {
    const level = context.level || 'info'

    if (this.logger) {
      const logMethod = level === 'error' ? 'error' : 'info'
      this.logger[logMethod](message, context)
    }
  }

  addBreadcrumb(message, data = {}) {
    this.breadcrumbs.push({
      message,
      timestamp: Date.now(),
      data,
    })

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  generateFingerprint(error, context) {
    const message = error.message || 'unknown'
    const category = context.category || 'unknown'
    const module = context.module || 'unknown'
    const firstLine = error.stack?.split('\n')[0] || ''

    return [category, module, message, firstLine].filter(Boolean)
  }

  shouldSample() {
    if (this.samplingRate >= 1.0) return true
    return Math.random() < this.samplingRate
  }

  getErrors(filter = {}) {
    let errors = [...this.errorBuffer]

    if (filter.level) {
      errors = errors.filter(e => e.level === filter.level)
    }

    if (filter.category) {
      errors = errors.filter(e => e.category === filter.category)
    }

    if (filter.module) {
      errors = errors.filter(e => e.context?.module === filter.module)
    }

    if (filter.since) {
      errors = errors.filter(e => e.timestamp >= filter.since)
    }

    return errors
  }

  getRecentErrors(limit = 10) {
    return this.errorBuffer.slice(-limit).reverse()
  }

  getStats() {
    const errors = this.errorBuffer
    const byLevel = {}
    const byCategory = {}
    const byModule = {}

    errors.forEach(e => {
      byLevel[e.level] = (byLevel[e.level] || 0) + 1
      byCategory[e.category] = (byCategory[e.category] || 0) + 1
      byModule[e.context?.module || 'unknown'] = (byModule[e.context?.module || 'unknown'] || 0) + 1
    })

    return {
      totalErrors: errors.length,
      totalFingerprints: this.errorMap.size,
      byLevel,
      byCategory,
      byModule,
      lastError: errors[errors.length - 1] || null,
    }
  }

  clear() {
    this.errorBuffer = []
    this.errorMap.clear()
    this.breadcrumbs = []
  }

  toString() {
    return `ErrorTracker(${this.errorBuffer.length} errors, ${this.errorMap.size} unique)`
  }
}
