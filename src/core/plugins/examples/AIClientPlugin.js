import { Plugin } from '../Plugin.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AIClientPlugin')

export class AIClientPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'AIClient'
    this.version = '1.0.0'
    this.aiSystem = null
    this.config = {
      provider: options.provider || 'openai',
      model: options.model || 'gpt-4',
      effort: options.effort || 'normal'
    }
  }

  async init() {
    this.aiSystem = this.world.ai
    if (!this.aiSystem) {
      logger.warn('AI system not available')
      return
    }
    logger.info('AI client plugin initialized', { config: this.config })
  }

  async destroy() {
    this.aiSystem = null
    logger.info('AI client plugin destroyed')
  }

  getAPI() {
    return {
      configure: (config) => {
        if (!this.enabled) return false
        this.config = { ...this.config, ...config }
        if (this.aiSystem?.deserialize) {
          this.aiSystem.deserialize(this.config)
        }
        return true
      },

      createEntity: async (prompt) => {
        if (!this.enabled || !this.aiSystem) return null
        return this.aiSystem.create?.({ value: prompt }) || null
      },

      editEntity: async (prompt) => {
        if (!this.enabled || !this.aiSystem) return null
        return this.aiSystem.edit?.({ value: prompt }) || null
      },

      fixEntity: async () => {
        if (!this.enabled || !this.aiSystem) return null
        return this.aiSystem.fix?.() || null
      },

      isEnabled: () => {
        return this.enabled && this.aiSystem?.enabled
      },

      getConfig: () => {
        return { ...this.config }
      },

      getStatus: () => {
        return {
          enabled: this.enabled,
          aiEnabled: this.aiSystem?.enabled || false,
          provider: this.config.provider,
          model: this.config.model,
          effort: this.config.effort
        }
      }
    }
  }
}
