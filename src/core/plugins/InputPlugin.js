import { Plugin } from './Plugin.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('InputPlugin')

export class InputPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Input'
    this.version = '1.0.0'
    this.system = null
  }

  async init() {
    this.system = this.world.controls
    if (!this.system) {
      logger.warn('Controls system not available')
      return
    }
    logger.info('Input plugin initialized')
  }

  async destroy() {
    this.system = null
    logger.info('Input plugin destroyed')
  }

  getAPI() {
    return {
      on: (event, callback) => {
        if (!this.enabled || !this.system) return null
        return this.system.on?.(event, callback) || null
      },

      off: (event, callback) => {
        if (!this.enabled || !this.system) return false
        return this.system.off?.(event, callback) || false
      },

      isActive: () => {
        if (!this.enabled || !this.system) return false
        return !!this.system
      },

      lockPointer: () => {
        if (!this.enabled || !this.system) return false
        return this.system.lockPointer?.() || false
      },

      unlockPointer: () => {
        if (!this.enabled || !this.system) return false
        return this.system.unlockPointer?.() || false
      },

      isPointerLocked: () => {
        if (!this.enabled || !this.system) return false
        return this.system.pointer?.locked || false
      },

      getPointer: () => {
        if (!this.enabled || !this.system) return null
        return this.system.pointer || null
      },

      getScreen: () => {
        if (!this.enabled || !this.system) return null
        return this.system.screen || null
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        return {
          active: true,
          pointerLocked: this.system.pointer?.locked || false,
          screen: {
            width: this.system.screen?.width || 0,
            height: this.system.screen?.height || 0
          }
        }
      }
    }
  }
}
