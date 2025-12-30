export class DegradationManager {
  constructor(circuitBreakerManager, strategies) {
    this.circuitBreakerManager = circuitBreakerManager
    this.strategies = strategies || []
  }

  getStatus() {
    return { degraded: false, strategies: [] }
  }

  checkAndApply() {
    return false
  }
}
