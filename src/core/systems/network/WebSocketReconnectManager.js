import { TimeoutConfig } from '../../config/TimeoutConfig.js'

const RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_ATTEMPTS = 10
const WS_NORMAL_CLOSE = 1000

export class WebSocketReconnectManager {
  constructor(logger) {
    this.logger = logger
    this.isReconnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS
    this.baseDelay = RECONNECT_DELAY_MS
    this.reconnectTimeout = null
  }

  startReconnectTimer(delayMs, callback) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    this.reconnectTimeout = setTimeout(callback, delayMs)
  }

  stopReconnectTimer() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  scheduleReconnect(connectCallback) {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnection attempts reached, reloading page')
        window.location.reload()
      }
      return
    }

    this.isReconnecting = true
    this.reconnectAttempts++

    const delay = this.calculateBackoffDelay(this.reconnectAttempts)
    this.logger.info('Scheduling reconnection attempt', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.maxReconnectAttempts
    })

    this.startReconnectTimer(delay, connectCallback)
  }

  calculateBackoffDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1)
    return Math.min(exponentialDelay, TimeoutConfig.websocket.maxReconnectBackoff)
  }

  resetReconnectState() {
    this.isReconnecting = false
    this.reconnectAttempts = 0
    this.stopReconnectTimer()
  }

  canReconnect() {
    return !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts
  }

  destroy() {
    this.stopReconnectTimer()
    this.isReconnecting = false
    this.reconnectAttempts = 0
  }
}
