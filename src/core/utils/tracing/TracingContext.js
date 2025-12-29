const contextMap = new WeakMap()
const spanStack = new Map()

export class TracingContext {
  constructor(traceId) {
    this.traceId = traceId || this.generateTraceId()
    this.spans = []
    this.startTime = performance.now()
  }

  generateTraceId() {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  pushSpan(span) {
    this.spans.push(span)
    spanStack.set(this.traceId, span)
  }

  popSpan() {
    if (this.spans.length > 0) {
      const span = this.spans[this.spans.length - 1]
      spanStack.delete(this.traceId)
      return span
    }
    return null
  }

  getCurrentSpan() {
    return spanStack.get(this.traceId) || null
  }

  getSpanPath() {
    return this.spans.map(s => s.name).join(' > ')
  }

  getDuration() {
    return performance.now() - this.startTime
  }

  toJSON() {
    return {
      traceId: this.traceId,
      spanCount: this.spans.length,
      totalDuration: this.getDuration(),
      path: this.getSpanPath(),
      spans: this.spans.map(s => s.toJSON()),
    }
  }

  static create(traceId) {
    return new TracingContext(traceId)
  }

  static getCurrent() {
    return spanStack.values().next().value?.traceId || null
  }
}
