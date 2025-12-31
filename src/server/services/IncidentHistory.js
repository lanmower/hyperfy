export class IncidentHistory {
  constructor(maxItems = 500) {
    this.events = []
    this.maxItems = maxItems
  }

  recordEvent(service, status, message) {
    const event = {
      service,
      status,
      message,
      timestamp: Date.now(),
    }
    this.events.push(event)
    if (this.events.length > this.maxItems) {
      this.events.shift()
    }
  }

  getHistory(degradationManager, limit = 50) {
    const history = []
    if (degradationManager) {
      const degradationHistory = degradationManager.getAllStatus().history || []
      for (const event of degradationHistory) {
        history.push({
          type: 'degradation',
          service: event.service,
          status: event.status,
          reason: event.reason,
          mode: event.mode,
          timestamp: event.timestamp,
        })
      }
    }
    history.push(...this.events)
    history.sort((a, b) => b.timestamp - a.timestamp)
    return history.slice(0, limit)
  }
}
