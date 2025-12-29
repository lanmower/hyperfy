import { ComponentLogger } from '../logging/ComponentLogger.js'

const DEGRADATION_MODES = {
  NORMAL: 'NORMAL',
  PARTIAL: 'PARTIAL',
  REDUCED: 'REDUCED',
  MINIMAL: 'MINIMAL',
  OFFLINE: 'OFFLINE',
}

export class DegradationManager {
  constructor(circuitBreakerManager, strategies = {}) {
    this.logger = new ComponentLogger('DegradationManager')
    this.circuitBreakerManager = circuitBreakerManager
    this.strategies = strategies
    this.mode = DEGRADATION_MODES.NORMAL
    this.degradedServices = new Set()
    this.history = []
    this.listeners = new Map()
    this.checkInterval = null

    if (circuitBreakerManager) {
      this.setupCircuitBreakerMonitoring()
    }
  }

  setupCircuitBreakerMonitoring() {
    this.checkInterval = setInterval(() => {
      this.updateFromCircuitBreakers()
    }, 5000)
  }

  updateFromCircuitBreakers() {
    if (!this.circuitBreakerManager) return

    const stats = this.circuitBreakerManager.getAllStats()
    const previouslyDegraded = new Set(this.degradedServices)

    this.degradedServices.clear()

    for (const [name, breakerStats] of Object.entries(stats.breakers)) {
      if (breakerStats.state === 'OPEN' || breakerStats.state === 'HALF_OPEN') {
        this.degradedServices.add(name)

        if (!previouslyDegraded.has(name)) {
          this.activateDegradation(name, breakerStats.state)
        }
      } else if (previouslyDegraded.has(name)) {
        this.deactivateDegradation(name)
      }
    }

    this.updateMode()
  }

  activateDegradation(serviceName, reason) {
    const strategy = this.strategies[serviceName]
    if (strategy && strategy.onDegrade) {
      try {
        strategy.onDegrade()
        this.logger.info(`Activated degradation for ${serviceName}: ${reason}`)
      } catch (err) {
        this.logger.error(`Error activating degradation for ${serviceName}: ${err.message}`)
      }
    }

    this.recordTransition(serviceName, 'DEGRADED', reason)
  }

  deactivateDegradation(serviceName) {
    const strategy = this.strategies[serviceName]
    if (strategy && strategy.onRecover) {
      try {
        strategy.onRecover()
        this.logger.info(`Deactivated degradation for ${serviceName}`)
      } catch (err) {
        this.logger.error(`Error deactivating degradation for ${serviceName}: ${err.message}`)
      }
    }

    this.recordTransition(serviceName, 'RECOVERED', 'Circuit breaker closed')
  }

  updateMode() {
    const previousMode = this.mode
    const degradedCount = this.degradedServices.size
    const criticalServices = this.getCriticalServices()
    const hasCriticalDegraded = criticalServices.some(s => this.degradedServices.has(s))

    if (degradedCount === 0) {
      this.mode = DEGRADATION_MODES.NORMAL
    } else if (hasCriticalDegraded && criticalServices.every(s => this.degradedServices.has(s))) {
      this.mode = DEGRADATION_MODES.OFFLINE
    } else if (hasCriticalDegraded) {
      this.mode = DEGRADATION_MODES.MINIMAL
    } else if (degradedCount >= 3) {
      this.mode = DEGRADATION_MODES.REDUCED
    } else {
      this.mode = DEGRADATION_MODES.PARTIAL
    }

    if (previousMode !== this.mode) {
      this.logger.info(`Mode changed: ${previousMode} -> ${this.mode}`)
      this.recordTransition('system', this.mode, `${degradedCount} services degraded`)
      this.notifyListeners('mode-change', { from: previousMode, to: this.mode })
    }
  }

  getCriticalServices() {
    return Object.entries(this.strategies)
      .filter(([_, strategy]) => strategy.critical)
      .map(([name, _]) => name)
  }

  recordTransition(service, status, reason) {
    const transition = {
      service,
      status,
      reason,
      timestamp: Date.now(),
      mode: this.mode,
    }

    this.history.push(transition)
    if (this.history.length > 200) {
      this.history.shift()
    }

    this.notifyListeners('transition', transition)
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return
    for (const callback of this.listeners.get(event)) {
      try {
        callback(data)
      } catch (err) {
        this.logger.error(`Listener error for ${event}: ${err.message}`)
      }
    }
  }

  getMode() {
    return this.mode
  }

  isDegraded(serviceName) {
    if (serviceName) {
      return this.degradedServices.has(serviceName)
    }
    return this.mode !== DEGRADATION_MODES.NORMAL
  }

  getDegradedServices() {
    return Array.from(this.degradedServices)
  }

  getServiceStatus(serviceName) {
    const degraded = this.degradedServices.has(serviceName)
    const strategy = this.strategies[serviceName]

    return {
      name: serviceName,
      degraded,
      critical: strategy?.critical || false,
      fallbackMode: degraded ? (strategy?.fallbackMode || 'unknown') : null,
      lastTransition: this.history
        .filter(h => h.service === serviceName)
        .slice(-1)[0] || null,
    }
  }

  getAllStatus() {
    const services = {}

    for (const serviceName of Object.keys(this.strategies)) {
      services[serviceName] = this.getServiceStatus(serviceName)
    }

    return {
      mode: this.mode,
      degradedCount: this.degradedServices.size,
      services,
      history: this.history.slice(-20),
    }
  }

  getStats() {
    const totalServices = Object.keys(this.strategies).length
    const criticalServices = this.getCriticalServices()
    const degradedCritical = criticalServices.filter(s => this.degradedServices.has(s))

    return {
      mode: this.mode,
      totalServices,
      degradedServices: this.degradedServices.size,
      criticalServices: criticalServices.length,
      degradedCritical: degradedCritical.length,
      transitionCount: this.history.length,
      lastTransition: this.history[this.history.length - 1] || null,
    }
  }

  forceMode(mode, reason = 'Manual override') {
    if (!Object.values(DEGRADATION_MODES).includes(mode)) {
      throw new Error(`Invalid degradation mode: ${mode}`)
    }

    const previousMode = this.mode
    this.mode = mode

    this.logger.info(`Forced mode change: ${previousMode} -> ${mode} (${reason})`)
    this.recordTransition('system', mode, reason)
    this.notifyListeners('mode-change', { from: previousMode, to: mode, forced: true })

    return { success: true, previousMode, currentMode: mode }
  }

  shutdown() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.listeners.clear()
    this.logger.info(`Manager shutdown`)
  }
}

export { DEGRADATION_MODES }
