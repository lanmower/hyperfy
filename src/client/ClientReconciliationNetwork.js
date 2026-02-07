export class ClientReconciliationNetwork {
  constructor(config = {}) {
    this.config = config
    this.remoteStates = new Map()
    this.entityStates = new Map()
  }

  updatePlayerState(playerId, state) {
    this.remoteStates.set(playerId, state)
  }

  removePlayerState(playerId) {
    this.remoteStates.delete(playerId)
  }

  getPlayerState(playerId) {
    return this.remoteStates.get(playerId)
  }

  getAllPlayerStates() {
    return new Map(this.remoteStates)
  }

  hasPlayerState(playerId) {
    return this.remoteStates.has(playerId)
  }

  updateEntityState(entityId, state) {
    this.entityStates.set(entityId, state)
  }

  getEntityState(entityId) {
    return this.entityStates.get(entityId)
  }

  getAllEntityStates() {
    return new Map(this.entityStates)
  }

  hasEntityState(entityId) {
    return this.entityStates.has(entityId)
  }

  clear() {
    this.remoteStates.clear()
    this.entityStates.clear()
  }
}
