export class CircuitBreakerHealthMapper {
  mapCircuitBreakerStatus(circuitBreakerManager) {
    if (!circuitBreakerManager) {
      return null
    }
    return circuitBreakerManager.getAllStats()
  }

  mapDegradationStatus(degradationManager) {
    if (!degradationManager) {
      return null
    }
    return degradationManager.getAllStatus()
  }

  mapAIProviderStatus(aiProviderHealth) {
    if (!aiProviderHealth) {
      return null
    }
    const status = aiProviderHealth.getAllStatus()
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
    return { summary, providers: status }
  }

  mapErrorMetrics(errorTracker) {
    if (!errorTracker) {
      return null
    }
    const stats = errorTracker.getStats()
    const recentErrors = errorTracker.getRecentErrors ? errorTracker.getRecentErrors(10) : []
    return {
      total: stats.totalErrors || 0,
      byLevel: stats.byLevel || {},
      byCategory: stats.byCategory || {},
      recent: recentErrors,
    }
  }
}
