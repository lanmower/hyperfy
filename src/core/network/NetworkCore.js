/* Unified network coordination for WebSocket, sockets, and timeouts */

export class NetworkCore {
  constructor() {
    this.sockets = new Map()
    this.handlers = new Map()
    this.timeouts = new Map()
  }

  registerSocket(id, socket) {
    this.sockets.set(id, socket)
  }

  unregisterSocket(id) {
    this.sockets.delete(id)
    const timeout = this.timeouts.get(id)
    if (timeout) clearTimeout(timeout)
    this.timeouts.delete(id)
  }

  registerHandler(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(handler)
  }

  invokeHandlers(event, ...args) {
    const handlers = this.handlers.get(event) || []
    for (const handler of handlers) {
      try {
        handler(...args)
      } catch (err) {
        // Handler error silently ignored
      }
    }
  }

  setTimeout(id, duration, callback) {
    const existingTimeout = this.timeouts.get(id)
    if (existingTimeout) clearTimeout(existingTimeout)
    const timeout = setTimeout(callback, duration)
    this.timeouts.set(id, timeout)
  }

  clearTimeout(id) {
    const timeout = this.timeouts.get(id)
    if (timeout) clearTimeout(timeout)
    this.timeouts.delete(id)
  }

  broadcast(event, data) {
    for (const [, socket] of this.sockets) {
      socket?.send?.(event, data)
    }
  }

  destroy() {
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
    this.sockets.clear()
    this.handlers.clear()
  }
}
