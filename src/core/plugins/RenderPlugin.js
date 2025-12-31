import { Plugin } from './Plugin.js'
import { RenderHelper } from '../utils/helpers/Helpers.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('RenderPlugin')

export class RenderPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Render'
    this.version = '1.0.0'
    this.system = null
    this.renderHelper = RenderHelper
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

      cloneTextures: (material) => {
        if (!this.enabled) return []
        return this.renderHelper.cloneTextures(material)
      },

      setupEnvironment: (options) => {
        if (!this.enabled || !this.system) return false
        this.renderHelper.setupSceneEnvironment(this.system.scene, options)
        return true
      },

      raycastFromCamera: (mouse) => {
        if (!this.enabled || !this.system) return false
        return this.renderHelper.raycastFromCamera(
          this.system.raycaster,
          this.system.camera,
          this.system.viewport,
          mouse
        )
      },

      raycastFromCenter: () => {
        if (!this.enabled || !this.system) return false
        return this.renderHelper.raycastFromCenter(this.system.raycaster, this.system.camera)
      },

      getSceneStats: () => {
        if (!this.enabled || !this.system) return null
        return this.renderHelper.getSceneStats(this.system.scene)
      },

      addGridHelper: (size, divisions) => {
        if (!this.enabled || !this.system) return null
        const grid = this.renderHelper.createGridHelper(size, divisions)
        this.system.scene.add(grid)
        return grid
      },

      addAxisHelper: (size) => {
        if (!this.enabled || !this.system) return null
        const axis = this.renderHelper.createAxisHelper(size)
        this.system.scene.add(axis)
        return axis
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        const sceneStats = this.renderHelper.getSceneStats(this.system.scene)
        return {
          active: true,
          scene: !!this.system.scene,
          camera: !!this.system.camera,
          viewport: !!this.system.viewport,
          sceneChildren: this.system.scene?.children?.length || 0,
          renderStats: this.system.renderStats || null,
          sceneStats
        }
      }
    }
  }
}
