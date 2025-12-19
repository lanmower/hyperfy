import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'
import { errorFormatter } from '../utils/ErrorFormatter.js'
import { ErrorPatternTracker } from './ErrorPatternTracker.js'
import { ErrorAlertManager } from './ErrorAlertManager.js'
import { ErrorStorage } from './ErrorStorage.js'
import { ErrorStats } from './ErrorStats.js'

export class ErrorObserver {
  constructor() {
    this.storage = new ErrorStorage(1000)
    this.patternTracker = new ErrorPatternTracker()
    this.alertManager = new ErrorAlertManager(this)
  }

  recordClientError(clientId, error, metadata = {}) {
    const errorEntry = {
      id: error.id || this.generateId(),
      clientId,
      timestamp: error.timestamp || Date.now(),
      level: error.level || ErrorLevels.ERROR,
      category: error.category || 'unknown',
      message: error.message || 'Unknown error',
      stack: error.stack || null,
      context: error.context || {},
      metadata: {
        ...metadata,
        source: error.source || 'client'
      },
      count: error.count || 1
    }

    this.storage.add(errorEntry)
    this.patternTracker.track(errorEntry)
    this.reportToStderr(errorEntry, metadata)
    this.alertManager.check(errorEntry)

    return errorEntry
  }

  reportToStderr(error, metadata) {
    const context = {
      clientId: error.clientId,
      userName: metadata.userName,
      userId: metadata.userId,
      clientIP: metadata.clientIP,
      app: error.context?.app,
      entityId: error.context?.entity
    }

    const formatted = errorFormatter.formatForStderr(error, context)
    process.stderr.write(formatted)
  }

  getRecentErrors(timeWindow = 60000) {
    return this.storage.getRecent(timeWindow)
  }

  getActiveErrors() {
    return this.getRecentErrors(300000)
  }

  getErrorStats() {
    return ErrorStats.compute(this.storage, this.patternTracker)
  }

  getErrorsByClient(clientId) {
    return this.storage.getByClient(clientId)
  }

  getErrorsByCategory(category) {
    return this.storage.getByCategory(category)
  }

  getErrorPatterns() {
    return this.patternTracker.getPatterns()
  }

  clearErrors() {
    const count = this.storage.clear()
    this.patternTracker.clear()
    this.alertManager.clear()
    return count
  }

  clearClientErrors(clientId) {
    return this.storage.clearClient(clientId)
  }

  exportErrors(format = 'json') {
    const data = {
      errors: this.storage.getAll(),
      stats: this.getErrorStats(),
      patterns: this.getErrorPatterns(),
      timestamp: Date.now()
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2)

      case 'summary':
        return ErrorStats.formatSummary(data)

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  getStatus() {
    const stats = this.getErrorStats()
    return {
      healthy: stats.lastMinute < this.alertManager.alertThresholds.warning,
      errorRate: stats.lastMinute,
      totalErrors: stats.total,
      criticalErrors: stats.critical,
      activeClients: stats.activeClients
    }
  }
}

export const errorObserver = new ErrorObserver()
