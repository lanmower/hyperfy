export class ErrorPatternTracker {
  constructor() {
    this.errorPatterns = new Map()
  }

  track(error) {
    const patternKey = `${error.category}:${error.message}`

    if (!this.errorPatterns.has(patternKey)) {
      this.errorPatterns.set(patternKey, {
        category: error.category,
        message: error.message,
        count: 0,
        clients: new Set(),
        firstSeen: error.timestamp,
        lastSeen: error.timestamp
      })
    }

    const pattern = this.errorPatterns.get(patternKey)
    pattern.count += error.count || 1
    pattern.clients.add(error.clientId)
    pattern.lastSeen = error.timestamp

    if (this.errorPatterns.size > 500) {
      this.cleanup()
    }
  }

  cleanup() {
    const cutoff = Date.now() - (60 * 60 * 1000)
    const toDelete = []

    for (const [key, pattern] of this.errorPatterns.entries()) {
      if (pattern.lastSeen < cutoff) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.errorPatterns.delete(key))
  }

  getPatterns() {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.count - a.count)
  }

  getTopPatterns(limit = 10, timeWindow = 60 * 60 * 1000) {
    const cutoff = Date.now() - timeWindow
    return Array.from(this.errorPatterns.values())
      .filter(p => p.lastSeen >= cutoff)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(p => ({
        category: p.category,
        message: p.message.substring(0, 100),
        count: p.count,
        affectedClients: p.clients.size,
        firstSeen: p.firstSeen,
        lastSeen: p.lastSeen
      }))
  }

  clear() {
    this.errorPatterns.clear()
  }
}
