export class TelemetryMetrics {
  constructor() {
    this.apiCalls = {
      total: 0,
      byProvider: {},
      byEndpoint: {},
    }
    this.errors = {
      total: 0,
      byType: {},
      byCategory: {},
    }
    this.responseTimes = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: 0,
      avg: 0,
    }
    this.entities = {
      spawns: 0,
      despawns: 0,
      active: 0,
    }
    this.players = {
      connections: 0,
      disconnections: 0,
      active: 0,
    }
    this.websocket = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
    }
  }

  trackAPICall(provider, endpoint, duration) {
    this.apiCalls.total++
    this.apiCalls.byProvider[provider] = (this.apiCalls.byProvider[provider] || 0) + 1
    this.apiCalls.byEndpoint[endpoint] = (this.apiCalls.byEndpoint[endpoint] || 0) + 1

    if (duration !== null && duration !== undefined) {
      this.responseTimes.count++
      this.responseTimes.sum += duration
      this.responseTimes.min = Math.min(this.responseTimes.min, duration)
      this.responseTimes.max = Math.max(this.responseTimes.max, duration)
      this.responseTimes.avg = Math.round(this.responseTimes.sum / this.responseTimes.count)
    }
  }

  trackError(type, category) {
    this.errors.total++
    this.errors.byType[type] = (this.errors.byType[type] || 0) + 1
    this.errors.byCategory[category] = (this.errors.byCategory[category] || 0) + 1
  }

  trackEntitySpawn() {
    this.entities.spawns++
    this.entities.active++
  }

  trackEntityDespawn() {
    this.entities.despawns++
    this.entities.active = Math.max(0, this.entities.active - 1)
  }

  trackPlayerConnection() {
    this.players.connections++
    this.players.active++
  }

  trackPlayerDisconnection() {
    this.players.disconnections++
    this.players.active = Math.max(0, this.players.active - 1)
  }

  trackWebSocketMessage(direction, bytes) {
    if (direction === 'sent') {
      this.websocket.messagesSent++
      this.websocket.bytesSent += bytes
    } else {
      this.websocket.messagesReceived++
      this.websocket.bytesReceived += bytes
    }
  }

  getSnapshot() {
    return {
      apiCalls: this.apiCalls,
      errors: this.errors,
      responseTimes: {
        ...this.responseTimes,
        min: this.responseTimes.min === Infinity ? 0 : this.responseTimes.min,
      },
      entities: this.entities,
      players: this.players,
      websocket: this.websocket,
    }
  }

  reset() {
    this.apiCalls = { total: 0, byProvider: {}, byEndpoint: {} }
    this.errors = { total: 0, byType: {}, byCategory: {} }
    this.responseTimes = { count: 0, sum: 0, min: Infinity, max: 0, avg: 0 }
    this.entities = { spawns: 0, despawns: 0, active: 0 }
    this.players = { connections: 0, disconnections: 0, active: 0 }
    this.websocket = { messagesSent: 0, messagesReceived: 0, bytesSent: 0, bytesReceived: 0 }
  }
}
