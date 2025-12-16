// Unified network abstraction - eliminates server/client duplication

import { EventBus } from '../utils/EventBus.js'

export class BaseNetwork {
  constructor(world, options = {}) {
    this.world = world
    this.isServer = world?.isServer || false
    this.isClient = !this.isServer
    this.isConnected = false
    this.transport = null
    this.handlers = new Map()
    this.queue = []
    this.events = new EventBus()
    this.state = 'disconnected'
    this.options = { reconnectAttempts: 5, reconnectDelay: 1000, ...options }
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState
      this.events.emit('state', newState)
      this.isConnected = newState === 'connected'
    }
  }

  registerHandler(name, handler) {
    this.handlers.set(name, handler)
  }

  registerHandlers(handlers) {
    for (const [name, handler] of Object.entries(handlers)) {
      this.registerHandler(name, handler)
    }
  }

  async send(name, data, options = {}) {
    if (!this.transport) return false

    const packet = this.encodePacket(name, data)
    return await this.transport.send(packet, options)
  }

  async broadcast(name, data, options = {}) {
    if (!this.isServer) return false
    return await this.send(name, data, { ...options, broadcast: true })
  }

  enqueue(context, methodName, data) {
    this.queue.push({ context, methodName, data })
  }

  async flush() {
    const batch = this.queue.splice(0, this.queue.length)

    for (const { context, methodName, data } of batch) {
      const handler = this.handlers.get(methodName)
      if (handler) {
        try {
          await handler.call(context, data)
        } catch (err) {
          this.events.emit('error', { methodName, error: err })
        }
      }
    }
  }

  encodePacket(name, data) {
    return [name, data]
  }

  decodePacket(packet) {
    return Array.isArray(packet) ? [packet[0], packet[1]] : [null, packet]
  }

  async processPacket(packet, context = null) {
    const [name, data] = this.decodePacket(packet)

    if (!name) return

    const handler = this.handlers.get(name)
    if (!handler && !this[name]) {
      this.events.emit('unknown', { name, data })
      return
    }

    if (handler) {
      this.enqueue(context || this, name, data)
    } else if (typeof this[name] === 'function') {
      this.enqueue(context || this, name, data)
    }
  }

  async connect() {
    this.setState('connecting')
    try {
      await this._connect()
      this.setState('connected')
      return true
    } catch (err) {
      this.events.emit('error', { phase: 'connect', error: err })
      this.setState('disconnected')
      return false
    }
  }

  async disconnect() {
    this.setState('disconnecting')
    try {
      await this._disconnect()
      this.setState('disconnected')
    } catch (err) {
      this.events.emit('error', { phase: 'disconnect', error: err })
    }
  }

  async _connect() {
    throw new Error('_connect() must be implemented by subclass')
  }

  async _disconnect() {
    throw new Error('_disconnect() must be implemented by subclass')
  }

  async init(world) {
    this.world = world
  }

  async start(world, services) {
    await this.connect()
  }

  async destroy() {
    await this.disconnect()
  }
}
