import { storage } from '../../storage.js'
import { TimeoutConfig } from '../../config/TimeoutConfig.js'
import { BaseManager } from '../../patterns/index.js'

export class WebSocketManager extends BaseManager {
  constructor(network) {
    super(null, 'WebSocketManager')
    this.network = network
    this.ws = null
    this.messageHandler = null
    this.closeHandler = null
    this.openHandler = null
    this.errorHandler = null
    this.wsUrl = null
    this.name = null
    this.avatar = null
    this.isReconnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 1000
    this.reconnectTimeout = null
    this.invalidMessageCount = 0
    this.invalidMessageWindow = Date.now()
    this.lastActivityTime = Date.now()
    this.messageQueue = []
    this.inactivityTimer = null
    this.requestTimeouts = new Map()
  }

  init(wsUrl, name, avatar) {
    this.wsUrl = wsUrl
    this.name = name
    this.avatar = avatar
    this.connect()
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    if (this.ws) {
      this.removeEventListeners()
    }

    const authToken = storage.get('authToken')
    let url = `${this.wsUrl}?authToken=${authToken}`
    if (this.name) url += `&name=${encodeURIComponent(this.name)}`
    if (this.avatar) url += `&avatar=${encodeURIComponent(this.avatar)}`

    this.logger.info('Creating WebSocket', {
      url,
      isReconnecting: this.isReconnecting,
      attempt: this.reconnectAttempts
    })

    try {
      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'
      this.setupEventHandlers()
    } catch (err) {
      this.logger.error('Connection failed', err)
      this.scheduleReconnect()
    }
  }

  removeEventListeners() {
    if (!this.ws) return
    if (this.messageHandler) this.ws.removeEventListener('message', this.messageHandler)
    if (this.openHandler) this.ws.removeEventListener('open', this.openHandler)
    if (this.closeHandler) this.ws.removeEventListener('close', this.closeHandler)
    if (this.errorHandler) this.ws.removeEventListener('error', this.errorHandler)
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

  setupInactivityMonitor() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer)
    }

    this.inactivityTimer = setInterval(() => {
      const now = Date.now()
      if (now - this.lastActivityTime > TimeoutConfig.websocket.inactivityTimeout) {
        this.logger.info('Inactivity timeout, reconnecting')
        this.scheduleReconnect()
      }
    }, TimeoutConfig.websocket.inactivityCheckInterval)
  }

  setupEventHandlers() {
    this.messageHandler = e => {
      this.lastActivityTime = Date.now()
      // Only reset reconnect flag in openHandler, not here, to prevent race conditions
      // Setting isReconnecting = false here while reconnect is in progress corrupts state

      const validation = this.validateMessage(e.data)
      if (!validation.valid) {
        this.logger.error('[SECURITY] Message validation failed', {
          error: validation.error,
          size: e.data?.byteLength || 0,
          type: typeof e.data,
          preview: e.data instanceof ArrayBuffer ? new Uint8Array(e.data.slice(0, 100)) : null
        })

        if (this.trackInvalidMessage()) {
          this.logger.error('[SECURITY] Too many invalid messages, disconnecting')
          this.ws?.close(1008, 'Invalid message threshold exceeded')
          return
        }

        return
      }

      this.logger.info('Message received', { size: e.data.byteLength })
      this.network.onPacket(e)
    }

    this.openHandler = () => {
      this.logger.info('WebSocket opened')
      this.network.protocol.isConnected = true
      this.lastActivityTime = Date.now()
      this.setupInactivityMonitor()

      const wasReconnecting = this.isReconnecting
      // Clear reconnecting flag FIRST to ensure atomic state transition
      this.isReconnecting = false
      this.reconnectAttempts = 0

      if (wasReconnecting) {
        this.logger.info('Reconnected successfully, clearing stale state and requesting full snapshot')
        // Clear stale messages from queue during disconnection to prevent state corruption
        const staleCount = this.messageQueue.length
        this.messageQueue = []
        if (staleCount > 0) {
          this.logger.warn('Cleared stale messages from queue', { count: staleCount })
        }
        // Clear pending request timeouts that were scheduled during disconnection
        this.requestTimeouts.forEach(timer => clearTimeout(timer))
        this.requestTimeouts.clear()
        this.network.onReconnect?.()
      } else {
        // On initial connection, flush any queued messages
        this.flushMessageQueue()
      }
    }

    this.closeHandler = e => {
      this.logger.info('WebSocket closed', { code: e.code, wasClean: e.wasClean })
      this.network.protocol.isConnected = false
      this.network.onClose?.(e.code)

      if (!this.isReconnecting && e.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.errorHandler = e => {
      this.logger.error('WebSocket error', e)
      this.network.protocol.isConnected = false
      if (!this.isReconnecting) {
        this.scheduleReconnect()
      }
    }

    if (this.ws) {
      this.ws.addEventListener('message', this.messageHandler)
      this.ws.addEventListener('open', this.openHandler)
      this.ws.addEventListener('close', this.closeHandler)
      this.ws.addEventListener('error', this.errorHandler)
    }
  }

  scheduleReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnection attempts reached, reloading page')
        window.location.reload()
      }
      return
    }

    this.isReconnecting = true
    this.reconnectAttempts++

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), TimeoutConfig.websocket.maxReconnectBackoff)
    this.logger.info('Scheduling reconnection attempt', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.maxReconnectAttempts
    })

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(packet) {
    if (!this.ws) {
      this.logger.warn('WebSocket not initialized, dropping packet')
      return false
    }

    if (this.messageQueue.length >= TimeoutConfig.websocket.messageQueueMax) {
      this.logger.error('[SECURITY] Message queue backpressure, dropping packet')
      return false
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(packet)
      this.lastActivityTime = Date.now()
      return true
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      this.logger.warn('WebSocket still connecting, packet queued')
      this.messageQueue.push(packet)
      return false
    } else {
      this.logger.warn('WebSocket not connected, attempting reconnect', { state: this.ws.readyState })
      if (!this.isReconnecting) {
        this.scheduleReconnect()
      }
      return false
    }
  }

  flushMessageQueue() {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    while (this.messageQueue.length > 0) {
      const packet = this.messageQueue.shift()
      this.ws.send(packet)
    }
  }

  async destroyInternal() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer)
      this.inactivityTimer = null
    }

    this.requestTimeouts.forEach(timer => clearTimeout(timer))
    this.requestTimeouts.clear()

    if (this.ws) {
      if (this.messageHandler) this.ws.removeEventListener('message', this.messageHandler)
      if (this.openHandler) this.ws.removeEventListener('open', this.openHandler)
      if (this.closeHandler) this.ws.removeEventListener('close', this.closeHandler)
      if (this.errorHandler) this.ws.removeEventListener('error', this.errorHandler)

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnecting')
      }
      this.ws = null
    }

    this.messageHandler = null
    this.openHandler = null
    this.closeHandler = null
    this.errorHandler = null
    this.isReconnecting = false
    this.reconnectAttempts = 0
    this.messageQueue = []
  }
}
