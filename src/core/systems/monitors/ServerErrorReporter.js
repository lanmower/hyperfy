import { errorFormatter } from '../../../server/utils/ErrorFormatter.js'
import { errorObserver } from '../../../server/services/ErrorObserver.js'

export class ServerErrorReporter {
  constructor(monitor) {
    this.monitor = monitor
  }

  canHandle(event, isDuplicate) {
    return false
  }

  handle(event, isDuplicate) {
  }

  reportError(errorEvent, errorData) {
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
    errorObserver.recordClientError(clientId, error, {
      timestamp: Date.now(),
      source: 'server-detected'
    })
  }

  checkAlertThresholds() {
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
