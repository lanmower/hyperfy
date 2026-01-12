import { Plugin } from '../Plugin.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('InputHandlerPlugin')

export class InputHandlerPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'InputHandler'
    this.version = '1.0.0'
    this.inputSystem = null
  }

  async init() {
    this.inputSystem = this.world.controls || this.world.input
    if (!this.inputSystem) {
      logger.warn('Input system not available')
      return
    }
    logger.info('Input handler plugin initialized')
  }

  async destroy() {
    this.inputSystem = null
    logger.info('Input handler plugin destroyed')
  }

  getAPI() {
    return {
      registerKeyHandler: (key, handler) => {
        if (!this.enabled || !this.inputSystem) return false
        return this.inputSystem.registerKeyHandler?.(key, handler) || false
      },

      registerPointerHandler: (handler) => {
        if (!this.enabled || !this.inputSystem) return false
        return this.inputSystem.registerPointerHandler?.(handler) || false
      },

      registerTouchHandler: (handler) => {
        if (!this.enabled || !this.inputSystem) return false
        return this.inputSystem.registerTouchHandler?.(handler) || false
      },

      getInputState: () => {
        if (!this.enabled || !this.inputSystem) return {}
        return {
          keys: this.inputSystem.keys || {},
          pointer: this.inputSystem.pointer || {},
          touch: this.inputSystem.touch || {}
        }
      }
    }
  }
}
