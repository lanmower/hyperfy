import { ErrorLevels, ErrorSources } from '../../schemas/ErrorEvent.schema.js'
import { errorObserver } from '../../../server/services/ErrorObserver.js'
import { errorFormatter } from '../../../server/utils/ErrorFormatter.js'

export class ErrorReporter {
  constructor(errorMonitor) {
    this.monitor = errorMonitor
  }

  forwardErrorEvent(event, isDuplicate) {
    const errorEntry = {
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      type: event.category,
      side: event.source === ErrorSources.SDK ? 'client' : event.source,
      args: { message: event.message, context: event.context },
      stack: event.stack,
      context: event.context,
      networkId: this.monitor.network?.id,
      playerId: this.monitor.entities?.player?.data?.id,
      level: event.level,
      count: event.count
    }

    const errors = this.monitor.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > this.monitor.maxErrors) updated.shift()
    this.monitor.state.set('errors', updated)

    this.monitor.events.emit('errorCaptured', errorEntry)

    for (const listener of this.monitor.listeners) {
      try {
        listener('error', errorEntry)
      } catch (err) {
        console.error('Error in listener:', err)
      }
    }

    if (event.level === ErrorLevels.ERROR && !isDuplicate) {
      if (this.monitor.isClient && this.monitor.network) {
        this.sendErrorToServer(errorEntry)
      }

      if (this.monitor.enableRealTimeStreaming && this.monitor.mcpEndpoint) {
        this.streamToMCP(errorEntry)
      }
    }
  }

  sendErrorToServer(errorEntry) {
    try {
      this.monitor.network.send('errorReport', {
        error: errorEntry,
        realTime: true
      })
    } catch (err) {
    }
  }

  handleCriticalError(errorEntry) {
    this.monitor.events.emit('criticalError', errorEntry)

    if (this.monitor.isClient && this.monitor.network) {
      this.monitor.network.send('errorReport', {
        critical: true,
        error: errorEntry
      })
    }
  }

  streamToMCP(errorEntry) {
    if (typeof fetch !== 'undefined') {
      fetch(this.monitor.mcpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          data: errorEntry
        })
      }).catch(() => {
      })
    }
  }

  onErrorReport(socket, errorData) {
    if (!this.monitor.isServer) return

    try {
      const { deserializeErrorEvent } = require('../../schemas/ErrorEvent.schema.js')
      const errorEvent = deserializeErrorEvent(errorData.error || errorData)
      errorEvent.source = ErrorSources.CLIENT
      errorEvent.metadata = {
        ...errorEvent.metadata,
        socketId: socket.id,
        realTime: errorData.realTime || false
      }

      this.monitor.errorBus.emit(
        { message: errorEvent.message, stack: errorEvent.stack },
        {
          ...errorEvent.context,
          category: errorEvent.category,
          source: errorEvent.source,
          metadata: errorEvent.metadata
        },
        errorEvent.level
      )

      if (errorEvent.level === ErrorLevels.ERROR || errorData.critical) {
        this.monitor.events.emit('criticalError', errorEvent)
      }
    } catch (err) {
      console.error('Failed to process client error report:', err)
    }
  }

  receiveClientError(errorData) {
    if (!this.monitor.isServer) return

    try {
      const { deserializeErrorEvent } = require('../../schemas/ErrorEvent.schema.js')
      const errorEvent = deserializeErrorEvent(errorData.error || errorData)
      errorEvent.source = ErrorSources.CLIENT
      errorEvent.metadata = {
        ...errorEvent.metadata,
        realTime: errorData.realTime || false
      }

      this.monitor.errorBus.emit(
        { message: errorEvent.message, stack: errorEvent.stack },
        {
          ...errorEvent.context,
          category: errorEvent.category,
          source: errorEvent.source,
          metadata: errorEvent.metadata
        },
        errorEvent.level
      )

      if (this.monitor.isServer && errorEvent.level === ErrorLevels.ERROR) {
        this.reportServerError(errorEvent, errorData)
      }

      if (errorEvent.level === ErrorLevels.ERROR || errorData.critical) {
        this.monitor.events.emit('criticalError', errorEvent)
      }
    } catch (err) {
      console.error('Failed to process client error:', err)
    }
  }

  reportServerError(errorEvent, errorData) {
    const metadata = {
      clientId: errorData.clientId,
      userId: errorData.userId,
      userName: errorData.userName,
      clientIP: errorData.clientIP
    }

    const formatted = errorFormatter.formatForStderr(errorEvent, metadata)
    process.stderr.write(formatted)
  }

  getServerErrorReport() {
    if (!this.monitor.isServer) return null

    const localStats = this.monitor.getStats()
    const observerStats = errorObserver.getErrorStats()

    return {
      local: localStats,
      client: observerStats,
      combined: {
        total: localStats.total + observerStats.total,
        lastMinute: localStats.recent + observerStats.lastMinute,
        critical: localStats.critical + observerStats.critical,
        byType: {
          ...localStats.byType,
          ...observerStats.byCategory
        }
      }
    }
  }

  captureClientError(clientId, error) {
    if (!this.monitor.isServer) return

    errorObserver.recordClientError(clientId, error, {
      timestamp: Date.now(),
      source: 'server-detected'
    })
  }

  checkAlertThresholds() {
    if (!this.monitor.isServer) return

    const stats = errorObserver.getErrorStats()

    if (stats.lastMinute >= 25) {
      const alert = errorFormatter.formatAlert(
        'High error rate detected across all clients',
        'CRITICAL'
      )
      process.stderr.write(alert)
    }

    if (stats.critical > 0) {
      const alert = errorFormatter.formatAlert(
        `${stats.critical} critical errors detected`,
        'CRITICAL'
      )
      process.stderr.write(alert)
    }
  }
}
