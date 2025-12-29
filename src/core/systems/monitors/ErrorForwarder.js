import { ErrorLevels, ErrorSources } from '../../schemas/ErrorEvent.schema.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ErrorForwarder')

export class ErrorForwarder {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
    this.maxErrors = errorMonitor.maxErrors
  }

  canHandle(event, isDuplicate) {
    return true
  }

  handle(event, isDuplicate) {
    this.forwardErrorEvent(event, isDuplicate)
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
      networkId: this.errorMonitor.network?.id,
      playerId: this.errorMonitor.entities?.player?.data?.id,
      level: event.level,
      count: event.count
    }

    const errors = this.errorMonitor.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > this.maxErrors) updated.shift()
    this.errorMonitor.state.set('errors', updated)

    this.errorMonitor.events.emit('errorCaptured', errorEntry)

    for (const listener of this.errorMonitor.listeners) {
      try {
        listener('error', errorEntry)
      } catch (err) {
        logger.error('Error in error listener callback', { error: err.message })
      }
    }

    if (event.level === ErrorLevels.ERROR && !isDuplicate) {
      if (this.errorMonitor.isClient && this.errorMonitor.network) {
        this.sendErrorToServer(errorEntry)
      }

      if (this.errorMonitor.enableRealTimeStreaming && this.errorMonitor.mcpEndpoint) {
        this.streamToMCP(errorEntry)
      }
    }
  }

  sendErrorToServer(errorEntry) {
    try {
      this.errorMonitor.network.send('errorReport', {
        error: errorEntry,
        realTime: true
      })
    } catch (err) {
    }
  }

  handleCriticalError(errorEntry) {
    this.errorMonitor.events.emit('criticalError', errorEntry)

    if (this.errorMonitor.isClient && this.errorMonitor.network) {
      this.errorMonitor.network.send('errorReport', {
        critical: true,
        error: errorEntry
      })
    }
  }

  streamToMCP(errorEntry) {
    if (typeof fetch !== 'undefined') {
      fetch(this.errorMonitor.mcpEndpoint, {
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
}
