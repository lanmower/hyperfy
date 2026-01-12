import { TraceSpan } from './TraceSpan.js'
import { TracingContext } from './TracingContext.js'

const contexts = new Map()
const recordedTraces = []
const maxRecordedTraces = 1000

export class TracingManager {
  constructor() {
    this.enabled = true
    this.samplingRate = 1.0
    this.recordTraces = false
  }

  shouldTrace() {
    if (!this.enabled) return false
    return Math.random() <= this.samplingRate
  }

  createTrace(traceId) {
    const context = TracingContext.create(traceId)
    contexts.set(context.traceId, context)
    return context
  }

  startSpan(name, traceId = null, parentSpanId = null) {
    if (!this.shouldTrace()) return null

    const actualTraceId = traceId || TracingContext.getCurrent() || TraceSpan.prototype.generateSpanId?.call({})
    const span = new TraceSpan(name, actualTraceId, parentSpanId)

    const context = contexts.get(actualTraceId)
    if (context) {
      context.pushSpan(span)
    }

    return span
  }

  endSpan(span, status = 'ok', error = null) {
    if (!span) return

    span.end(status, error)

    const context = contexts.get(span.traceId)
    if (context) {
      context.popSpan()
      if (context.spans.length === 0 && this.recordTraces) {
        recordedTraces.push(context.toJSON())
        if (recordedTraces.length > maxRecordedTraces) {
          recordedTraces.shift()
        }
        contexts.delete(span.traceId)
      }
    }
  }

  async traceAsync(name, fn, traceId = null) {
    const span = this.startSpan(name, traceId)
    try {
      const result = await fn(span)
      this.endSpan(span, 'ok')
      return result
    } catch (err) {
      this.endSpan(span, 'error', err)
      throw err
    }
  }

  traceSync(name, fn, traceId = null) {
    const span = this.startSpan(name, traceId)
    try {
      const result = fn(span)
      this.endSpan(span, 'ok')
      return result
    } catch (err) {
      this.endSpan(span, 'error', err)
      throw err
    }
  }

  getRecordedTraces() {
    return [...recordedTraces]
  }

  getActiveContexts() {
    return Array.from(contexts.values()).map(c => c.toJSON())
  }

  clearRecordedTraces() {
    recordedTraces.length = 0
  }

  setSamplingRate(rate) {
    this.samplingRate = Math.max(0, Math.min(1, rate))
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  setRecordTraces(record) {
    this.recordTraces = record
  }

  getStats() {
    return {
      enabled: this.enabled,
      samplingRate: this.samplingRate,
      recordTraces: this.recordTraces,
      activeContexts: contexts.size,
      recordedTraces: recordedTraces.length,
      activeSpans: TraceSpan.getActiveSpans().length,
    }
  }
}

export const tracer = new TracingManager()
