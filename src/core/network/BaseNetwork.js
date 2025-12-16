// Unified client/server network abstraction consolidating protocol duplication

import { Request, Response } from '../Request.js'
import { EventBus } from '../utils/EventBus.js'

export class BaseNetwork {
  constructor(options = {}) {
    this.options = options
    this.connections = new Map()
    this.handlers = new Map()
    this.events = new EventBus()
    this.isServer = options.isServer || false
  }

  // Register message handler
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type).push(handler)
    return this
  }

  // Unregister message handler
  off(type, handler) {
    if (!this.handlers.has(type)) return this
    const handlers = this.handlers.get(type)
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
    return this
  }

  // Send message with optional request/response pattern
  async send(connectionId, type, data = {}, options = {}) {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error("Connection not found: " + connectionId)
    }

    if (options.request) {
      return new Request(type, data).send(connection)
    } else {
      return connection.send(JSON.stringify({ type, data }))
    }
  }

  // Broadcast message to all connections
  broadcast(type, data = {}, exclude = null) {
    for (const [id, connection] of this.connections) {
      if (exclude && id === exclude) continue
      connection.send(JSON.stringify({ type, data }))
    }
  }

  // Register connection
  registerConnection(id, connection) {
    this.connections.set(id, connection)
    this.events.emit('connection', id)
    return this
  }

  // Unregister connection
  unregisterConnection(id) {
    this.connections.delete(id)
    this.events.emit('disconnect', id)
    return this
  }

  // Handle incoming message
  handleMessage(connectionId, message) {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message
      const handlers = this.handlers.get(msg.type) || []

      for (const handler of handlers) {
        handler(connectionId, msg.data, msg)
      }
    } catch (err) {
      console.error("Error handling message:", err)
    }
  }

  // Get connection info
  getConnection(id) {
    return this.connections.get(id)
  }

  // Get all connections
  getConnections() {
    return Array.from(this.connections.values())
  }

  // Get connection count
  getConnectionCount() {
    return this.connections.size
  }

  toString() {
    return "BaseNetwork(" + this.connections.size + " connections, " + this.handlers.size + " handlers)"
  }
}
