import { ErrorLevels } from '../../../schemas/ErrorEvent.schema.js'

export class ScriptErrorHandler {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
    this.scriptErrors = new Map()
  }

  canHandle(event, isDuplicate) {
    return (
      event.category === 'app.script.runtime' ||
      event.category === 'app.script.compile'
    ) && event.level === ErrorLevels.ERROR
  }

  handle(event, isDuplicate) {
    const appId = event.context?.app
    if (!appId) return

    if (!this.scriptErrors.has(appId)) {
      this.scriptErrors.set(appId, [])
    }

    const errors = this.scriptErrors.get(appId)
    errors.push({
      message: event.message,
      timestamp: event.timestamp,
      category: event.category
    })

    if (errors.length > 10) {
      errors.shift()
    }

    this.errorMonitor.events.emit('scriptError', {
      appId,
      error: event,
      totalErrors: errors.length
    })
  }

  getScriptErrors(appId) {
    return this.scriptErrors.get(appId) || []
  }

  clearScriptErrors(appId) {
    this.scriptErrors.delete(appId)
  }
}
