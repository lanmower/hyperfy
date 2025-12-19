import { ErrorLevels } from '../../core/schemas/ErrorEvent.schema.js'
import { errorFormatter } from '../utils/ErrorFormatter.js'
import { stderrLogger } from '../utils/StderrLogger.js'

export class ErrorAlertManager {
  constructor(observer) {
    this.observer = observer
    this.alertThresholds = {
      warning: 10,
      critical: 25,
      cascade: 5
    }
    this.lastAlertTime = new Map()
    this.alertCooldown = 60000
  }

  check(error) {
    const now = Date.now()

    const recentErrors = this.observer.getRecentErrors(60000)
    if (recentErrors.length >= this.alertThresholds.critical) {
      this.trigger('CRITICAL', `${recentErrors.length} errors in last minute`, {
        errorCount: recentErrors.length,
        threshold: this.alertThresholds.critical
      })
    } else if (recentErrors.length >= this.alertThresholds.warning) {
      this.trigger('WARNING', `${recentErrors.length} errors in last minute`, {
        errorCount: recentErrors.length,
        threshold: this.alertThresholds.warning
      })
    }

    const categoryErrors = this.observer.getErrorsByCategory(error.category).filter(
      e => now - e.timestamp < 60000
    )

    if (categoryErrors.length >= this.alertThresholds.cascade) {
      this.trigger('WARNING', `Cascading failures detected in ${error.category}`, {
        category: error.category,
        count: categoryErrors.length,
        clients: new Set(categoryErrors.map(e => e.clientId)).size
      })
    }

    const clientErrors = this.observer.getErrorsByClient(error.clientId).filter(
      e => now - e.timestamp < 60000
    )

    if (clientErrors.length >= this.alertThresholds.warning) {
      this.trigger('WARNING', `Client experiencing high error rate`, {
        clientId: error.clientId,
        count: clientErrors.length
      })
    }
  }

  trigger(level, message, details = {}) {
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

  clear() {
    this.lastAlertTime.clear()
  }
}
