import { ErrorPatterns } from '../../utils/errorPatterns.js'

export class ErrorQuery {
  constructor(errorMonitor) {
    this.monitor = errorMonitor
  }

  getErrors(options = {}) {
    const {
      limit = 50,
      type = null,
      since = null,
      side = null,
      critical = null
    } = options

    let filtered = this.monitor.state.get('errors')

    if (type) filtered = filtered.filter(error => error.type === type)
    if (since) {
      const sinceTime = new Date(since).getTime()
      filtered = filtered.filter(error => new Date(error.timestamp).getTime() >= sinceTime)
    }
    if (side) filtered = filtered.filter(error => error.side === side)
    if (critical !== null) {
      filtered = filtered.filter(error => this.monitor.isCriticalError(error.type, error.args) === critical)
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  clearErrors() {
    const count = this.monitor.state.get('errors').length
    this.monitor.state.set('errors', [])
    this.monitor.state.set('errorId', 0)
    return count
  }

  getStats() {
    const busStats = this.monitor.errorBus.getStats()
    const errors = this.monitor.state.get('errors')

    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    const recent = errors.filter(error =>
      new Date(error.timestamp).getTime() >= hourAgo
    )

    const byType = {}
    recent.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
    })

    return {
      total: errors.length,
      recent: recent.length,
      critical: recent.filter(error =>
        this.monitor.isCriticalError(error.type, error.args)
      ).length,
      byType,
      unified: busStats
    }
  }

  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000)
    const errors = this.monitor.state.get('errors')
    const cleaned = errors.filter(error =>
      new Date(error.timestamp).getTime() >= cutoff
    )
    this.monitor.state.set('errors', cleaned)
  }
}
