export class ClientErrorReporter {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
    this.network = null
    this.enabled = true
    this.buffer = []
    this.maxBufferSize = 50
    this.flushInterval = 5000
    this.setupFlushInterval()
  }

  init(network) {
    this.network = network
  }

  reportError(errorData) {
    if (!this.enabled || !this.network) {
      this.buffer.push(errorData)
      return
    }

    try {
      const payload = {
        error: {
          type: errorData.type || 'Error',
          message: Array.isArray(errorData.args) ? errorData.args.join(' ') : String(errorData.args || ''),
          stack: errorData.stack || '',
          level: 'error'
        },
        clientId: this.network.id,
        timestamp: Date.now(),
        context: this.enrichContext()
      }

      this.network.send('clientError', payload)
    } catch (err) {
      this.buffer.push(errorData)
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift()
      }
    }
  }

  enrichContext() {
    const context = {
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: Date.now(),
      diagnostics: this.gatherDiagnostics()
    }
    return context
  }

  gatherDiagnostics() {
    const diagnostics = {
      memory: null,
      performance: null,
      playerState: null
    }

    if (typeof performance !== 'undefined' && performance.memory) {
      diagnostics.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
    }

    try {
      const world = this.errorMonitor.world
      if (world && world.player) {
        diagnostics.playerState = {
          id: world.player.data?.id,
          position: world.player.base?.position,
          health: world.player.data?.health
        }
      }
    } catch (err) {
      // Silently ignore errors while gathering diagnostics
    }

    return diagnostics
  }

  setupFlushInterval() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.flushBuffer(), this.flushInterval)
    }
  }

  flushBuffer() {
    if (!this.network || this.buffer.length === 0) return

    while (this.buffer.length > 0) {
      const errorData = this.buffer.shift()
      try {
        this.network.send('clientError', {
          error: errorData,
          clientId: this.network.id,
          timestamp: Date.now(),
          context: this.enrichContext(),
          buffered: true
        })
      } catch (err) {
        this.buffer.unshift(errorData)
        break
      }
    }
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }

  getBufferStats() {
    return {
      bufferedErrors: this.buffer.length,
      maxBuffer: this.maxBufferSize
    }
  }
}
