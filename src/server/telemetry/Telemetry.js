import { TelemetryMetrics } from './TelemetryMetrics.js'
import { TelemetryBatch } from './TelemetryBatch.js'

export class Telemetry {
  constructor(logger, config = {}) {
    this.logger = logger
    this.config = {
      batchInterval: config.batchInterval || 60000,
      endpoint: config.endpoint || null,
      enabled: config.enabled !== false,
    }

    this.metrics = new TelemetryMetrics()
    this.batch = new TelemetryBatch(logger, this.config.endpoint)
    this.batchInterval = null
    this.startTime = Date.now()
  }

  trackAPICall(provider, endpoint, duration, success = true) {
    if (!this.config.enabled) return

    this.metrics.trackAPICall(provider, endpoint, duration)
    this.batch.addAPICall(provider, endpoint, duration, success)
  }

  trackError(type, category, message) {
    if (!this.config.enabled) return

    this.metrics.trackError(type, category)
    this.batch.addError(type, category, message)
  }

  trackEntitySpawn(entityId, type) {
    if (!this.config.enabled) return

    this.metrics.trackEntitySpawn()
    this.batch.addEntitySpawn(entityId, type)
  }

  trackEntityDespawn(entityId, type) {
    if (!this.config.enabled) return

    this.metrics.trackEntityDespawn()
    this.batch.addEntityDespawn(entityId, type)
  }

  trackPlayerConnection(playerId) {
    if (!this.config.enabled) return

    this.metrics.trackPlayerConnection()
    this.batch.addPlayerConnection(playerId)
  }

  trackPlayerDisconnection(playerId) {
    if (!this.config.enabled) return

    this.metrics.trackPlayerDisconnection()
    this.batch.addPlayerDisconnection(playerId)
  }

  trackWebSocketMessage(direction, bytes) {
    if (!this.config.enabled) return

    this.metrics.trackWebSocketMessage(direction, bytes)
  }

  async sendBatch() {
    await this.batch.send()
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
      metrics: this.metrics.getSnapshot(),
      batchSize: this.batch.size(),
      timestamp: new Date().toISOString(),
    }
  }

  exportData() {
    return {
      stats: this.getStats(),
      currentBatch: this.batch.batch,
      config: {
        batchInterval: this.config.batchInterval,
        endpoint: this.config.endpoint ? 'configured' : null,
        enabled: this.config.enabled,
      },
    }
  }

  reset() {
    this.metrics.reset()
    this.batch.clear()
    this.startTime = Date.now()
  }
}
