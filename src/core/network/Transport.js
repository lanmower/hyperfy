// Transport abstraction - WebSocket, Socket, and connection pooling

import { EventBus } from '../utils/EventBus.js'

export class Transport {
  constructor(options = {}) {
    this.options = options
    this.isConnected = false
    this.events = new EventBus()
  }

  async connect() {
    throw new Error("Connect not implemented")
  }

  async disconnect() {
    throw new Error("Disconnect not implemented")
  }

  send(data) {
    throw new Error("Send not implemented")
  }

  on(event, handler) {
    this.events.on(event, handler)
    return this
  }

  off(event, handler) {
    this.events.off(event, handler)
    return this
  }

  toString() {
    return "Transport(" + (this.isConnected ? "connected" : "disconnected") + ")"
  }
}

export class WebSocketTransport extends Transport {
  constructor(url, options = {}) {
    super(options)
    this.url = url
    this.ws = null
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
        this.ws.onopen = () => {
          this.isConnected = true
          this.events.emit("connect")
          resolve()
        }
        this.ws.onmessage = (e) => {
          this.events.emit("message", e.data)
        }
        this.ws.onerror = (e) => {
          this.events.emit("error", e)
          reject(e)
        }
        this.ws.onclose = () => {
          this.isConnected = false
          this.events.emit("close")
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
    }
  }

  send(data) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
    }
  }

  toString() {
    return "WebSocketTransport(" + this.url + ")"
  }
}

export class SocketTransport extends Transport {
  constructor(host, port, options = {}) {
    super(options)
    this.host = host
    this.port = port
    this.socket = null
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const net = require("net")
        this.socket = net.createConnection(this.port, this.host)

        this.socket.on("connect", () => {
          this.isConnected = true
          this.events.emit("connect")
          resolve()
        })

        this.socket.on("data", (data) => {
          this.events.emit("message", data)
        })

        this.socket.on("error", (err) => {
          this.events.emit("error", err)
          reject(err)
        })

        this.socket.on("close", () => {
          this.isConnected = false
          this.events.emit("close")
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  async disconnect() {
    if (this.socket) {
      this.socket.destroy()
      this.isConnected = false
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.write(JSON.stringify(data))
    }
  }

  toString() {
    return "SocketTransport(" + this.host + ":" + this.port + ")"
  }
}

export class ConnectionPool {
  constructor(options = {}) {
    this.options = options
    this.maxSize = options.maxSize || 10
    this.pool = []
    this.active = new Set()
    this.TransportClass = options.TransportClass || WebSocketTransport
    this.createFn = options.createFn || null
  }

  async acquire() {
    if (this.pool.length > 0) {
      const conn = this.pool.pop()
      this.active.add(conn)
      return conn
    }

    if (this.active.size < this.maxSize) {
      const conn = this.createFn 
        ? await this.createFn()
        : new this.TransportClass()
      
      await conn.connect()
      this.active.add(conn)
      return conn
    }

    throw new Error("Connection pool exhausted")
  }

  release(conn) {
    this.active.delete(conn)
    if (this.pool.length < this.maxSize) {
      this.pool.push(conn)
    } else {
      conn.disconnect()
    }
  }

  clear() {
    for (const conn of this.pool) {
      conn.disconnect()
    }
    for (const conn of this.active) {
      conn.disconnect()
    }
    this.pool = []
    this.active.clear()
  }

  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      maxSize: this.maxSize
    }
  }

  toString() {
    return "ConnectionPool(" + this.active.size + "/" + this.maxSize + ", " + this.pool.length + " pooled)"
  }
}
