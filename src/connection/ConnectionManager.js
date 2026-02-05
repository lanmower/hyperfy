import { pack, unpack } from 'msgpackr'
import EventEmitter from 'node:events'

export class ConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super()
    this.clients = new Map()
    this.heartbeatInterval = options.heartbeatInterval || 1000
    this.heartbeatTimeout = options.heartbeatTimeout || 3000
    this.timers = new Map()
  }

  addClient(clientId, socket) {
    const client = {
      id: clientId,
      socket,
      lastHeartbeat: Date.now(),
      sessionToken: null
    }

    socket.on('message', (data) => {
      try {
        client.lastHeartbeat = Date.now()
        const msg = unpack(data)
        this.emit('message', clientId, msg)
      } catch (err) {
        console.error(`[connection] message decode error for ${clientId}:`, err.message)
      }
    })

    socket.on('close', () => {
      this.removeClient(clientId)
      this.emit('disconnect', clientId, 'closed')
    })

    socket.on('error', (err) => {
      console.error(`[connection] socket error for ${clientId}:`, err.message)
      this.removeClient(clientId)
      this.emit('disconnect', clientId, 'error')
    })

    this.clients.set(clientId, client)
    this._setupHeartbeat(clientId)
    return client
  }

  _setupHeartbeat(clientId) {
    const check = () => {
      const client = this.clients.get(clientId)
      if (!client) return
      const age = Date.now() - client.lastHeartbeat
      if (age > this.heartbeatTimeout) {
        this.removeClient(clientId)
        this.emit('disconnect', clientId, 'timeout')
        return
      }
      const timer = setTimeout(check, this.heartbeatInterval)
      this.timers.set(`hb-${clientId}`, timer)
    }
    const timer = setTimeout(check, this.heartbeatInterval)
    this.timers.set(`hb-${clientId}`, timer)
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId)
    if (!client) return
    if (client.socket && client.socket.readyState === 1) {
      client.socket.close()
    }
    this.clients.delete(clientId)
    const timer = this.timers.get(`hb-${clientId}`)
    if (timer) clearTimeout(timer)
    this.timers.delete(`hb-${clientId}`)
  }

  getClient(clientId) {
    return this.clients.get(clientId)
  }

  send(clientId, type, payload = {}) {
    const client = this.clients.get(clientId)
    if (!client || client.socket.readyState !== 1) return false
    try {
      const msg = { type, payload }
      client.socket.send(pack(msg))
      return true
    } catch (err) {
      console.error(`[connection] send error to ${clientId}:`, err.message)
      return false
    }
  }

  broadcast(type, payload = {}) {
    const msg = { type, payload }
    const data = pack(msg)
    let count = 0
    for (const client of this.clients.values()) {
      if (client.socket.readyState === 1) {
        try {
          client.socket.send(data)
          count++
        } catch (err) {
          console.error(`[connection] broadcast error to ${client.id}:`, err.message)
        }
      }
    }
    return count
  }

  getAllStats() {
    return {
      activeConnections: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, c]) => ({
        id,
        sessionToken: c.sessionToken ? '***' : null
      }))
    }
  }

  destroy() {
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId)
    }
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.clients.clear()
    this.timers.clear()
  }
}
