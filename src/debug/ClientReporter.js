import { MSG } from '../protocol/MessageTypes.js'

export class ClientReporter {
  constructor(sendFn, config = {}) {
    this._send = sendFn
    this.maxRate = config.maxRate || 10
    this.perfInterval = config.perfInterval || 1000
    this._logCount = 0
    this._logResetTime = Date.now()
    this._origConsole = {}
    this._perfTimer = null
    this._frames = 0
    this._lastFrameTime = 0
    this._hooked = false
  }

  start() {
    this._hookConsole()
    this._hookErrors()
    this._startPerfReporting()
    this._hooked = true
  }

  _hookConsole() {
    const methods = ['log', 'error', 'warn']
    for (const method of methods) {
      this._origConsole[method] = console[method]
      console[method] = (...args) => {
        this._origConsole[method].apply(console, args)
        this._reportLog(method, args)
      }
    }
  }

  _hookErrors() {
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('error', (event) => {
        this._send(MSG.CLIENT_ERROR, {
          message: event.message || String(event),
          stack: event.error?.stack || '',
          ts: Date.now()
        })
      })
      globalThis.addEventListener('unhandledrejection', (event) => {
        this._send(MSG.CLIENT_ERROR, {
          message: String(event.reason),
          stack: event.reason?.stack || '',
          ts: Date.now()
        })
      })
    }
    if (typeof process !== 'undefined' && process.on) {
      process.on('uncaughtException', (err) => {
        this._send(MSG.CLIENT_ERROR, {
          message: err.message,
          stack: err.stack || '',
          ts: Date.now()
        })
      })
      process.on('unhandledRejection', (reason) => {
        this._send(MSG.CLIENT_ERROR, {
          message: String(reason),
          stack: reason?.stack || '',
          ts: Date.now()
        })
      })
    }
  }

  _reportLog(level, args) {
    const now = Date.now()
    if (now - this._logResetTime >= 1000) {
      this._logCount = 0
      this._logResetTime = now
    }
    if (this._logCount >= this.maxRate) return
    this._logCount++
    const typeMap = { log: MSG.CLIENT_LOG, error: MSG.CLIENT_ERROR, warn: MSG.CLIENT_WARN }
    const serialized = args.map(a => {
      if (a instanceof Error) return { message: a.message, stack: a.stack }
      try { return JSON.parse(JSON.stringify(a)) } catch { return String(a) }
    })
    if (level === 'error') {
      this._send(MSG.CLIENT_ERROR, {
        message: serialized.map(String).join(' '),
        args: serialized,
        ts: now
      })
    } else {
      this._send(typeMap[level] || MSG.CLIENT_LOG, {
        args: serialized,
        ts: now
      })
    }
  }

  _startPerfReporting() {
    this._lastFrameTime = Date.now()
    this._perfTimer = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - this._lastFrameTime) / 1000
      const fps = elapsed > 0 ? this._frames / elapsed : 0
      this._send(MSG.CLIENT_PERF, {
        fps: Math.round(fps),
        memory: this._getMemory(),
        ts: now
      })
      this._frames = 0
      this._lastFrameTime = now
    }, this.perfInterval)
  }

  recordFrame() {
    this._frames++
  }

  _getMemory() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      }
    }
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const m = process.memoryUsage()
      return { used: m.heapUsed, total: m.heapTotal }
    }
    return { used: 0, total: 0 }
  }

  reportState(state) {
    this._send(MSG.CLIENT_STATE, state)
  }

  stop() {
    if (this._perfTimer) clearInterval(this._perfTimer)
    for (const [method, orig] of Object.entries(this._origConsole)) {
      console[method] = orig
    }
    this._origConsole = {}
    this._hooked = false
  }
}
