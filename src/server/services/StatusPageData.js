export class StatusPageData {
  constructor(world, logger, errorTracker, aiProviderHealth, circuitBreakerManager, degradationManager, timeoutManager) {
    this.world = world
    this.logger = logger
    this.errorTracker = errorTracker
    this.aiProviderHealth = aiProviderHealth
    this.circuitBreakerManager = circuitBreakerManager
    this.degradationManager = degradationManager
    this.timeoutManager = timeoutManager
    this.serviceHistory = []
    this.maxHistoryItems = 500
    this.startTime = global.SERVER_START_TIME || Date.now()
  }

  recordEvent(service, status, message) {
    const event = {
      service,
      status,
      message,
      timestamp: Date.now(),
    }

    this.serviceHistory.push(event)
    if (this.serviceHistory.length > this.maxHistoryItems) {
      this.serviceHistory.shift()
    }
  }

  getSystemStatus() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000)
    const memory = process.memoryUsage()

    const degradationStats = this.degradationManager ? this.degradationManager.getStats() : null
    const isDegraded = degradationStats && degradationStats.mode !== 'NORMAL'

    const circuitStats = this.circuitBreakerManager ? this.circuitBreakerManager.getAllStats() : null
    const hasOpenCircuit = circuitStats && circuitStats.summary.open > 0

    const status = isDegraded ? 'degraded' : hasOpenCircuit ? 'degraded' : 'healthy'

    return {
      status,
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
  }

  getServiceHealth() {
    const services = {}

    services.database = this.getDatabaseHealth()
    services.storage = this.getStorageHealth()
    services.websocket = this.getWebSocketHealth()
    services.world = this.getWorldHealth()
    services.network = this.getNetworkHealth()

    return services
  }

  getDatabaseHealth() {
    const db = this.world?.db
    if (!db) {
      return { status: 'down', message: 'Database not initialized' }
    }

    const metrics = db.metrics ? db.metrics() : null
    const circuitBreaker = this.circuitBreakerManager?.has('database')
      ? this.circuitBreakerManager.getStats('database')
      : null

    const status = circuitBreaker?.state === 'OPEN' ? 'down'
      : circuitBreaker?.state === 'HALF_OPEN' ? 'degraded'
      : 'healthy'

    return {
      status,
      metrics: metrics?.lastMin || null,
      circuitBreaker,
    }
  }

  getStorageHealth() {
    const storage = this.world?.storage
    if (!storage) {
      return { status: 'down', message: 'Storage not initialized' }
    }

    const circuitBreaker = this.circuitBreakerManager?.has('storage')
      ? this.circuitBreakerManager.getStats('storage')
      : null

    const status = circuitBreaker?.state === 'OPEN' ? 'down'
      : circuitBreaker?.state === 'HALF_OPEN' ? 'degraded'
      : 'healthy'

    return {
      status,
      circuitBreaker,
    }
  }

  getWebSocketHealth() {
    const network = this.world?.network
    if (!network) {
      return { status: 'down', message: 'Network not initialized' }
    }

    const connections = network.sockets?.size || 0
    const circuitBreaker = this.circuitBreakerManager?.has('websocket')
      ? this.circuitBreakerManager.getStats('websocket')
      : null

    const status = circuitBreaker?.state === 'OPEN' ? 'down'
      : circuitBreaker?.state === 'HALF_OPEN' ? 'degraded'
      : 'healthy'

    return {
      status,
      connections,
      circuitBreaker,
    }
  }

  getWorldHealth() {
    if (!this.world) {
      return { status: 'down', message: 'World not initialized' }
    }

    return {
      status: 'healthy',
      entities: this.world.entities?.list?.length || 0,
      blueprints: this.world.blueprints?.list?.length || 0,
      apps: this.world.apps?.list?.length || 0,
    }
  }

  getNetworkHealth() {
    const network = this.world?.network
    if (!network) {
      return { status: 'down', message: 'Network not initialized' }
    }

    return {
      status: 'healthy',
      activeConnections: network.sockets?.size || 0,
    }
  }

  getCircuitBreakerStatus() {
    if (!this.circuitBreakerManager) {
      return null
    }

    return this.circuitBreakerManager.getAllStats()
  }

  getDegradationStatus() {
    if (!this.degradationManager) {
      return null
    }

    return this.degradationManager.getAllStatus()
  }

  getAIProviderStatus() {
    if (!this.aiProviderHealth) {
      return null
    }

    const status = this.aiProviderHealth.getAllStatus()
    const summary = {
      total: Object.keys(status).length,
      healthy: 0,
      degraded: 0,
      down: 0,
    }

    for (const provider of Object.values(status)) {
      if (provider.status === 'UP') summary.healthy++
      else if (provider.status === 'DEGRADED') summary.degraded++
      else if (provider.status === 'DOWN') summary.down++
    }

    return {
      summary,
      providers: status,
    }
  }

  getErrorMetrics() {
    if (!this.errorTracker) {
      return null
    }

    const stats = this.errorTracker.getStats()
    const recentErrors = this.errorTracker.getRecentErrors ? this.errorTracker.getRecentErrors(10) : []

    return {
      total: stats.totalErrors || 0,
      byLevel: stats.byLevel || {},
      byCategory: stats.byCategory || {},
      recent: recentErrors,
    }
  }

  getPerformanceMetrics() {
    const metrics = {}

    if (this.world?.db?.metrics) {
      metrics.database = this.world.db.metrics()
    }

    if (this.timeoutManager) {
      metrics.timeouts = {
        http: this.timeoutManager.getTimeout('http'),
        websocket: this.timeoutManager.getTimeout('websocket'),
        database: this.timeoutManager.getTimeout('database'),
        upload: this.timeoutManager.getTimeout('upload'),
      }
    }

    return metrics
  }

  getIncidentHistory(limit = 50) {
    const history = []

    if (this.degradationManager) {
      const degradationHistory = this.degradationManager.getAllStatus().history || []
      for (const event of degradationHistory) {
        history.push({
          type: 'degradation',
          service: event.service,
          status: event.status,
          reason: event.reason,
          mode: event.mode,
          timestamp: event.timestamp,
        })
      }
    }

    history.push(...this.serviceHistory)

    history.sort((a, b) => b.timestamp - a.timestamp)

    return history.slice(0, limit)
  }

  getFullStatus() {
    return {
      system: this.getSystemStatus(),
      services: this.getServiceHealth(),
      circuitBreakers: this.getCircuitBreakerStatus(),
      degradation: this.getDegradationStatus(),
      aiProviders: this.getAIProviderStatus(),
      errors: this.getErrorMetrics(),
      performance: this.getPerformanceMetrics(),
      incidents: this.getIncidentHistory(50),
      timestamp: new Date().toISOString(),
    }
  }

  getSummary() {
    const system = this.getSystemStatus()
    const services = this.getServiceHealth()
    const circuitBreakers = this.getCircuitBreakerStatus()
    const degradation = this.getDegradationStatus()

    const serviceStatuses = Object.entries(services).map(([name, data]) => ({
      name,
      status: data.status,
    }))

    const healthyCount = serviceStatuses.filter(s => s.status === 'healthy').length
    const degradedCount = serviceStatuses.filter(s => s.status === 'degraded').length
    const downCount = serviceStatuses.filter(s => s.status === 'down').length

    return {
      system: {
        status: system.status,
        uptime: system.uptimeFormatted,
      },
      services: {
        total: serviceStatuses.length,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
      },
      circuitBreakers: circuitBreakers ? {
        total: circuitBreakers.summary.total,
        open: circuitBreakers.summary.open,
        halfOpen: circuitBreakers.summary.halfOpen,
        closed: circuitBreakers.summary.closed,
      } : null,
      degradation: degradation ? {
        mode: degradation.mode,
        degradedServices: degradation.degradedCount,
      } : null,
      timestamp: new Date().toISOString(),
    }
  }
}
