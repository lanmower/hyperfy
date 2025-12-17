
import { BaseNetwork } from './BaseNetwork.js'
import { NetworkProtocol } from '../network/NetworkProtocol.js'

export class UnifiedNetwork extends BaseNetwork {
  constructor(options = {}) {
    super(options)
    this.protocol = new NetworkProtocol('UnifiedNetwork')
    this.protocol.flushTarget = this
    this.protocol.isServer = options.isServer || false
    this.protocol.isClient = !options.isServer
    this.protocol.isConnected = false
    this.handlers = new Map()
    this.tickInterval = null
  }

  async init(options = {}) {
    this.options = { ...this.options, ...options }
    
    if (this.isServer) {
      return this.initServer(options)
    } else {
      return this.initClient(options)
    }
  }

  async initServer(options) {
    this.isServer = true
    this.protocol.isServer = true
    this.connectionCheckInterval = setInterval(() => this.checkConnections(), 1000)
    return this
  }

  async initClient(options) {
    this.isServer = false
    this.protocol.isClient = true
    
    const wsUrl = options.wsUrl || 'ws://localhost:3000'
    const authToken = options.authToken || null
    const name = options.name || 'Player'
    const avatar = options.avatar || null
    
    let url = wsUrl
    if (authToken) url += '?authToken=' + authToken
    if (name) url += (authToken ? '&' : '?') + 'name=' + encodeURIComponent(name)
    if (avatar) url += '&avatar=' + encodeURIComponent(avatar)
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)
        this.ws.binaryType = 'arraybuffer'
        
        this.ws.onopen = () => {
          this.protocol.isConnected = true
          this.events.emit('connect')
          resolve(this)
        }
        
        this.ws.onmessage = (e) => {
          this.handleMessage('server', e.data)
          this.events.emit('message', e.data)
        }
        
        this.ws.onerror = (e) => {
          this.events.emit('error', e)
          reject(e)
        }
        
        this.ws.onclose = () => {
          this.protocol.isConnected = false
          this.events.emit('disconnect')
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  preFixedUpdate() {
    this.protocol.flush()
  }

  send(type, data, connectionId = null) {
    if (this.isServer && connectionId) {
      const connection = this.connections.get(connectionId)
      if (connection) {
        this.sendPacket(connection, type, data)
      }
    } else if (this.ws) {
      this.sendPacket(this.ws, type, data)
    }
  }

  sendPacket(target, type, data) {
    if (typeof window === 'undefined') {
      return target.send(JSON.stringify({ type, data }))
    } else {
      return target.send(JSON.stringify({ type, data }))
    }
  }

  broadcast(type, data, exclude = null) {
    if (!this.isServer) return
    super.broadcast(type, data, exclude)
  }

  registerConnection(id, connection) {
    if (!this.isServer) return
    super.registerConnection(id, connection)
  }

  checkConnections() {
    if (!this.isServer) return
    
    const dead = []
    for (const [id, connection] of this.connections) {
      if (!connection.alive) {
        dead.push(id)
      } else if (connection.ping) {
        connection.ping()
      }
    }
    
    for (const id of dead) {
      this.unregisterConnection(id)
      if (connection.disconnect) {
        connection.disconnect()
      }
    }
  }

  enqueue(target, method, data) {
    this.protocol.enqueue(target, method, data)
  }

  getTime() {
    return this.protocol.getTime()
  }

  async destroy() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
    }
    if (this.ws) {
      this.ws.close()
    }
    for (const [id, connection] of this.connections) {
      if (connection.disconnect) {
        connection.disconnect()
      }
    }
    this.connections.clear()
  }

  toString() {
    const mode = this.isServer ? 'server' : 'client'
    const conns = this.connections.size
    return "UnifiedNetwork(" + mode + ", " + conns + " connections)"
  }
}
