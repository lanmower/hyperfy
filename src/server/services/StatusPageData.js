import { HealthAggregator } from './HealthAggregator.js'
import { SystemMetricsCollector } from './SystemMetricsCollector.js'
import { CircuitBreakerHealthMapper } from './CircuitBreakerHealthMapper.js'
import { IncidentHistory } from './IncidentHistory.js'

export class StatusPageData {
  constructor(world, logger, errorTracker, aiProviderHealth, circuitBreakerManager, degradationManager, timeoutManager) {
    this.world = world
    this.logger = logger
    this.errorTracker = errorTracker
    this.aiProviderHealth = aiProviderHealth
    this.circuitBreakerManager = circuitBreakerManager
    this.degradationManager = degradationManager
    this.timeoutManager = timeoutManager

    this.healthAggregator = new HealthAggregator(world, circuitBreakerManager)
    this.metricsCollector = new SystemMetricsCollector(global.SERVER_START_TIME || Date.now())
    this.healthMapper = new CircuitBreakerHealthMapper()
    this.incidentHistory = new IncidentHistory(500)
  }

  recordEvent(service, status, message) {
    this.incidentHistory.recordEvent(service, status, message)
  }

  getSystemStatus() {
    return this.metricsCollector.getSystemStatus(this.circuitBreakerManager, this.degradationManager)
  }

  getServiceHealth() {
    return this.healthAggregator.getServiceHealth()
  }

  getCircuitBreakerStatus() {
    return this.healthMapper.mapCircuitBreakerStatus(this.circuitBreakerManager)
  }

  getDegradationStatus() {
    return this.healthMapper.mapDegradationStatus(this.degradationManager)
  }

  getAIProviderStatus() {
    return this.healthMapper.mapAIProviderStatus(this.aiProviderHealth)
  }

  getErrorMetrics() {
    return this.healthMapper.mapErrorMetrics(this.errorTracker)
  }

  getPerformanceMetrics() {
    return this.metricsCollector.getPerformanceMetrics(this.world, this.timeoutManager)
  }

  getIncidentHistory(limit = 50) {
    return this.incidentHistory.getHistory(this.degradationManager, limit)
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
