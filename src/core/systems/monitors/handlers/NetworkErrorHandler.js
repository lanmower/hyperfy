import { ErrorLevels } from '../../../schemas/ErrorEvent.schema.js'

export class NetworkErrorHandler {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
  }

  canHandle(event, isDuplicate) {
    return event.category === 'network' && event.level === ErrorLevels.ERROR
  }

  handle(event, isDuplicate) {
    if (isDuplicate) return

    if (this.errorMonitor.network?.isConnected === false) {
      this.errorMonitor.events.emit('networkError', {
        message: event.message,
        timestamp: event.timestamp,
        reconnecting: true
      })
    }
  }
}
