export class HealthAggregator {
  constructor(world, circuitBreakerManager) {
    this.world = world
    this.circuitBreakerManager = circuitBreakerManager
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
    return { status, metrics: metrics?.lastMin || null, circuitBreaker }
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
    return { status, circuitBreaker }
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
    return { status, connections, circuitBreaker }
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
}
