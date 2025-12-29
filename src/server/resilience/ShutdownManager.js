export class ShutdownManager {
  constructor(logger, options = {}) {
    this.logger = logger
    this.isShuttingDown = false
    this.shutdownStartTime = null
    this.gracefulTimeout = parseInt(options.gracefulTimeout || process.env.SHUTDOWN_TIMEOUT || 30000)
    this.forceTimeout = parseInt(options.forceTimeout || 5000)
    this.activeConnections = new Set()
    this.activeWebSockets = new Set()
    this.shutdownHandlers = []
    this.metrics = {
      connectionsAtStart: 0,
      connectionsClosed: 0,
      websocketsClosed: 0,
      errors: 0,
      duration: 0,
    }
  }

  registerConnection(conn) {
    if (!this.isShuttingDown) {
      this.activeConnections.add(conn)
    }
  }

  unregisterConnection(conn) {
    this.activeConnections.delete(conn)
  }

  registerWebSocket(ws) {
    if (!this.isShuttingDown) {
      this.activeWebSockets.add(ws)
    }
  }

  unregisterWebSocket(ws) {
    this.activeWebSockets.delete(ws)
  }

  addShutdownHandler(name, handler, priority = 100) {
    this.shutdownHandlers.push({ name, handler, priority })
    this.shutdownHandlers.sort((a, b) => b.priority - a.priority)
  }

  isAcceptingConnections() {
    return !this.isShuttingDown
  }

  async shutdown(signal = 'MANUAL') {
    if (this.isShuttingDown) {
      this.logger.warn('[SHUTDOWN] Shutdown already in progress')
      return
    }

    this.isShuttingDown = true
    this.shutdownStartTime = Date.now()
    this.metrics.connectionsAtStart = this.activeConnections.size
    this.logger.info('[SHUTDOWN] Graceful shutdown initiated', {
      signal,
      timestamp: new Date().toISOString(),
      activeConnections: this.activeConnections.size,
      activeWebSockets: this.activeWebSockets.size,
      gracefulTimeout: this.gracefulTimeout,
    })

    try {
      await this.executeShutdownSequence()
      this.metrics.duration = Date.now() - this.shutdownStartTime
      this.logger.info('[SHUTDOWN] Shutdown complete', {
        duration: this.metrics.duration,
        metrics: this.metrics,
      })
      return { success: true, code: 0 }
    } catch (err) {
      this.metrics.duration = Date.now() - this.shutdownStartTime
      this.metrics.errors++
      this.logger.error('[SHUTDOWN] Shutdown failed', {
        error: err.message,
        stack: err.stack,
        duration: this.metrics.duration,
        metrics: this.metrics,
      })
      return { success: false, code: 1, error: err }
    }
  }

  async executeShutdownSequence() {
    const gracefulDeadline = Date.now() + this.gracefulTimeout
    const forceDeadline = gracefulDeadline + this.forceTimeout

    this.logger.info('[SHUTDOWN] Step 1: Closing new connections')
    await this.waitForConnections(gracefulDeadline)

    this.logger.info('[SHUTDOWN] Step 2: Closing WebSocket connections')
    await this.closeWebSockets(gracefulDeadline)

    this.logger.info('[SHUTDOWN] Step 3: Running shutdown handlers')
    await this.runShutdownHandlers(gracefulDeadline)

    if (Date.now() > gracefulDeadline) {
      const remaining = forceDeadline - Date.now()
      if (remaining > 0) {
        this.logger.warn('[SHUTDOWN] Graceful timeout exceeded, entering force timeout', {
          remaining,
        })
        await this.sleep(Math.min(remaining, this.forceTimeout))
      }
    }

    this.logger.info('[SHUTDOWN] Shutdown sequence complete')
  }

  async waitForConnections(deadline) {
    const startTime = Date.now()
    const connections = Array.from(this.activeConnections)

    if (connections.length === 0) {
      this.logger.info('[SHUTDOWN] No active connections to close')
      return
    }

    this.logger.info('[SHUTDOWN] Waiting for connections to close', {
      count: connections.length,
    })

    while (this.activeConnections.size > 0 && Date.now() < deadline) {
      await this.sleep(100)
    }

    const duration = Date.now() - startTime
    this.metrics.connectionsClosed = this.metrics.connectionsAtStart - this.activeConnections.size

    if (this.activeConnections.size > 0) {
      this.logger.warn('[SHUTDOWN] Connection timeout, forcing close', {
        remaining: this.activeConnections.size,
        duration,
      })
      for (const conn of this.activeConnections) {
        try {
          if (conn.destroy) conn.destroy()
          else if (conn.close) conn.close()
        } catch (err) {
          this.metrics.errors++
          this.logger.error('[SHUTDOWN] Error closing connection', { error: err.message })
        }
      }
    } else {
      this.logger.info('[SHUTDOWN] All connections closed gracefully', { duration })
    }
  }

  async closeWebSockets(deadline) {
    const startTime = Date.now()
    const websockets = Array.from(this.activeWebSockets)

    if (websockets.length === 0) {
      this.logger.info('[SHUTDOWN] No active WebSocket connections')
      return
    }

    this.logger.info('[SHUTDOWN] Closing WebSocket connections', {
      count: websockets.length,
    })

    for (const ws of websockets) {
      try {
        if (ws.send && ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'serverShutdown',
            message: 'Server is shutting down',
            timestamp: Date.now(),
          }))
        }
      } catch (err) {
        this.logger.error('[SHUTDOWN] Error sending shutdown message', { error: err.message })
      }
    }

    await this.sleep(500)

    for (const ws of websockets) {
      try {
        if (ws.close) {
          ws.close(1001, 'Server shutting down')
        } else if (ws.terminate) {
          ws.terminate()
        }
        this.metrics.websocketsClosed++
      } catch (err) {
        this.metrics.errors++
        this.logger.error('[SHUTDOWN] Error closing WebSocket', { error: err.message })
      }
    }

    while (this.activeWebSockets.size > 0 && Date.now() < deadline) {
      await this.sleep(100)
    }

    const duration = Date.now() - startTime

    if (this.activeWebSockets.size > 0) {
      this.logger.warn('[SHUTDOWN] WebSocket timeout, forcing close', {
        remaining: this.activeWebSockets.size,
        duration,
      })
    } else {
      this.logger.info('[SHUTDOWN] All WebSockets closed', { duration })
    }
  }

  async runShutdownHandlers(deadline) {
    for (const { name, handler, priority } of this.shutdownHandlers) {
      const startTime = Date.now()
      const remaining = deadline - Date.now()

      if (remaining <= 0) {
        this.logger.warn('[SHUTDOWN] Shutdown handler skipped due to timeout', { name })
        continue
      }

      this.logger.info('[SHUTDOWN] Running shutdown handler', { name, priority })

      try {
        const handlerTimeout = Math.min(remaining, 5000)
        await this.withTimeout(handler(), handlerTimeout, name)
        const duration = Date.now() - startTime
        this.logger.info('[SHUTDOWN] Shutdown handler complete', { name, duration })
      } catch (err) {
        this.metrics.errors++
        const duration = Date.now() - startTime
        if (err.timeout) {
          this.logger.warn('[SHUTDOWN] Shutdown handler timeout', { name, duration })
        } else {
          this.logger.error('[SHUTDOWN] Shutdown handler error', {
            name,
            error: err.message,
            duration,
          })
        }
      }
    }
  }

  async withTimeout(promise, timeout, name) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error(`Timeout: ${name}`)
          err.timeout = true
          reject(err)
        }, timeout)
      }),
    ])
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getMetrics() {
    return {
      ...this.metrics,
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
      activeWebSockets: this.activeWebSockets.size,
    }
  }
}
