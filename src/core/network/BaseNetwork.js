import { System } from '../systems/System.js'
import { NetworkProtocol } from './NetworkProtocol.js'


export class BaseNetwork extends System {
  constructor(world, handlerNames) {
    super(world)
    this.protocol = new NetworkProtocol(this.constructor.name)
    this.handlerNames = handlerNames // Optional: handler name mapping for dependency injection
    this.setupHandlerRegistry()
  }

  
  setupHandlerRegistry() {
    const handlers = this.getMessageHandlers()
    for (const [name, handler] of Object.entries(handlers)) {
      this.protocol.register(name, handler.bind(this))
    }
  }

  
  getMessageHandlers() {
    if (this.handlerNames) {
      return this.createHandlerMap(this.handlerNames)
    }
    return {}
  }

  
  createHandlerMap(handlerNames) {
    const handlers = {}
    for (const [name, methodName] of Object.entries(handlerNames)) {
      const method = this[methodName]
      if (!method) {
        console.warn(`Handler method not found: ${methodName}`)
        continue
      }
      handlers[name] = method.bind(this)
    }
    return handlers
  }

  
  preFixedUpdate() {
    this.protocol.flush()
  }

  
  getTime() {
    return this.protocol.getTime()
  }

  
  send(name, data) {
    throw new Error('send() must be implemented by subclass')
  }

  
  enqueue(socket, method, data) {
    throw new Error('enqueue() must be implemented by subclass')
  }
}
