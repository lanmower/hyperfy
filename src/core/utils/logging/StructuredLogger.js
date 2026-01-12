// Core logger orchestrator with context and handler management.
import { LogLevels, LogLevelNames, getLevelValue, shouldLog } from './LogLevels.js'
import { buildLogStructure } from './StructuredLoggerFormatters.js'
import { defaultConsoleHandler } from './StructuredLoggerTransports.js'

export class StructuredLogger {
  constructor(category = 'App', options = {}) {
    this.category = category
    this.minLevel = getLevelValue(options.minLevel || 'INFO')
    this.maxContextDepth = options.maxContextDepth ?? 3
    this.includeTimestamp = options.includeTimestamp ?? true
    this.includeCategory = options.includeCategory ?? true
    this.handlers = options.handlers || [defaultConsoleHandler]
    this.contextStack = []
    this.metadata = {}
    this.sinks = []
  }

  setMinLevel(levelName) {
    this.minLevel = getLevelValue(levelName)
    return this
  }

  pushContext(key, value) {
    this.contextStack.push({ key, value })
    if (this.contextStack.length > 50) {
      this.contextStack.shift()
    }
    return this
  }

  popContext(key) {
    const index = this.contextStack.findIndex(c => c.key === key)
    if (index >= 0) {
      this.contextStack.splice(index, 1)
    }
    return this
  }

  setMetadata(key, value) {
    this.metadata[key] = value
    return this
  }

  getContext() {
    const context = {}
    for (const { key, value } of this.contextStack) {
      context[key] = value
    }
    return { ...context, ...this.metadata }
  }

  formatLog(level, message, context = {}) {
    const fullContext = { ...this.getContext(), ...context }
    return buildLogStructure(level, message, this.category, fullContext, this.metadata, this.includeTimestamp)
  }

  log(level, message, context = {}) {
    if (!shouldLog(this.minLevel, level)) {
      return this
    }

    const logEntry = this.formatLog(level, message, context)

    for (const handler of this.handlers) {
      try {
        handler(logEntry)
      } catch (err) {
        console.error('Log handler error:', err.message)
      }
    }

    for (const sink of this.sinks) {
      try {
        sink.write(logEntry)
      } catch (err) {
        console.error('Sink error:', err.message)
      }
    }

    return this
  }

  trace(message, context = {}) {
    return this.log(LogLevels.TRACE, message, context)
  }

  debug(message, context = {}) {
    return this.log(LogLevels.DEBUG, message, context)
  }

  info(message, context = {}) {
    return this.log(LogLevels.INFO, message, context)
  }

  warn(message, context = {}) {
    return this.log(LogLevels.WARN, message, context)
  }

  error(message, context = {}) {
    if (context instanceof Error) {
      context = {
        error: context.message,
        stack: context.stack,
        name: context.name
      }
    }
    return this.log(LogLevels.ERROR, message, context)
  }

  fatal(message, context = {}) {
    return this.log(LogLevels.FATAL, message, context)
  }

  time(label) {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.info(`${label} completed`, { duration: `${duration}ms` })
      return duration
    }
  }

  addHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function')
    }
    this.handlers.push(handler)
    return this
  }

  removeHandler(handler) {
    const index = this.handlers.indexOf(handler)
    if (index >= 0) {
      this.handlers.splice(index, 1)
    }
    return this
  }

  clearHandlers() {
    this.handlers = []
    return this
  }

  addSink(sink) {
    if (!sink || typeof sink.write !== 'function') {
      throw new Error('Sink must have a write() method')
    }
    this.sinks.push(sink)
    return this
  }

  removeSink(sink) {
    const index = this.sinks.indexOf(sink)
    if (index >= 0) {
      this.sinks.splice(index, 1)
    }
    return this
  }

  clearSinks() {
    this.sinks = []
    return this
  }

  createChild(childCategory) {
    const child = new StructuredLogger(childCategory, {
      minLevel: LogLevelNames[this.minLevel],
      maxContextDepth: this.maxContextDepth,
      includeTimestamp: this.includeTimestamp,
      includeCategory: this.includeCategory,
      handlers: this.handlers
    })

    child.metadata = { ...this.metadata }
    child.sinks = [...this.sinks]
    for (const { key, value } of this.contextStack) {
      child.pushContext(key, value)
    }

    return child
  }

  stats() {
    return {
      category: this.category,
      minLevel: LogLevelNames[this.minLevel],
      handlerCount: this.handlers.length,
      contextStackSize: this.contextStack.length,
      metadataSize: Object.keys(this.metadata).length
    }
  }
}

export { defaultConsoleHandler, createLogBuffer, createFileHandler } from './StructuredLoggerTransports.js'
