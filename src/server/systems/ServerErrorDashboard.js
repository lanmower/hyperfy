export class ServerErrorDashboard {
  constructor(world) {
    this.world = world
    this.errors = []
    this.maxErrors = 1000
    this.errorsByUser = new Map()
    this.errorStats = {
      total: 0,
      critical: 0,
      byType: {},
      byUser: {}
    }
  }

  recordError(errorData) {
    const error = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...errorData,
      timestamp: Date.now(),
      resolved: false
    }

    this.errors.push(error)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    this.updateStats(error)
    this.trackErrorByUser(error)

    return error
  }

  updateStats(error) {
    this.errorStats.total++
    const errorType = error.error?.type || 'unknown'
    this.errorStats.byType[errorType] = (this.errorStats.byType[errorType] || 0) + 1

    if (error.error?.level === 'error') {
      this.errorStats.critical++
    }
  }

  trackErrorByUser(error) {
    const userId = error.clientId || 'unknown'
    if (!this.errorsByUser.has(userId)) {
      this.errorsByUser.set(userId, [])
      this.errorStats.byUser[userId] = 0
    }
    this.errorsByUser.get(userId).push(error)
    this.errorStats.byUser[userId]++
  }

  getErrors(options = {}) {
    let filtered = [...this.errors]

    if (options.userId) {
      filtered = filtered.filter(e => e.clientId === options.userId)
    }

    if (options.type) {
      filtered = filtered.filter(e => e.error?.type === options.type)
    }

    if (options.level) {
      filtered = filtered.filter(e => e.error?.level === options.level)
    }

    if (options.since) {
      filtered = filtered.filter(e => e.timestamp > options.since)
    }

    const limit = options.limit || 100
    return filtered.slice(-limit).reverse()
  }

  getErrorsByUser(userId) {
    return this.errorsByUser.get(userId) || []
  }

  getCriticalErrors(limit = 50) {
    return this.getErrors({ level: 'error', limit })
  }

  getStats() {
    return {
      ...this.errorStats,
      topErrors: this.getTopErrors(5),
      topUsers: this.getTopUsers(5)
    }
  }

  getTopErrors(limit = 5) {
    return Object.entries(this.errorStats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }))
  }

  getTopUsers(limit = 5) {
    return Object.entries(this.errorStats.byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }))
  }

  resolveError(errorId) {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolvedAt = Date.now()
    }
    return error
  }

  clearOldErrors(olderThanMs = 86400000) {
    const cutoff = Date.now() - olderThanMs
    const before = this.errors.length
    this.errors = this.errors.filter(e => e.timestamp > cutoff)
    return before - this.errors.length
  }

  exportErrors(options = {}) {
    const errors = this.getErrors(options)
    return {
      exportedAt: Date.now(),
      count: errors.length,
      errors: errors.map(e => ({
        id: e.id,
        timestamp: new Date(e.timestamp).toISOString(),
        clientId: e.clientId,
        type: e.error?.type,
        message: e.error?.message,
        stack: e.error?.stack,
        context: e.context,
        diagnostics: e.context?.diagnostics
      }))
    }
  }

  setupRoutes(app) {
    if (!app) return

    app.get('/api/errors', (req, res) => {
      const options = {
        userId: req.query.userId,
        type: req.query.type,
        level: req.query.level,
        since: req.query.since ? parseInt(req.query.since) : null,
        limit: req.query.limit ? parseInt(req.query.limit) : 100
      }
      res.json(this.getErrors(options))
    })

    app.get('/api/errors/stats', (req, res) => {
      res.json(this.getStats())
    })

    app.get('/api/errors/critical', (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50
      res.json(this.getCriticalErrors(limit))
    })

    app.get('/api/errors/user/:userId', (req, res) => {
      res.json(this.getErrorsByUser(req.params.userId))
    })

    app.post('/api/errors/:errorId/resolve', (req, res) => {
      const error = this.resolveError(req.params.errorId)
      res.json(error || { error: 'not found' })
    })

    app.get('/api/errors/export', (req, res) => {
      const options = {
        userId: req.query.userId,
        type: req.query.type
      }
      const data = this.exportErrors(options)
      res.json(data)
    })
  }
}
