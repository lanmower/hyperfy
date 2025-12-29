import { Plugin } from './Plugin.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('NetworkPlugin')

export class NetworkPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Network'
    this.version = '1.0.0'
    this.system = null
  }

  async init() {
    this.system = this.world.network
    if (!this.system) {
      logger.warn('Network system not available')
      return
    }
    logger.info('Network plugin initialized')
  }

  async destroy() {
    this.system = null
    logger.info('Network plugin destroyed')
  }

  getAPI() {
    return {
      send: (name, data) => {
        if (!this.enabled || !this.system) return false
        return this.system.send?.(name, data) || false
      },

      on: (event, callback) => {
        if (!this.enabled || !this.system) return null
        return this.system.on?.(event, callback) || null
      },

      off: (event, callback) => {
        if (!this.enabled || !this.system) return false
        return this.system.off?.(event, callback) || false
      },

      connect: (options) => {
        if (!this.enabled || !this.system) return false
        return this.system.connect?.(options) || false
      },

      disconnect: () => {
        if (!this.enabled || !this.system) return false
        return this.system.disconnect?.() || false
      },

      isConnected: () => {
        if (!this.enabled || !this.system) return false
        return this.system.connected || false
      },

      upload: async (file) => {
        if (!this.enabled || !this.system) return false
        return this.system.upload?.(file) || false
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        return {
          connected: this.system.connected || false,
          id: this.system.id || null,
          offlineMode: this.system.offlineMode || false,
          isClient: this.system.isClient || false,
          isServer: this.system.isServer || false
        }
      }
    }
  }
}
