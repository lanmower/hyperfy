import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'
import { errorFormatter } from '../utils/ErrorFormatter.js'
import { ErrorPatternTracker } from './ErrorPatternTracker.js'
import { ErrorAlertManager } from './ErrorAlertManager.js'

export class ErrorObserver {
  constructor() {
    this.errors = []
    this.errorsByClient = new Map()
    this.errorsByCategory = new Map()
    this.maxErrors = 1000

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

    this.errors.push(errorEntry)

    if (!this.errorsByClient.has(clientId)) {
      this.errorsByClient.set(clientId, [])
    }
    this.errorsByClient.get(clientId).push(errorEntry)

    if (!this.errorsByCategory.has(errorEntry.category)) {
      this.errorsByCategory.set(errorEntry.category, [])
    }
    this.errorsByCategory.get(errorEntry.category).push(errorEntry)

    this.patternTracker.track(errorEntry)

    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

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
    const cutoff = Date.now() - timeWindow
    return this.errors.filter(e => e.timestamp >= cutoff)
  }

  getActiveErrors() {
    return this.getRecentErrors(300000)
  }

  getErrorStats() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneHourAgo = now - (60 * 60 * 1000)

    const recent = this.errors.filter(e => e.timestamp >= oneMinuteAgo)
    const hourly = this.errors.filter(e => e.timestamp >= oneHourAgo)

    const byLevel = {}
    const byCategory = {}
    const byClient = {}

    recent.forEach(error => {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
      byClient[error.clientId] = (byClient[error.clientId] || 0) + 1
    })

    const topPatterns = this.patternTracker.getTopPatterns(10, 60 * 60 * 1000)

    return {
      total: this.errors.length,
      lastMinute: recent.length,
      lastHour: hourly.length,
      byLevel,
      byCategory,
      byClient: Object.keys(byClient).length,
      errors: byLevel[ErrorLevels.ERROR] || 0,
      warnings: byLevel[ErrorLevels.WARN] || 0,
      critical: this.getCriticalCount(recent),
      topPatterns,
      activeClients: this.errorsByClient.size
    }
  }

  getCriticalCount(errors) {
    return errors.filter(e => {
      return e.level === ErrorLevels.ERROR && (
        e.category.includes('fatal') ||
        e.category.includes('critical') ||
        e.category.includes('crash')
      )
    }).length
  }

  getErrorsByClient(clientId) {
    return this.errorsByClient.get(clientId) || []
  }

  getErrorsByCategory(category) {
    return this.errorsByCategory.get(category) || []
  }

  getErrorPatterns() {
    return this.patternTracker.getPatterns()
  }

  clearErrors() {
    const count = this.errors.length
    this.errors = []
    this.errorsByClient.clear()
    this.errorsByCategory.clear()
    this.patternTracker.clear()
    this.alertManager.clear()
    return count
  }

  clearClientErrors(clientId) {
    const clientErrors = this.errorsByClient.get(clientId) || []
    const count = clientErrors.length

    this.errors = this.errors.filter(e => e.clientId !== clientId)
    this.errorsByClient.delete(clientId)

    for (const [category, errors] of this.errorsByCategory.entries()) {
      this.errorsByCategory.set(
        category,
        errors.filter(e => e.clientId !== clientId)
      )
    }

    return count
  }

  exportErrors(format = 'json') {
    const data = {
      errors: this.errors,
      stats: this.getErrorStats(),
      patterns: this.getErrorPatterns(),
      timestamp: Date.now()
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2)

      case 'summary':
        return this.formatSummary(data)

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  formatSummary(data) {
    let output = 'ERROR OBSERVATION SUMMARY\n'
    output += '═'.repeat(80) + '\n\n'

    output += `Total Errors: ${data.stats.total}\n`
    output += `Last Minute: ${data.stats.lastMinute}\n`
    output += `Last Hour: ${data.stats.lastHour}\n`
    output += `Active Clients: ${data.stats.activeClients}\n\n`

    output += 'By Level:\n'
    Object.entries(data.stats.byLevel).forEach(([level, count]) => {
      output += `  ${level}: ${count}\n`
    })
    output += '\n'

    output += 'By Category:\n'
    Object.entries(data.stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cat, count]) => {
        output += `  ${cat}: ${count}\n`
      })
    output += '\n'

    if (data.patterns.length > 0) {
      output += 'Top Error Patterns:\n'
      data.patterns.slice(0, 5).forEach((pattern, i) => {
        output += `  ${i + 1}. ${pattern.message.substring(0, 60)}\n`
        output += `     Count: ${pattern.count}, Clients: ${pattern.affectedClients}\n`
      })
    }

    return output
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
