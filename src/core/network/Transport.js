// Transport abstraction - unifies Socket and WebSocket implementations

import { EventBus } from '../utils/EventBus.js'

export class Transport {
  constructor(options = {}) {
    this.isConnected = false
    this.events = new EventBus()
    this.options = options
  }

  async send(packet, options = {}) {
    throw new Error('send() must be implemented by subclass')
  }

  async connect() {
    throw new Error('connect() must be implemented by subclass')
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass')
  }

  on(event, handler) {
    this.events.on(event, handler)
  }

  once(event, handler) {
    this.events.once(event, handler)
  }

  off(event, handler) {
    this.events.off(event, handler)
  }

  emit(event, data) {
    this.events.emit(event, data)
  }
}

export class WebSocketTransport extends Transport {
  constructor(url, options = {}) {
    super(options)
    this.url = url
    this.ws = null
    this.messageQueue = []
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
          this.isConnected = true
          this.emit('connected')
          this.flushQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.emit('message', event.data)
        }

        this.ws.onerror = (error) => {
          this.emit('error', error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.emit('disconnected')
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async send(packet) {
    if (!this.isConnected) {
      this.messageQueue.push(packet)
      return false
    }

    try {
      const data = this.encode(packet)
      this.ws.send(data)
      return true
    } catch (err) {
      this.emit('error', err)
      return false
    }
  }

  flushQueue() {
    while (this.messageQueue.length > 0) {
      const packet = this.messageQueue.shift()
      this.send(packet)
    }
  }

  encode(packet) {
    return JSON.stringify(packet)
  }

  decode(data) {
    return JSON.parse(data)
  }
}

export class SocketTransport extends Transport {
  constructor(socket, options = {}) {
    super(options)
    this.socket = socket
    this.isConnected = true
  }

  async connect() {
    this.isConnected = true
    this.emit('connected')
  }

  async disconnect() {
    if (this.socket) {
      this.socket.end()
    }
    this.isConnected = false
    this.emit('disconnected')
  }

  async send(packet, options = {}) {
    if (!this.isConnected || !this.socket) return false

    try {
      const data = this.encode(packet)
      this.socket.write(data)
      return true
    } catch (err) {
      this.emit('error', err)
      return false
    }
  }

  encode(packet) {
    return JSON.stringify(packet)
  }

  decode(data) {
    return JSON.parse(data)
  }
}
