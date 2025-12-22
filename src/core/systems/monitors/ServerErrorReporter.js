let errorFormatter = null
let errorObserver = null
let isServerEnv = typeof process !== 'undefined' && process.versions?.node

async function loadServerDeps() {
  if (isServerEnv && !errorFormatter) {
    try {
      const mod1 = await import('../../../server/utils/ErrorFormatter.js')
      const mod2 = await import('../../../server/services/ErrorObserver.js')
      errorFormatter = mod1.errorFormatter
      errorObserver = mod2.errorObserver
    } catch (e) {
      // Server modules not available in this context
    }
  }
}

export class ServerErrorReporter {
  constructor(monitor) {
    this.monitor = monitor
    loadServerDeps()
  }

  canHandle(event, isDuplicate) {
    return false
  }

  handle(event, isDuplicate) {
  }

  reportError(errorEvent, errorData) {
    if (!errorFormatter) return
    const metadata = {
      clientId: errorData.clientId,
      userId: errorData.userId,
      userName: errorData.userName,
      clientIP: errorData.clientIP
    }

    const formatted = errorFormatter.formatForStderr(errorEvent, metadata)
    process.stderr.write(formatted)
  }

  getReport() {
    if (!errorObserver) return null
    const localStats = this.monitor.analytics.getStats()
    const observerStats = errorObserver.getErrorStats()

    return {
      local: localStats,
      client: observerStats,
      combined: {
        total: localStats.total + observerStats.total,
        lastMinute: localStats.recent + observerStats.lastMinute,
        critical: localStats.critical + observerStats.critical,
        byType: {
          ...localStats.byType,
          ...observerStats.byCategory
        }
      }
    }
  }

  captureClientError(clientId, error) {
    if (!errorObserver) return
    errorObserver.recordClientError(clientId, error, {
      timestamp: Date.now(),
      source: 'server-detected'
    })
  }

  checkAlertThresholds() {
    if (!errorObserver || !errorFormatter) return
    const stats = errorObserver.getErrorStats()

    if (stats.lastMinute >= 25) {
      const alert = errorFormatter.formatAlert(
        'High error rate detected across all clients',
        'CRITICAL'
      )
      process.stderr.write(alert)
    }

    if (stats.critical > 0) {
      const alert = errorFormatter.formatAlert(
        `${stats.critical} critical errors detected`,
        'CRITICAL'
      )
      process.stderr.write(alert)
    }
  }
}
