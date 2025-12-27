import { storage } from '../../storage.js'

export class WebSocketManager {
  constructor(network) {
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

    console.log('WebSocketManager.connect() creating WebSocket:', {
      url,
      isReconnecting: this.isReconnecting,
      attempt: this.reconnectAttempts
    })

    try {
      this.ws = new WebSocket(url)
      this.ws.binaryType = 'arraybuffer'
      this.setupEventHandlers()
    } catch (err) {
      console.error('WebSocket connection error:', err)
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

  setupEventHandlers() {
    this.messageHandler = e => {
      this.reconnectAttempts = 0
      this.isReconnecting = false
      console.log('WebSocket message received, packet size:', e.data.byteLength)
      this.network.onPacket(e)
    }

    this.openHandler = () => {
      console.log('WebSocket opened, marking as connected')
      this.network.protocol.isConnected = true

      if (this.isReconnecting) {
        console.log('Reconnected successfully, requesting full snapshot')
        this.network.onReconnect?.()
      }
      this.reconnectAttempts = 0
    }

    this.closeHandler = e => {
      console.log('WebSocket closed:', { code: e.code, wasClean: e.wasClean })
      this.network.protocol.isConnected = false
      this.network.onClose?.(e.code)

      if (!this.isReconnecting && e.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.errorHandler = e => {
      console.error('WebSocket error:', e)
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
        console.error('Max reconnection attempts reached, reloading page')
        window.location.reload()
      }
      return
    }

    this.isReconnecting = true
    this.reconnectAttempts++

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
    console.log('Scheduling reconnection attempt', {
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
      console.warn('WebSocket not initialized, dropping packet')
      return false
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(packet)
      return true
    } else if (this.ws.readyState === WebSocket.CONNECTING) {
      console.warn('WebSocket still connecting, packet queued')
      return false
    } else {
      console.warn('WebSocket not connected (state:', this.ws.readyState, '), attempting reconnect')
      if (!this.isReconnecting) {
        this.scheduleReconnect()
      }
      return false
    }
  }

  destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

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
  }
}
