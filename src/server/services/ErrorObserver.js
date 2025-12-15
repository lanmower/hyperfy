// Comprehensive client error observation and stderr reporting
import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'
import { errorFormatter } from '../utils/ErrorFormatter.js'
import { stderrLogger } from '../utils/StderrLogger.js'

export class ErrorObserver {
  constructor() {
    this.errors = []
    this.errorsByClient = new Map()
    this.errorsByCategory = new Map()
    this.errorPatterns = new Map()
    this.maxErrors = 1000
    this.alertThresholds = {
      warning: 10,
      critical: 25,
      cascade: 5
    }
    this.lastAlertTime = new Map()
    this.alertCooldown = 60000
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

    this.trackErrorPattern(errorEntry)

    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    this.reportToStderr(errorEntry, metadata)

    this.checkAlertThresholds(errorEntry)

    return errorEntry
  }

  trackErrorPattern(error) {
    const patternKey = `${error.category}:${error.message}`

    if (!this.errorPatterns.has(patternKey)) {
      this.errorPatterns.set(patternKey, {
        category: error.category,
        message: error.message,
        count: 0,
        clients: new Set(),
        firstSeen: error.timestamp,
        lastSeen: error.timestamp
      })
    }

    const pattern = this.errorPatterns.get(patternKey)
    pattern.count += error.count || 1
    pattern.clients.add(error.clientId)
    pattern.lastSeen = error.timestamp

    if (this.errorPatterns.size > 500) {
      this.cleanupPatterns()
    }
  }

  cleanupPatterns() {
    const cutoff = Date.now() - (60 * 60 * 1000)
    const toDelete = []

    for (const [key, pattern] of this.errorPatterns.entries()) {
      if (pattern.lastSeen < cutoff) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.errorPatterns.delete(key))
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

  checkAlertThresholds(error) {
    const now = Date.now()

    const recentErrors = this.getRecentErrors(60000)
    if (recentErrors.length >= this.alertThresholds.critical) {
      this.triggerAlert('CRITICAL', `${recentErrors.length} errors in last minute`, {
        errorCount: recentErrors.length,
        threshold: this.alertThresholds.critical
      })
    } else if (recentErrors.length >= this.alertThresholds.warning) {
      this.triggerAlert('WARNING', `${recentErrors.length} errors in last minute`, {
        errorCount: recentErrors.length,
        threshold: this.alertThresholds.warning
      })
    }

    const categoryErrors = this.getErrorsByCategory(error.category).filter(
      e => now - e.timestamp < 60000
    )

    if (categoryErrors.length >= this.alertThresholds.cascade) {
      this.triggerAlert('WARNING', `Cascading failures detected in ${error.category}`, {
        category: error.category,
        count: categoryErrors.length,
        clients: new Set(categoryErrors.map(e => e.clientId)).size
      })
    }

    const clientErrors = this.getErrorsByClient(error.clientId).filter(
      e => now - e.timestamp < 60000
    )

    if (clientErrors.length >= this.alertThresholds.warning) {
      this.triggerAlert('WARNING', `Client experiencing high error rate`, {
        clientId: error.clientId,
        count: clientErrors.length
      })
    }
  }

  triggerAlert(level, message, details = {}) {
    const alertKey = `${level}:${message}`
    const lastAlert = this.lastAlertTime.get(alertKey)
    const now = Date.now()

    if (lastAlert && now - lastAlert < this.alertCooldown) {
      return
    }

    this.lastAlertTime.set(alertKey, now)

    const formatted = errorFormatter.formatAlert(message, level)
    process.stderr.write(formatted)

    if (Object.keys(details).length > 0) {
      stderrLogger.info('Alert details:', details)
    }
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

    const topPatterns = Array.from(this.errorPatterns.values())
      .filter(p => p.lastSeen >= oneHourAgo)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(p => ({
        category: p.category,
        message: p.message.substring(0, 100),
        count: p.count,
        affectedClients: p.clients.size,
        firstSeen: p.firstSeen,
        lastSeen: p.lastSeen
      }))

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
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.count - a.count)
  }

  clearErrors() {
    const count = this.errors.length
    this.errors = []
    this.errorsByClient.clear()
    this.errorsByCategory.clear()
    this.errorPatterns.clear()
    this.lastAlertTime.clear()
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
      healthy: stats.lastMinute < this.alertThresholds.warning,
      errorRate: stats.lastMinute,
      totalErrors: stats.total,
      criticalErrors: stats.critical,
      activeClients: stats.activeClients
    }
  }
}

export const errorObserver = new ErrorObserver()
