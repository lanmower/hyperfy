import { createErrorEvent, serializeErrorEvent, ErrorLevels, ErrorSources } from '../../../src/core/schemas/ErrorEvent.schema.js'

export class ErrorHandler {
  constructor(options = {}) {
    this.maxErrors = options.maxErrors || 100
    this.maxWarnings = options.maxWarnings || 100
    this.enableLogging = options.enableLogging !== false
    this.logLevel = options.logLevel || 'error'

    this.errors = []
    this.warnings = []
    this.onError = null
    this.onWarning = null
    this.onCriticalError = null

    this.errorCounts = new Map()
    this.warningCounts = new Map()

    this.networkSender = null
  }

  setNetworkSender(sender) {
    this.networkSender = sender
  }

  // Error handling
  handleError(error, context = {}) {
    const level = this.severityToLevel(this.determineSeverity(error, context))
    const errorEvent = createErrorEvent(error, {
      ...context,
      source: ErrorSources.SDK
    }, level)

    const errorData = {
      id: errorEvent.id,
      timestamp: errorEvent.timestamp,
      message: errorEvent.message,
      stack: errorEvent.stack,
      name: error.name || 'Error',
      context: errorEvent.context,
      count: 1,
      severity: this.determineSeverity(error, context)
    }

    // Check for similar errors and count them
    const errorKey = this.getErrorKey(errorData)
    if (this.errorCounts.has(errorKey)) {
      errorData.count = this.errorCounts.get(errorKey) + 1
      errorData.firstSeen = this.errors.find(e => this.getErrorKey(e) === errorKey)?.timestamp || errorData.timestamp
    }
    this.errorCounts.set(errorKey, errorData.count)

    // Add to errors array
    this.errors.push(errorData)

    // Maintain max error limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Log if enabled
    if (this.enableLogging) {
      this.logError(errorData)
    }

    // Send to server if network available
    if (this.networkSender) {
      this.sendErrorToServer(errorEvent)
    }

    // Trigger callbacks
    if (this.onError) {
      this.onError(errorData)
    }

    if (errorData.severity === 'critical' && this.onCriticalError) {
      this.onCriticalError(errorData)
    }

    return errorData
  }

  // Warning handling
  handleWarning(message, context = {}) {
    const warningData = {
      id: this.generateId(),
      timestamp: Date.now(),
      message: message.toString(),
      context: { ...context },
      count: 1,
      severity: 'warning'
    }

    // Check for similar warnings and count them
    const warningKey = this.getWarningKey(warningData)
    if (this.warningCounts.has(warningKey)) {
      warningData.count = this.warningCounts.get(warningKey) + 1
      warningData.firstSeen = this.warnings.find(w => this.getWarningKey(w) === warningKey)?.timestamp || warningData.timestamp
    }
    this.warningCounts.set(warningKey, warningData.count)

    // Add to warnings array
    this.warnings.push(warningData)

    // Maintain max warning limit
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift()
    }

    // Log if enabled
    if (this.enableLogging && this.shouldLogWarning(warningData)) {
      this.logWarning(warningData)
    }

    // Trigger callback
    if (this.onWarning) {
      this.onWarning(warningData)
    }

    return warningData
  }

  // Convenience methods
  critical(message, context = {}) {
    const error = new Error(message)
    error.name = 'CriticalError'
    return this.handleError(error, { ...context, severity: 'critical' })
  }

  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, context)
    }
  }

  debug(message, context = {}) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, context)
    }
  }

  // Error retrieval
  getErrors(severity = null, limit = null) {
    let errors = this.errors

    if (severity) {
      errors = errors.filter(e => e.severity === severity)
    }

    if (limit && limit > 0) {
      errors = errors.slice(-limit)
    }

    return errors
  }

  getRecentErrors(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.errors.filter(e => e.timestamp >= cutoff)
  }

  getErrorsByContext(key, value) {
    return this.errors.filter(e => e.context[key] === value)
  }

  getWarnings(limit = null) {
    if (limit && limit > 0) {
      return this.warnings.slice(-limit)
    }
    return [...this.warnings]
  }

  getRecentWarnings(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.warnings.filter(w => w.timestamp >= cutoff)
  }

  // Statistics
  getErrorStats() {
    const severityCounts = {}
    const contextCounts = {}
    let totalOccurrences = 0

    this.errors.forEach(error => {
      severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1
      totalOccurrences += error.count

      // Count by context keys
      Object.keys(error.context).forEach(key => {
        const contextKey = `${key}:${error.context[key]}`
        contextCounts[contextKey] = (contextCounts[contextKey] || 0) + 1
      })
    })

    return {
      total: this.errors.length,
      totalOccurrences,
      bySeverity: severityCounts,
      byContext: contextCounts,
      mostCommon: this.getMostCommonErrors(),
      recent: this.getRecentErrors().length,
      criticalCount: severityCounts.critical || 0
    }
  }

  getWarningStats() {
    const contextCounts = {}
    let totalOccurrences = 0

    this.warnings.forEach(warning => {
      totalOccurrences += warning.count

      // Count by context keys
      Object.keys(warning.context).forEach(key => {
        const contextKey = `${key}:${warning.context[key]}`
        contextCounts[contextKey] = (contextCounts[contextKey] || 0) + 1
      })
    })

    return {
      total: this.warnings.length,
      totalOccurrences,
      byContext: contextCounts,
      mostCommon: this.getMostCommonWarnings(),
      recent: this.getRecentWarnings().length
    }
  }

  getMostCommonErrors(limit = 5) {
    const errorCounts = new Map()

    this.errors.forEach(error => {
      const key = this.getErrorKey(error)
      errorCounts.set(key, {
        key,
        message: error.message,
        count: error.count,
        severity: error.severity,
        lastSeen: error.timestamp
      })
    })

    return Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  getMostCommonWarnings(limit = 5) {
    const warningCounts = new Map()

    this.warnings.forEach(warning => {
      const key = this.getWarningKey(warning)
      warningCounts.set(key, {
        key,
        message: warning.message,
        count: warning.count,
        lastSeen: warning.timestamp
      })
    })

    return Array.from(warningCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // Cleanup
  clear(olderThan = null) {
    if (olderThan === null) {
      this.errors = []
      this.warnings = []
      this.errorCounts.clear()
      this.warningCounts.clear()
      return
    }

    const cutoff = Date.now() - olderThan

    this.errors = this.errors.filter(e => e.timestamp >= cutoff)
    this.warnings = this.warnings.filter(w => w.timestamp >= cutoff)

    // Rebuild counts
    this.errorCounts.clear()
    this.warningCounts.clear()

    this.errors.forEach(error => {
      const key = this.getErrorKey(error)
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + error.count)
    })

    this.warnings.forEach(warning => {
      const key = this.getWarningKey(warning)
      this.warningCounts.set(key, (this.warningCounts.get(key) || 0) + warning.count)
    })
  }

  // Configuration
  setLogLevel(level) {
    this.logLevel = level
  }

  setMaxErrors(max) {
    this.maxErrors = Math.max(1, max)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }
  }

  setMaxWarnings(max) {
    this.maxWarnings = Math.max(1, max)
    if (this.warnings.length > this.maxWarnings) {
      this.warnings = this.warnings.slice(-this.maxWarnings)
    }
  }

  // Events
  on(event, callback) {
    switch (event) {
      case 'error':
        this.onError = callback
        break
      case 'warning':
        this.onWarning = callback
        break
      case 'critical':
        this.onCriticalError = callback
        break
      default:
        throw new Error(`Unknown error handler event: ${event}`)
    }
  }

  off(event) {
    switch (event) {
      case 'error':
        this.onError = null
        break
      case 'warning':
        this.onWarning = null
        break
      case 'critical':
        this.onCriticalError = null
        break
      default:
        throw new Error(`Unknown error handler event: ${event}`)
    }
  }

  // Export
  export(format = 'json') {
    const data = {
      errors: this.errors,
      warnings: this.warnings,
      stats: {
        errors: this.getErrorStats(),
        warnings: this.getWarningStats()
      },
      timestamp: Date.now()
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'text':
        return this.formatAsText(data)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // Internal methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  getErrorKey(error) {
    return `${error.name}:${error.message}:${JSON.stringify(error.context)}`
  }

  getWarningKey(warning) {
    return `${warning.message}:${JSON.stringify(warning.context)}`
  }

  determineSeverity(error, context) {
    if (context.severity) return context.severity
    if (error.name === 'CriticalError') return 'critical'
    if (error.name === 'NetworkError' || error.message.includes('WebSocket')) return 'high'
    if (error.name === 'ValidationError') return 'medium'
    return 'low'
  }

  severityToLevel(severity) {
    switch (severity) {
      case 'critical': return ErrorLevels.ERROR
      case 'high': return ErrorLevels.ERROR
      case 'medium': return ErrorLevels.WARN
      case 'low': return ErrorLevels.INFO
      default: return ErrorLevels.ERROR
    }
  }

  sendErrorToServer(errorEvent) {
    try {
      const serialized = serializeErrorEvent(errorEvent)
      this.networkSender(serialized)
    } catch (err) {
      // Silently fail to avoid error loops
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const requestedLevelIndex = levels.indexOf(level)
    return requestedLevelIndex >= currentLevelIndex
  }

  shouldLogWarning(warning) {
    return this.shouldLog('warn')
  }

  logError(errorData) {
    const logMethod = this.getLogMethod(errorData.severity)
    const message = `[${errorData.severity.toUpperCase()}] ${errorData.message}`
    const meta = {
      id: errorData.id,
      count: errorData.count,
      context: errorData.context,
      stack: errorData.stack
    }

    logMethod(message, meta)
  }

  logWarning(warningData) {
    console.warn(`[WARNING] ${warningData.message}`, {
      id: warningData.id,
      count: warningData.count,
      context: warningData.context
    })
  }

  getLogMethod(severity) {
    switch (severity) {
      case 'critical': return console.error
      case 'high': return console.error
      case 'medium': return console.warn
      case 'low': return console.log
      default: return console.log
    }
  }

  formatAsText(data) {
    let output = `Error Handler Report - ${new Date().toISOString()}\n`
    output += `${'='.repeat(50)}\n\n`

    output += `Errors: ${data.errors.length} (${data.stats.errors.totalOccurrences} occurrences)\n`
    output += `Warnings: ${data.warnings.length} (${data.stats.warnings.totalOccurrences} occurrences)\n\n`

    if (data.stats.errors.criticalCount > 0) {
      output += `CRITICAL ERRORS: ${data.stats.errors.criticalCount}\n\n`
    }

    output += `Most Common Errors:\n`
    data.stats.errors.mostCommon.forEach((error, i) => {
      output += `${i + 1}. ${error.message} (${error.count}x) [${error.severity}]\n`
    })

    return output
  }

  // Debug
  toString() {
    const stats = this.getErrorStats()
    return `ErrorHandler(${stats.total} errors, ${this.warnings.length} warnings, ${stats.criticalCount} critical)`
  }
}