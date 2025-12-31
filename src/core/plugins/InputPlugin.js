import { Plugin } from './Plugin.js'
import { InputHelper } from '../utils/helpers/Helpers.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('InputPlugin')

export class InputPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Input'
    this.version = '1.0.0'
    this.system = null
    this.inputHelper = InputHelper
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

      registerHandler: (eventType, handler, options) => {
        if (!this.enabled || !this.system) return null
        return this.inputHelper.registerInput(this.system, eventType, handler, options)
      },

      dispatchEvent: (eventType, data) => {
        if (!this.enabled || !this.system) return false
        return this.inputHelper.dispatchInput(this.system, eventType, data)
      },

      normalizeButton: (buttonState) => {
        return this.inputHelper.normalizeButtonState(buttonState)
      },

      normalizeVector: (vectorState) => {
        return this.inputHelper.normalizeVectorState(vectorState)
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        return {
          active: true,
          pointerLocked: this.system.pointer?.locked || false,
          screen: {
            width: this.system.screen?.width || 0,
            height: this.system.screen?.height || 0
          },
          controlsCount: this.system.controls?.length || 0,
          actionsCount: this.system.actions?.length || 0
        }
      }
    }
  }
}
