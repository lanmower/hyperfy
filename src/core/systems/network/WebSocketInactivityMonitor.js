import { TimeoutConfig } from '../../config/TimeoutConfig.js'

export class WebSocketInactivityMonitor {
  constructor(logger) {
    this.logger = logger
    this.lastActivityTime = Date.now()
    this.inactivityTimer = null
  }

  updateActivity() {
    this.lastActivityTime = Date.now()
  }

  start(onTimeout) {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer)
    }

    this.inactivityTimer = setInterval(() => {
      const now = Date.now()
      if (now - this.lastActivityTime > TimeoutConfig.websocket.inactivityTimeout) {
        this.logger.info('Inactivity timeout, reconnecting')
        onTimeout()
      }
    }, TimeoutConfig.websocket.inactivityCheckInterval)
  }

  stop() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer)
      this.inactivityTimer = null
    }
  }

  reset() {
    this.lastActivityTime = Date.now()
  }

  destroy() {
    this.stop()
  }
}
