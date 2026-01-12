import { TimeoutConfig } from '../../config/TimeoutConfig.js'

export class WebSocketValidator {
  constructor(logger) {
    this.logger = logger
    this.invalidMessageCount = 0
    this.invalidMessageWindow = Date.now()
  }

  validateMessage(data) {
    if (!(data instanceof ArrayBuffer)) {
      this.logger.error('[SECURITY] Invalid message type, expected ArrayBuffer:', typeof data)
      return { valid: false, error: 'Invalid message type' }
    }

    if (data.byteLength > TimeoutConfig.websocket.maxMessageSize) {
      this.logger.error('[SECURITY] Message size exceeds limit:', { actual: data.byteLength, max: TimeoutConfig.websocket.maxMessageSize })
      return { valid: false, error: 'Message too large' }
    }

    if (data.byteLength === 0) {
      this.logger.error('[SECURITY] Empty message received')
      return { valid: false, error: 'Empty message' }
    }

    return { valid: true }
  }

  trackInvalidMessage() {
    const now = Date.now()
    if (now - this.invalidMessageWindow > TimeoutConfig.websocket.invalidMessageWindow) {
      this.invalidMessageCount = 0
      this.invalidMessageWindow = now
    }

    this.invalidMessageCount++
    if (this.invalidMessageCount > TimeoutConfig.websocket.invalidMessageThreshold) {
      this.logger.error('[SECURITY] Invalid message threshold exceeded', { count: this.invalidMessageCount, window: TimeoutConfig.websocket.invalidMessageWindow })
      return true
    }

    return false
  }

  reset() {
    this.invalidMessageCount = 0
    this.invalidMessageWindow = Date.now()
  }
}
