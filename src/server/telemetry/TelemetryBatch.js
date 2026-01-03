export class TelemetryBatch {
  constructor(logger, endpoint) {
    this.logger = logger
    this.endpoint = endpoint
    this.batch = []
  }

  addAPICall(provider, endpoint, duration, success) {
    this.batch.push({
      type: 'api_call',
      provider,
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString(),
    })
  }

  addError(type, category, message) {
    this.batch.push({
      type: 'error',
      errorType: type,
      category,
      message,
      timestamp: new Date().toISOString(),
    })
  }

  addEntitySpawn(entityId, entityType) {
    this.batch.push({
      type: 'entity_spawn',
      entityId,
      entityType,
      timestamp: new Date().toISOString(),
    })
  }

  addEntityDespawn(entityId, entityType) {
    this.batch.push({
      type: 'entity_despawn',
      entityId,
      entityType,
      timestamp: new Date().toISOString(),
    })
  }

  addPlayerConnection(playerId) {
    this.batch.push({
      type: 'player_connection',
      playerId,
      timestamp: new Date().toISOString(),
    })
  }

  addPlayerDisconnection(playerId) {
    this.batch.push({
      type: 'player_disconnection',
      playerId,
      timestamp: new Date().toISOString(),
    })
  }

  async send() {
    if (!this.endpoint || !this.batch.length) {
      this.batch = []
      return
    }

    const data = {
      batch: this.batch,
      timestamp: new Date().toISOString(),
    }

    this.batch = []

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        this.logger?.error(`Telemetry batch send failed: HTTP ${response.status}`)
      }
    } catch (err) {
      this.logger?.error(`Telemetry batch send error: ${err.message}`)
    }
  }

  clear() {
    this.batch = []
  }

  size() {
    return this.batch.length
  }
}
