import { BaseManager } from '../../core/patterns/BaseManager.js'

export class DegradationManager extends BaseManager {
  constructor(circuitBreakerManager, strategies) {
    super(null, 'DegradationManager')
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
