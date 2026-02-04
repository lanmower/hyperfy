import EventEmitter from 'node:events'
import { MSG } from '../protocol/MessageTypes.js'
import { Codec } from '../protocol/Codec.js'
import { SequenceTracker } from '../protocol/SequenceTracker.js'
import { QualityMonitor } from './QualityMonitor.js'

export class ConnectionManager extends EventEmitter {
  constructor(config = {}) {
    super()
    this.clients = new Map()
    this.heartbeatInterval = config.heartbeatInterval || 1000
    this.heartbeatTimeout = config.heartbeatTimeout || 3000
    this._heartbeatTimer = null
  }

  addClient(id, socket) {
    const client = {
      id,
      socket,
      codec: new Codec(),
      tracker: new SequenceTracker(),
      quality: new QualityMonitor(),
      sessionToken: null,
      lastHeartbeat: Date.now(),
      pendingPing: null,
      alive: true
    }
    this.clients.set(id, client)
    this._setupSocket(client)
    if (!this._heartbeatTimer) this._startHeartbeats()
    return client
  }

  _setupSocket(client) {
    const { socket, id } = client
    socket.on('message', (raw) => {
      try {
        const msg = client.codec.decode(raw)
        if (!msg) return
        client.quality.recordBytesIn(raw.length || raw.byteLength || 0)
        client.tracker.track(msg.seq)
        this._handleMessage(client, msg)
      } catch (e) {
        this.emit('error', id, e)
      }
    })
    socket.on('close', () => this._onDisconnect(client, 'close'))
    socket.on('error', (e) => this.emit('error', id, e))
  }

  _handleMessage(client, msg) {
    if (msg.type === MSG.HEARTBEAT_ACK) {
      if (client.pendingPing) {
        const rtt = Date.now() - client.pendingPing
        client.quality.recordRtt(rtt)
        client.quality.recordHeartbeatReceived()
        client.pendingPing = null
      }
      client.lastHeartbeat = Date.now()
      client.alive = true
      return
    }
    if (msg.type === MSG.HEARTBEAT) {
      this.send(client.id, MSG.HEARTBEAT_ACK, { ts: msg.payload?.ts })
      client.lastHeartbeat = Date.now()
      client.alive = true
      return
    }
    this.emit('message', client.id, msg)
  }

  send(clientId, type, payload) {
    const client = this.clients.get(clientId)
    if (!client || !client.socket) return false
    try {
      const frame = client.codec.encode(type, payload)
      client.quality.recordBytesOut(frame.length)
      client.socket.send(frame)
      return true
    } catch (e) {
      this.emit('error', clientId, e)
      return false
    }
  }

  broadcast(type, payload) {
    for (const [id] of this.clients) {
      this.send(id, type, payload)
    }
  }

  _startHeartbeats() {
    this._heartbeatTimer = setInterval(() => {
      const now = Date.now()
      for (const [id, client] of this.clients) {
        if (now - client.lastHeartbeat > this.heartbeatTimeout) {
          this._onDisconnect(client, 'timeout')
          continue
        }
        client.pendingPing = now
        client.quality.recordHeartbeatSent()
        this.send(id, MSG.HEARTBEAT, { ts: now })
      }
    }, this.heartbeatInterval)
  }

  _onDisconnect(client, reason) {
    if (!this.clients.has(client.id)) return
    this.clients.delete(client.id)
    this.emit('disconnect', client.id, reason)
    if (this.clients.size === 0 && this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
  }

  removeClient(id) {
    const client = this.clients.get(id)
    if (!client) return
    this.clients.delete(id)
    try { client.socket.close() } catch (e) {}
    if (this.clients.size === 0 && this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
  }

  getClient(id) {
    return this.clients.get(id) || null
  }

  getClientStats(id) {
    const client = this.clients.get(id)
    if (!client) return null
    return {
      ...client.quality.getStats(),
      codec: client.codec.getStats(),
      sequence: client.tracker.getStats()
    }
  }

  getAllStats() {
    const stats = {}
    for (const [id, client] of this.clients) {
      stats[id] = this.getClientStats(id)
    }
    return stats
  }

  getClientCount() {
    return this.clients.size
  }

  destroy() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
    for (const [id, client] of this.clients) {
      try { client.socket.close() } catch (e) {}
    }
    this.clients.clear()
  }
}
