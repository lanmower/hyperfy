import { ErrorLevels, ErrorSources } from '../../schemas/ErrorEvent.schema.js'

export class ErrorForwarder {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
  }

  forwardErrorEvent(event, isDuplicate) {
    const errorMonitor = this.errorMonitor
    const errorEntry = {
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      type: event.category,
      side: event.source === ErrorSources.SDK ? 'client' : event.source,
      args: { message: event.message, context: event.context },
      stack: event.stack,
      context: event.context,
      networkId: errorMonitor.network?.id,
      playerId: errorMonitor.entities?.player?.data?.id,
      level: event.level,
      count: event.count
    }

    const errors = errorMonitor.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > errorMonitor.maxErrors) updated.shift()
    errorMonitor.state.set('errors', updated)

    errorMonitor.events.emit('errorCaptured', errorEntry)

    for (const listener of errorMonitor.listeners) {
      try {
        listener('error', errorEntry)
      } catch (err) {
        console.error('Error in listener:', err)
      }
    }

    if (event.level === ErrorLevels.ERROR && !isDuplicate) {
      if (errorMonitor.isClient && errorMonitor.network) {
        this.sendErrorToServer(errorEntry)
      }

      if (errorMonitor.enableRealTimeStreaming && errorMonitor.mcpEndpoint) {
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
    const errorMonitor = this.errorMonitor
    errorMonitor.events.emit('criticalError', errorEntry)

    if (errorMonitor.isClient && errorMonitor.network) {
      errorMonitor.network.send('errorReport', {
        critical: true,
        error: errorEntry
      })
    }
  }

  streamToMCP(errorEntry) {
    // Placeholder for MCP streaming implementation
  }
}
