import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('LoadShedder')

export class LoadShedder {
  constructor(world) {
    this.world = world
    this.boundaries = new Map()
    this.metrics = new Map()
    this.shedding = false
    this.activeStrategies = new Set()
  }

  registerBoundary(name, options = {}) {
    const boundary = {
      name,
      maxQueueDepth: options.maxQueueDepth || 100,
      maxLatencyMs: options.maxLatencyMs || 100,
      dropProbability: 0,
      priority: options.priority || 'normal',
      circuitBreakerTrips: 0,
      circuitBreakerOpen: false,
      circuitBreakerResetTime: 30000,
      circuitBreakerLastTrip: 0,
      highPriorityBypass: options.highPriorityBypass !== false,
      shedStrategy: options.shedStrategy || 'random',
      metadata: options.metadata || {}
    }

    this.boundaries.set(name, boundary)
    this.metrics.set(name, {
      queued: 0,
      dropped: 0,
      processed: 0,
      latency: 0,
      shedEvents: 0
    })

    logger.info('Boundary registered', { name, ...boundary })
    return boundary
  }

  updateQueueDepth(boundaryName, depth, latency = 0) {
    const boundary = this.boundaries.get(boundaryName)
    if (!boundary) return

    const metrics = this.metrics.get(boundaryName)
    metrics.queued = depth
    metrics.latency = latency

    const shouldShed = this.calculateShedding(boundary, depth, latency)
    if (shouldShed && !boundary.highPriorityBypass) {
      boundary.dropProbability = Math.min(0.9, depth / boundary.maxQueueDepth)
      this.notifyOverload(boundaryName)
    } else if (depth < boundary.maxQueueDepth * 0.5) {
      boundary.dropProbability = Math.max(0, boundary.dropProbability - 0.1)
    }

    this.checkCircuitBreaker(boundary)
  }

  calculateShedding(boundary, depth, latency) {
    if (depth > boundary.maxQueueDepth) return true
    if (latency > boundary.maxLatencyMs) return true
    return false
  }

  shouldDropRequest(boundaryName, isPriority = false) {
    const boundary = this.boundaries.get(boundaryName)
    if (!boundary) return false

    if (boundary.circuitBreakerOpen) {
      return !isPriority
    }

    if (isPriority && boundary.highPriorityBypass) {
      return false
    }

    return Math.random() < boundary.dropProbability
  }

  checkCircuitBreaker(boundary) {
    const now = Date.now()

    if (boundary.circuitBreakerOpen) {
      if (now - boundary.circuitBreakerLastTrip > boundary.circuitBreakerResetTime) {
        boundary.circuitBreakerOpen = false
        boundary.circuitBreakerTrips = 0
        logger.info('Circuit breaker reset', { boundary: boundary.name })
      }
    }
  }

  tripCircuitBreaker(boundaryName) {
    const boundary = this.boundaries.get(boundaryName)
    if (!boundary) return

    boundary.circuitBreakerTrips++
    boundary.circuitBreakerLastTrip = Date.now()

    if (boundary.circuitBreakerTrips >= 3) {
      boundary.circuitBreakerOpen = true
      this.activeStrategies.add(boundaryName)
      logger.warn('Circuit breaker opened', {
        boundary: boundaryName,
        trips: boundary.circuitBreakerTrips
      })
      this.notifyCircuitBreakerTrip(boundaryName)
    }
  }

  recordDropped(boundaryName, count = 1) {
    const metrics = this.metrics.get(boundaryName)
    if (metrics) {
      metrics.dropped += count
      metrics.shedEvents++
      this.shedding = true
    }
  }

  recordProcessed(boundaryName, count = 1) {
    const metrics = this.metrics.get(boundaryName)
    if (metrics) {
      metrics.processed += count
    }
  }

  notifyOverload(boundaryName) {
    const boundary = this.boundaries.get(boundaryName)
    const event = {
      type: 'boundary_overload',
      boundary: boundaryName,
      timestamp: Date.now(),
      metrics: this.metrics.get(boundaryName),
      dropProbability: boundary.dropProbability
    }

    this.world.emit('load-shed:overload', event)
    this.world.eventAudit?.trackEvent('LoadShedder', 'boundary_overload', event)
  }

  notifyCircuitBreakerTrip(boundaryName) {
    const event = {
      type: 'circuit_breaker_trip',
      boundary: boundaryName,
      timestamp: Date.now()
    }

    this.world.emit('load-shed:circuit-breaker', event)
    this.world.eventAudit?.trackEvent('LoadShedder', 'circuit_breaker_trip', event)
  }

  getShedStatus() {
    const status = {
      shedding: this.shedding,
      activeStrategies: Array.from(this.activeStrategies),
      boundaries: {}
    }

    for (const [name, boundary] of this.boundaries) {
      const metrics = this.metrics.get(name)
      status.boundaries[name] = {
        queued: metrics.queued,
        dropped: metrics.dropped,
        processed: metrics.processed,
        dropProbability: boundary.dropProbability,
        circuitBreakerOpen: boundary.circuitBreakerOpen,
        circuitBreakerTrips: boundary.circuitBreakerTrips,
        dropRate: metrics.processed > 0 ? metrics.dropped / (metrics.dropped + metrics.processed) : 0
      }
    }

    return status
  }

  getMetrics(boundaryName) {
    return {
      boundary: boundaryName,
      metrics: this.metrics.get(boundaryName),
      boundary: this.boundaries.get(boundaryName)
    }
  }

  reset(boundaryName) {
    const boundary = this.boundaries.get(boundaryName)
    if (boundary) {
      boundary.dropProbability = 0
      boundary.circuitBreakerOpen = false
      boundary.circuitBreakerTrips = 0
    }

    const metrics = this.metrics.get(boundaryName)
    if (metrics) {
      metrics.dropped = 0
      metrics.shedEvents = 0
    }

    logger.info('Load shedder reset', { boundary: boundaryName })
  }

  resetAll() {
    for (const name of this.boundaries.keys()) {
      this.reset(name)
    }
    this.shedding = false
    this.activeStrategies.clear()
  }
}
