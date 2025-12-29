import { Plugin } from './Plugin.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('RenderPlugin')

export class RenderPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Render'
    this.version = '1.0.0'
    this.system = null
  }

  async init() {
    this.system = this.world.stage
    if (!this.system) {
      logger.warn('Stage system not available')
      return
    }
    logger.info('Render plugin initialized')
  }

  async destroy() {
    this.system = null
    logger.info('Render plugin destroyed')
  }

  getAPI() {
    return {
      add: (object) => {
        if (!this.enabled || !this.system) return false
        this.system.scene?.add?.(object)
        return true
      },

      remove: (object) => {
        if (!this.enabled || !this.system) return false
        this.system.scene?.remove?.(object)
        return true
      },

      getScene: () => {
        if (!this.enabled || !this.system) return null
        return this.system.scene || null
      },

      getCamera: () => {
        if (!this.enabled || !this.system) return null
        return this.system.camera || null
      },

      getViewport: () => {
        if (!this.enabled || !this.system) return null
        return this.system.viewport || null
      },

      createMaterial: (options) => {
        if (!this.enabled || !this.system) return null
        return this.system.createMaterial?.(options) || null
      },

      raycast: (mouse, objects) => {
        if (!this.enabled || !this.system) return null
        return this.system.raycast?.(mouse, objects) || null
      },

      getRenderStats: () => {
        if (!this.enabled || !this.system) return null
        return this.system.renderStats || null
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        return {
          active: true,
          scene: !!this.system.scene,
          camera: !!this.system.camera,
          viewport: !!this.system.viewport,
          sceneChildren: this.system.scene?.children?.length || 0,
          renderStats: this.system.renderStats || null
        }
      }
    }
  }
}
