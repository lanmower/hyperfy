export class CullingManager {
  constructor(config = {}) {
    this.cullingDistance = config.cullingDistance || 100
    this.updateFrequency = config.updateFrequency || 100
    this.relevanceZones = new Map()
    this.lastUpdateTime = new Map()
  }

  computeRelevantPlayers(observerPos, allPlayers) {
    const relevant = []

    for (const player of allPlayers) {
      if (this.isRelevant(observerPos, player.position)) {
        relevant.push(player)
      }
    }

    return relevant
  }

  isRelevant(observerPos, targetPos) {
    const dx = observerPos[0] - targetPos[0]
    const dy = observerPos[1] - targetPos[1]
    const dz = observerPos[2] - targetPos[2]

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    return distance <= this.cullingDistance
  }

  createRelevanceZone(playerId, position) {
    this.relevanceZones.set(playerId, {
      position: JSON.parse(JSON.stringify(position)),
      relevantPlayers: new Set(),
      lastUpdate: Date.now()
    })
  }

  updateRelevanceZone(playerId, position) {
    const zone = this.relevanceZones.get(playerId)
    if (zone) {
      zone.position = JSON.parse(JSON.stringify(position))
      zone.lastUpdate = Date.now()
    }
  }

  getRelevantPlayersFor(playerId, allPlayers) {
    const zone = this.relevanceZones.get(playerId)
    if (!zone) return allPlayers

    const now = Date.now()
    if (now - zone.lastUpdate > this.updateFrequency) {
      zone.relevantPlayers.clear()

      for (const player of allPlayers) {
        if (player.id === playerId) continue

        if (this.isRelevant(zone.position, player.position)) {
          zone.relevantPlayers.add(player.id)
        }
      }

      zone.lastUpdate = now
    }

    return allPlayers.filter(p => p.id === playerId || zone.relevantPlayers.has(p.id))
  }

  removeRelevanceZone(playerId) {
    this.relevanceZones.delete(playerId)
  }

  setCullingDistance(distance) {
    this.cullingDistance = distance
  }

  getStats() {
    let totalRelevant = 0
    for (const zone of this.relevanceZones.values()) {
      totalRelevant += zone.relevantPlayers.size
    }

    return {
      totalZones: this.relevanceZones.size,
      totalRelevantPairs: totalRelevant,
      avgPerZone: this.relevanceZones.size > 0 ? totalRelevant / this.relevanceZones.size : 0
    }
  }
}
