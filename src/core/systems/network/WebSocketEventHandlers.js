const WS_POLICY_VIOLATION = 1008
const WS_NORMAL_CLOSE = 1000

export class WebSocketEventHandlers {
  constructor(manager) {
    this.manager = manager
  }

  createMessageHandler() {
    return e => {
      this.manager.inactivityMonitor.updateActivity()

      const validation = this.manager.validator.validateMessage(e.data)
      if (!validation.valid) {
        this.manager.logger.error('[SECURITY] Message validation failed', { error: validation.error, size: e.data?.byteLength || 0 })
        if (this.manager.validator.trackInvalidMessage()) {
          this.manager.logger.error('[SECURITY] Too many invalid messages, disconnecting')
          this.manager.ws?.close(WS_POLICY_VIOLATION, 'Invalid message threshold exceeded')
          return
        }
        return
      }

      this.manager.network.onPacket(e)
    }
  }

  createOpenHandler() {
    return () => {
      this.manager.logger.info('WebSocket opened', { wsType: typeof this.manager.ws, wsReadyState: this.manager.ws?.readyState })
      this.manager.network.protocol.isConnected = true
      this.manager.inactivityMonitor.reset()
      this.manager.setupInactivityMonitor()

      const wasReconnecting = this.manager.reconnectManager.isReconnecting
      this.manager.reconnectManager.resetReconnectState()

      if (wasReconnecting) {
        this.manager.logger.info('Reconnected successfully, clearing stale state and requesting full snapshot')
        const staleCount = this.manager.messageQueue.clear()
        if (staleCount > 0) {
          this.manager.logger.warn('Cleared stale messages from queue', { count: staleCount })
        }
        this.manager.requestTimeouts.forEach(timer => clearTimeout(timer))
        this.manager.requestTimeouts.clear()
        this.manager.network.onReconnect?.()
      } else {
        this.manager.flushMessageQueue()
      }
    }
  }

  createCloseHandler() {
    return e => {
      this.manager.logger.info('WebSocket closed', { code: e.code, wasClean: e.wasClean })
      this.manager.network.protocol.isConnected = false
      this.manager.network.onClose?.(e.code)

      if (!this.manager.reconnectManager.isReconnecting && e.code !== WS_NORMAL_CLOSE) {
        this.manager.scheduleReconnect()
      }
    }
  }

  createErrorHandler() {
    return e => {
      this.manager.logger.error('WebSocket error', e)
      this.manager.network.protocol.isConnected = false
      if (!this.manager.reconnectManager.isReconnecting) {
        this.manager.scheduleReconnect()
      }
    }
  }
}
