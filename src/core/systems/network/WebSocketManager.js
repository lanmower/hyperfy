import { storage } from '../../storage.js'
import { TimeoutConfig } from '../../config/TimeoutConfig.js'
import { BaseManager } from '../../patterns/index.js'
import { WebSocketReconnectManager } from './WebSocketReconnectManager.js'
import { WebSocketMessageQueue } from './WebSocketMessageQueue.js'
import { WebSocketValidator } from './WebSocketValidator.js'
import { WebSocketInactivityMonitor } from './WebSocketInactivityMonitor.js'
import { WebSocketEventHandlers } from './WebSocketEventHandlers.js'

const WS_NORMAL_CLOSE = 1000
const WS_POLICY_VIOLATION = 1008

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
    this.reconnectManager = new WebSocketReconnectManager(this.logger)
    this.messageQueue = new WebSocketMessageQueue(this.logger)
    this.validator = new WebSocketValidator(this.logger)
    this.inactivityMonitor = new WebSocketInactivityMonitor(this.logger)
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
      isReconnecting: this.reconnectManager.isReconnecting,
      attempt: this.reconnectManager.reconnectAttempts
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

  setupInactivityMonitor() {
    this.inactivityMonitor.start(() => {
      this.scheduleReconnect()
    })
  }

  setupEventHandlers() {
    const handlers = new WebSocketEventHandlers(this)
    this.messageHandler = handlers.createMessageHandler()
    this.openHandler = handlers.createOpenHandler()
    this.closeHandler = handlers.createCloseHandler()
    this.errorHandler = handlers.createErrorHandler()

    if (this.ws) {
      this.ws.addEventListener('message', this.messageHandler)
      this.ws.addEventListener('open', this.openHandler)
      this.ws.addEventListener('close', this.closeHandler)
      this.ws.addEventListener('error', this.errorHandler)
    }
  }

  scheduleReconnect() {
    this.reconnectManager.scheduleReconnect(() => {
      this.connect()
    })
  }

  send(packet) {
    if (!this.ws) {
      this.logger.warn('WebSocket not initialized, dropping packet')
      return false
    }

    if (this.messageQueue.getPendingCount() >= TimeoutConfig.websocket.messageQueueMax) {
      this.logger.error('[SECURITY] Message queue backpressure, dropping packet')
      return false
    }

    const sequence = this.messageQueue.getNextSequence()

    if (this.ws.readyState === WebSocket.OPEN) {
      const sequencedPacket = this.messageQueue.addSequenceToPacket(packet, sequence)
      this.ws.send(sequencedPacket, { binary: true })
      this.inactivityMonitor.updateActivity()
      return true
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      this.logger.warn('WebSocket still connecting, packet queued')
      this.messageQueue.enqueue(packet)
      return false
    } else {
      this.logger.warn('WebSocket not connected, attempting reconnect', { state: this.ws.readyState })
      if (!this.reconnectManager.isReconnecting) {
        this.scheduleReconnect()
      }
      return false
    }
  }

  flushMessageQueue() {
    this.messageQueue.flush(this.ws)
  }

  simulateLag(amount) {
    this._lagSimulation = Math.max(0, amount)
  }

  disconnect() {
    return this.destroyInternal()
  }

  async destroyInternal() {
    this.reconnectManager.destroy()
    this.inactivityMonitor.destroy()
    this.requestTimeouts.forEach(timer => clearTimeout(timer))
    this.requestTimeouts.clear()

    if (this.ws) {
      if (this.messageHandler) this.ws.removeEventListener('message', this.messageHandler)
      if (this.openHandler) this.ws.removeEventListener('open', this.openHandler)
      if (this.closeHandler) this.ws.removeEventListener('close', this.closeHandler)
      if (this.errorHandler) this.ws.removeEventListener('error', this.errorHandler)

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(WS_NORMAL_CLOSE, 'Client disconnecting')
      }
      this.ws = null
    }

    this.messageHandler = null
    this.openHandler = null
    this.closeHandler = null
    this.errorHandler = null
    this.messageQueue.reset()
  }
}
