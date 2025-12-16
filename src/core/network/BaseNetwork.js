import { System } from '../systems/System.js'
import { NetworkProtocol } from './NetworkProtocol.js'

/**
 * Base Network System
 *
 * - Shared functionality for ClientNetwork and ServerNetwork
 * - Manages protocol, handler registry, and lifecycle
 * - Subclasses override getMessageHandlers() for platform-specific handlers
 *
 */
export class BaseNetwork extends System {
  constructor(world, handlerNames) {
    super(world)
    this.protocol = new NetworkProtocol(this.constructor.name)
    this.handlerNames = handlerNames // Optional: handler name mapping for dependency injection
    this.setupHandlerRegistry()
  }

  /**
   * Sets up the handler registry by binding all message handlers
   * Each handler is registered with the protocol for dispatch
   */
  setupHandlerRegistry() {
    const handlers = this.getMessageHandlers()
    for (const [name, handler] of Object.entries(handlers)) {
      this.protocol.register(name, handler.bind(this))
    }
  }

  /**
   * Override in subclass to define platform-specific message handlers
   * Returns object mapping handler name -> handler method
   *
   * If handlerNames was provided in constructor, use that instead of overriding
   */
  getMessageHandlers() {
    if (this.handlerNames) {
      return this.createHandlerMap(this.handlerNames)
    }
    return {}
  }

  /**
   * Create handler map from handler names
   * Maps handler name -> bound handler method
   */
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

  /**
   * Flush pending protocol messages
   * Called during pre-fixed update cycle
   */
  preFixedUpdate() {
    this.protocol.flush()
  }

  /**
   * Get current server time (accounting for network offset on client)
   */
  getTime() {
    return this.protocol.getTime()
  }

  /**
   * Send a message (abstract - override in subclass)
   */
  send(name, data) {
    throw new Error('send() must be implemented by subclass')
  }

  /**
   * Enqueue a message for sending (abstract - override in subclass)
   */
  enqueue(socket, method, data) {
    throw new Error('enqueue() must be implemented by subclass')
  }
}
