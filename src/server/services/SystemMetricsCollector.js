export class SystemMetricsCollector {
  constructor(startTime) {
    this.startTime = startTime || global.SERVER_START_TIME || Date.now()
  }

  getSystemStatus(circuitBreakerManager, degradationManager) {
    const uptime = Math.round((Date.now() - this.startTime) / 1000)
    const memory = process.memoryUsage()

    const degradationStats = degradationManager ? degradationManager.getStats() : null
    const isDegraded = degradationStats && degradationStats.mode !== 'NORMAL'

    const circuitStats = circuitBreakerManager ? circuitBreakerManager.getAllStats() : null
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

  getPerformanceMetrics(world, timeoutManager) {
    const metrics = {}
    if (world?.db?.metrics) {
      metrics.database = world.db.metrics()
    }
    if (timeoutManager) {
      metrics.timeouts = {
        http: timeoutManager.getTimeout('http'),
        websocket: timeoutManager.getTimeout('websocket'),
        database: timeoutManager.getTimeout('database'),
        upload: timeoutManager.getTimeout('upload'),
      }
    }
    return metrics
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
    if (secs > 0 || !parts.length) parts.push(`${secs}s`)
    return parts.join(' ')
  }
}
