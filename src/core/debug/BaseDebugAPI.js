/* Shared debug API base for client and server platforms */

export class BaseDebugAPI {
  constructor(world) {
    this.world = world
  }

  getBlueprints() {
    const blueprints = this.world.blueprints?.getAll?.() || []
    return blueprints.map(bp => ({
      id: bp.id,
      name: bp.name,
      type: bp.type,
      entities: bp.entities?.size || 0
    }))
  }

  getEntities() {
    const entities = this.world.entities?.items || new Map()
    return Array.from(entities.values()).map(e => ({
      id: e.id,
      type: e.type,
      position: e.position,
      active: e.active
    }))
  }

  getPlayers() {
    const players = this.world.players?.items || new Map()
    return Array.from(players.values()).map(p => ({
      id: p.id,
      userId: p.userId,
      active: p.active
    }))
  }

  getNetworkStats() {
    return this.world.network?.getStats?.() || {
      connected: false,
      latency: 0,
      messages: 0
    }
  }

  getPerformanceMetrics() {
    return this.world.performanceMonitor?.getMetrics?.() || {}
  }

  getMemoryUsage() {
    if (typeof process !== 'undefined') {
      return process.memoryUsage()
    }
    return {}
  }
}
