const activeSpans = new Map()

export class TraceSpan {
  constructor(name, traceId, parentSpanId = null) {
    this.name = name
    this.traceId = traceId
    this.spanId = this.generateSpanId()
    this.parentSpanId = parentSpanId
    this.startTime = performance.now()
    this.endTime = null
    this.duration = null
    this.attributes = new Map()
    this.events = []
    this.status = 'pending'
    this.error = null

    activeSpans.set(this.spanId, this)
  }

  generateSpanId() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  setAttribute(key, value) {
    this.attributes.set(key, value)
    return this
  }

  addEvent(name, attributes = {}) {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    })
    return this
  }

  end(status = 'ok', error = null) {
    this.endTime = performance.now()
    this.duration = this.endTime - this.startTime
    this.status = status
    this.error = error

    activeSpans.delete(this.spanId)
    return this
  }

  toJSON() {
    return {
      name: this.name,
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      status: this.status,
      error: this.error?.message || null,
      attributes: Object.fromEntries(this.attributes),
      events: this.events,
    }
  }

  static getActiveSpans() {
    return Array.from(activeSpans.values()).map(span => span.toJSON())
  }
}
