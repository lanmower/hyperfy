// Connection pool - manages multiple client connections (server-side)

import { EventBus } from '../utils/EventBus.js'

export class ConnectionPool {
  constructor(options = {}) {
    this.connections = new Map()
    this.events = new EventBus()
    this.options = { maxConnections: 1000, ...options }
  }

  add(id, connection) {
    if (this.connections.size >= this.options.maxConnections) {
      this.events.emit('full')
      return false
    }

    this.connections.set(id, connection)
    this.events.emit('added', { id, connection })
    return true
  }

  get(id) {
    return this.connections.get(id)
  }

  has(id) {
    return this.connections.has(id)
  }

  remove(id) {
    const connection = this.connections.get(id)
    if (connection) {
      this.connections.delete(id)
      this.events.emit('removed', { id, connection })
      return true
    }
    return false
  }

  async broadcast(name, data, options = {}) {
    const { exclude = null, filter = null } = options
    const promises = []

    for (const [id, connection] of this.connections) {
      if (exclude && id === exclude) continue
      if (filter && !filter(id, connection)) continue

      promises.push(connection.send(name, data))
    }

    return await Promise.all(promises)
  }

  async unicast(id, name, data) {
    const connection = this.connections.get(id)
    if (connection) {
      return await connection.send(name, data)
    }
    return false
  }

  async multicast(ids, name, data) {
    const promises = []

    for (const id of ids) {
      const connection = this.connections.get(id)
      if (connection) {
        promises.push(connection.send(name, data))
      }
    }

    return await Promise.all(promises)
  }

  async forEach(fn) {
    for (const [id, connection] of this.connections) {
      await fn(id, connection)
    }
  }

  async forEachParallel(fn) {
    const promises = []

    for (const [id, connection] of this.connections) {
      promises.push(fn(id, connection))
    }

    return await Promise.all(promises)
  }

  getStats() {
    return {
      total: this.connections.size,
      max: this.options.maxConnections,
      utilization: (this.connections.size / this.options.maxConnections * 100).toFixed(2) + '%'
    }
  }

  clear() {
    this.connections.clear()
    this.events.emit('cleared')
  }

  on(event, handler) {
    this.events.on(event, handler)
  }

  off(event, handler) {
    this.events.off(event, handler)
  }
}
