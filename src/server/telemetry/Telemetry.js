export class Telemetry {
  constructor(logger, config = {}) {
    this.logger = logger
    this.config = {
      batchInterval: config.batchInterval || 60000,
      endpoint: config.endpoint || null,
      enabled: config.enabled !== false,
    }

    this.metrics = {
      apiCalls: {
        total: 0,
        byProvider: {},
        byEndpoint: {},
      },
      errors: {
        total: 0,
        byType: {},
        byCategory: {},
      },
      responseTimes: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      },
      entities: {
        spawns: 0,
        despawns: 0,
        active: 0,
      },
      players: {
        connections: 0,
        disconnections: 0,
        active: 0,
      },
      websocket: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
      },
    }

    this.batch = []
    this.batchInterval = null
    this.startTime = Date.now()
  }

  trackAPICall(provider, endpoint, duration, success = true) {
    if (!this.config.enabled) return

    this.metrics.apiCalls.total++
    this.metrics.apiCalls.byProvider[provider] = (this.metrics.apiCalls.byProvider[provider] || 0) + 1
    this.metrics.apiCalls.byEndpoint[endpoint] = (this.metrics.apiCalls.byEndpoint[endpoint] || 0) + 1

    if (duration !== null && duration !== undefined) {
      this.metrics.responseTimes.count++
      this.metrics.responseTimes.sum += duration
      this.metrics.responseTimes.min = Math.min(this.metrics.responseTimes.min, duration)
      this.metrics.responseTimes.max = Math.max(this.metrics.responseTimes.max, duration)
      this.metrics.responseTimes.avg = Math.round(this.metrics.responseTimes.sum / this.metrics.responseTimes.count)
    }

    this.batch.push({
      type: 'api_call',
      provider,
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString(),
    })
  }

  trackError(type, category, message) {
    if (!this.config.enabled) return

    this.metrics.errors.total++
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1
    this.metrics.errors.byCategory[category] = (this.metrics.errors.byCategory[category] || 0) + 1

    this.batch.push({
      type: 'error',
      errorType: type,
      category,
      message,
      timestamp: new Date().toISOString(),
    })
  }

  trackEntitySpawn(entityId, type) {
    if (!this.config.enabled) return

    this.metrics.entities.spawns++
    this.metrics.entities.active++

    this.batch.push({
      type: 'entity_spawn',
      entityId,
      entityType: type,
      timestamp: new Date().toISOString(),
    })
  }

  trackEntityDespawn(entityId, type) {
    if (!this.config.enabled) return

    this.metrics.entities.despawns++
    this.metrics.entities.active = Math.max(0, this.metrics.entities.active - 1)

    this.batch.push({
      type: 'entity_despawn',
      entityId,
      entityType: type,
      timestamp: new Date().toISOString(),
    })
  }

  trackPlayerConnection(playerId) {
    if (!this.config.enabled) return

    this.metrics.players.connections++
    this.metrics.players.active++

    this.batch.push({
      type: 'player_connection',
      playerId,
      timestamp: new Date().toISOString(),
    })
  }

  trackPlayerDisconnection(playerId) {
    if (!this.config.enabled) return

    this.metrics.players.disconnections++
    this.metrics.players.active = Math.max(0, this.metrics.players.active - 1)

    this.batch.push({
      type: 'player_disconnection',
      playerId,
      timestamp: new Date().toISOString(),
    })
  }

  trackWebSocketMessage(direction, bytes) {
    if (!this.config.enabled) return

    if (direction === 'sent') {
      this.metrics.websocket.messagesSent++
      this.metrics.websocket.bytesSent += bytes
    } else {
      this.metrics.websocket.messagesReceived++
      this.metrics.websocket.bytesReceived += bytes
    }
  }

  async sendBatch() {
    if (!this.config.endpoint || !this.batch.length) {
      this.batch = []
      return
    }

    const data = {
      batch: this.batch,
      timestamp: new Date().toISOString(),
    }

    this.batch = []

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        this.logger?.error(`Telemetry batch send failed: HTTP ${response.status}`)
      }
    } catch (err) {
      this.logger?.error(`Telemetry batch send error: ${err.message}`)
    }
  }

  start() {
    if (this.batchInterval) return

    this.batchInterval = setInterval(() => {
      this.sendBatch()
    }, this.config.batchInterval)

    this.logger?.info(`Telemetry started (batch interval: ${this.config.batchInterval}ms)`)
  }

  stop() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval)
      this.batchInterval = null

      this.sendBatch()
      this.logger?.info('Telemetry stopped')
    }
  }

  getStats() {
    const uptime = Math.round((Date.now() - this.startTime) / 1000)

    return {
      enabled: this.config.enabled,
      uptime,
      metrics: {
        apiCalls: this.metrics.apiCalls,
        errors: this.metrics.errors,
        responseTimes: {
          ...this.metrics.responseTimes,
          min: this.metrics.responseTimes.min === Infinity ? 0 : this.metrics.responseTimes.min,
        },
        entities: this.metrics.entities,
        players: this.metrics.players,
        websocket: this.metrics.websocket,
      },
      batchSize: this.batch.length,
      timestamp: new Date().toISOString(),
    }
  }

  exportData() {
    return {
      stats: this.getStats(),
      currentBatch: this.batch,
      config: {
        batchInterval: this.config.batchInterval,
        endpoint: this.config.endpoint ? 'configured' : null,
        enabled: this.config.enabled,
      },
    }
  }

  reset() {
    this.metrics = {
      apiCalls: {
        total: 0,
        byProvider: {},
        byEndpoint: {},
      },
      errors: {
        total: 0,
        byType: {},
        byCategory: {},
      },
      responseTimes: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      },
      entities: {
        spawns: 0,
        despawns: 0,
        active: 0,
      },
      players: {
        connections: 0,
        disconnections: 0,
        active: 0,
      },
      websocket: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
      },
    }
    this.batch = []
    this.startTime = Date.now()
  }
}
