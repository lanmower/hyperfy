import { Plugin } from '../Plugin.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('NetworkTransportPlugin')

export class NetworkTransportPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'NetworkTransport'
    this.version = '1.0.0'
    this.networkSystem = null
    this.messageHandlers = new Map()
    this.config = {
      protocol: options.protocol || 'websocket',
      url: options.url || null,
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000
    }
  }

  async init() {
    this.networkSystem = this.world.network || this.world.clientNetwork || this.world.serverNetwork
    if (!this.networkSystem) {
      logger.warn('Network system not available')
      return
    }
    logger.info('Network transport plugin initialized', { config: this.config })
  }

  async destroy() {
    this.messageHandlers.clear()
    this.networkSystem = null
    logger.info('Network transport plugin destroyed')
  }

  registerMessageHandler(messageType, handler) {
    if (!this.enabled || !this.networkSystem) return false
    this.messageHandlers.set(messageType, handler)
    return true
  }

  getAPI() {
    return {
      send: (message) => {
        if (!this.enabled || !this.networkSystem) return false
        return this.networkSystem.send?.(message) || false
      },

      broadcast: (message, exclude) => {
        if (!this.enabled || !this.networkSystem) return false
        return this.networkSystem.broadcast?.(message, exclude) || false
      },

      on: (event, callback) => {
        if (!this.enabled || !this.networkSystem) return null
        return this.networkSystem.on?.(event, callback) || null
      },

      off: (event, callback) => {
        if (!this.enabled || !this.networkSystem) return false
        return this.networkSystem.off?.(event, callback) || false
      },

      registerMessageHandler: (type, handler) => {
        return this.registerMessageHandler(type, handler)
      },

      getMessageHandler: (type) => {
        if (!this.enabled) return null
        return this.messageHandlers.get(type) || null
      },

      disconnect: () => {
        if (!this.enabled || !this.networkSystem) return false
        return this.networkSystem.disconnect?.() || false
      },

      isConnected: () => {
        if (!this.enabled || !this.networkSystem) return false
        return this.networkSystem.connected || false
      },

      getConnectionStats: () => {
        if (!this.enabled || !this.networkSystem) return null
        return {
          connected: this.networkSystem.connected || false,
          latency: this.networkSystem.latency || 0,
          messagesSent: this.networkSystem.messagesSent || 0,
          messagesReceived: this.networkSystem.messagesReceived || 0,
          protocol: this.config.protocol,
          url: this.config.url
        }
      },

      getConfig: () => {
        return { ...this.config }
      },

      updateConfig: (newConfig) => {
        if (!this.enabled) return false
        this.config = { ...this.config, ...newConfig }
        return true
      }
    }
  }
}
