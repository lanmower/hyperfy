import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('EventAudit')

export class EventAudit {
  constructor() {
    this.emitters = new Map()
    this.eventCounts = new Map()
    this.eventHistory = new Map()
    this.maxHistorySize = 100
    this.isEnabled = false
  }

  registerEmitter(name, emitter, eventNames = []) {
    const audit = {
      name,
      emitter,
      eventNames,
      totalListeners: 0,
      totalEvents: 0,
      createdAt: Date.now(),
    }

    this.emitters.set(name, audit)
    logger.info('Event emitter registered', { name, events: eventNames })

    return audit
  }

  trackEvent(emitterName, eventName, data = null) {
    if (!this.isEnabled) return

    const key = `${emitterName}:${eventName}`

    if (!this.eventCounts.has(key)) {
      this.eventCounts.set(key, 0)
      this.eventHistory.set(key, [])
    }

    this.eventCounts.set(key, (this.eventCounts.get(key) || 0) + 1)

    const event = {
      emitter: emitterName,
      event: eventName,
      timestamp: Date.now(),
      dataSize: this.getDataSize(data),
    }

    const history = this.eventHistory.get(key)
    history.push(event)

    if (history.length > this.maxHistorySize) {
      history.shift()
    }
  }

  getDataSize(data) {
    if (data === null || data === undefined) return 0
    if (typeof data === 'string') return data.length
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data).length
      } catch {
        return 0
      }
    }
    return 0
  }

  getEmitterStats(name) {
    const audit = this.emitters.get(name)
    if (!audit) return null

    const stats = {
      name,
      eventCount: 0,
      eventNames: audit.eventNames || [],
      events: {},
    }

    for (const [key, count] of this.eventCounts) {
      if (key.startsWith(name + ':')) {
        const eventName = key.substring(name.length + 1)
        stats.events[eventName] = count
        stats.eventCount += count
      }
    }

    return stats
  }

  getAllStats() {
    const stats = {}

    for (const [name] of this.emitters) {
      stats[name] = this.getEmitterStats(name)
    }

    return stats
  }

  getEventHistory(emitterName, eventName, limit = 20) {
    const key = `${emitterName}:${eventName}`
    const history = this.eventHistory.get(key) || []
    return history.slice(-limit)
  }

  getTopEvents(limit = 10) {
    const sorted = Array.from(this.eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    return sorted.map(([key, count]) => {
      const [emitter, event] = key.split(':')
      return { emitter, event, count }
    })
  }

  getEventFrequency(emitterName, eventName, windowMs = 5000) {
    const key = `${emitterName}:${eventName}`
    const history = this.eventHistory.get(key) || []

    const now = Date.now()
    const recentEvents = history.filter(e => now - e.timestamp < windowMs)

    return {
      emitter: emitterName,
      event: eventName,
      frequencyPer5s: recentEvents.length,
      frequencyPerSecond: (recentEvents.length / (windowMs / 1000)).toFixed(2),
    }
  }

  getAnomalies(threshold = 100) {
    const anomalies = []

    for (const [key, count] of this.eventCounts) {
      if (count > threshold) {
        const [emitter, event] = key.split(':')
        anomalies.push({
          emitter,
          event,
          count,
          severity: count > threshold * 2 ? 'critical' : 'warning',
        })
      }
    }

    return anomalies.sort((a, b) => b.count - a.count)
  }

  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      emittersCount: this.emitters.size,
      totalEventsFired: Array.from(this.eventCounts.values()).reduce((a, b) => a + b, 0),
      emitters: this.getAllStats(),
      topEvents: this.getTopEvents(20),
      anomalies: this.getAnomalies(100),
    }

    return report
  }

  enable() {
    this.isEnabled = true
    logger.info('Event audit enabled')
  }

  disable() {
    this.isEnabled = false
    logger.info('Event audit disabled')
  }

  clear() {
    this.eventCounts.clear()
    this.eventHistory.clear()
  }

  reset() {
    this.emitters.clear()
    this.clear()
  }
}

export const eventAudit = new EventAudit()
