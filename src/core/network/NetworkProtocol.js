// Unified network protocol handler - eliminates Client/Server duplication

import { EventBus } from '../utils/EventBus.js'

export class NetworkProtocol {
  constructor(name = 'Network') {
    this.name = name
    this.handlers = new Map()
    this.events = new EventBus()
    this.isConnected = false
    this.isServer = false
    this.isClient = false
    this.retries = 0
    this.maxRetries = 3
  }

  register(packetName, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${packetName} must be a function`)
    }
    this.handlers.set(packetName, handler)
    return this
  }

  registerBatch(handlers) {
    for (const [name, handler] of Object.entries(handlers)) {
      this.register(name, handler)
    }
    return this
  }

  async handle(packetName, data, metadata = {}) {
    const handler = this.handlers.get(packetName)
    if (!handler) {
      console.warn(`No handler for packet: ${packetName}`)
      return null
    }

    try {
      const result = await handler(data, metadata)
      this.events.emit('handled', { packet: packetName, success: true })
      return result
    } catch (err) {
      console.error(`Error handling ${packetName}:`, err)
      this.events.emit('handled', { packet: packetName, success: false, error: err })
      throw err
    }
  }

  async send(packetName, data) {
    if (!this.isConnected) {
      console.warn(`Not connected, cannot send ${packetName}`)
      return false
    }
    try {
      this.events.emit('sending', { packet: packetName, data })
      const result = await this._doSend(packetName, data)
      this.events.emit('sent', { packet: packetName, success: true })
      return result
    } catch (err) {
      console.error(`Error sending ${packetName}:`, err)
      this.events.emit('sent', { packet: packetName, success: false, error: err })
      return false
    }
  }

  async broadcast(packetName, data, exclude = null) {
    // Override in subclass
    return this.send(packetName, data)
  }

  async connect(options = {}) {
    try {
      this.isConnected = false
      await this._doConnect(options)
      this.isConnected = true
      this.retries = 0
      this.events.emit('connected', options)
      return true
    } catch (err) {
      console.error('Connection failed:', err)
      this.events.emit('connectionFailed', err)
      return this._retryConnect(options)
    }
  }

  async _retryConnect(options) {
    if (this.retries < this.maxRetries) {
      this.retries++
      const delay = Math.pow(2, this.retries) * 1000
      console.log(`Retrying connection in ${delay}ms (attempt ${this.retries}/${this.maxRetries})`)
      await new Promise(r => setTimeout(r, delay))
      return this.connect(options)
    }
    this.events.emit('connectionFailed', new Error('Max retries exceeded'))
    return false
  }

  async disconnect() {
    try {
      this.isConnected = false
      await this._doDisconnect()
      this.events.emit('disconnected')
      return true
    } catch (err) {
      console.error('Disconnect error:', err)
      return false
    }
  }

  on(event, callback) {
    return this.events.on(event, callback)
  }

  once(event, callback) {
    return this.events.once(event, callback)
  }

  off(event, callback) {
    this.events.off(event, callback)
    return this
  }

  emit(event, ...args) {
    this.events.emit(event, ...args)
    return this
  }

  // Override in subclass
  async _doConnect(options) {
    throw new Error('_doConnect must be implemented')
  }

  async _doDisconnect() {
    throw new Error('_doDisconnect must be implemented')
  }

  async _doSend(packetName, data) {
    throw new Error('_doSend must be implemented')
  }

  getStats() {
    return {
      isConnected: this.isConnected,
      isServer: this.isServer,
      isClient: this.isClient,
      handlers: this.handlers.size,
      retries: this.retries
    }
  }

  toString() {
    return `${this.name}(connected=${this.isConnected}, handlers=${this.handlers.size})`
  }
}
