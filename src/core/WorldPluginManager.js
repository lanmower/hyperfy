import { StructuredLogger } from './utils/logging/index.js'
import { createPluginAPI } from './plugins/index.js'

const logger = new StructuredLogger('WorldPluginManager')

export class WorldPluginManager {
  constructor(world) {
    this.world = world
  }

  async initializePlugins(pluginList = []) {
    for (const pluginConfig of pluginList) {
      const { name, plugin } = pluginConfig
      if (!plugin) continue

      const api = createPluginAPI(this.world, name)
      plugin.api = api

      try {
        if (plugin.init) {
          await Promise.resolve(plugin.init(api))
        }
        this.world.pluginRegistry.register(name, plugin)
        logger.info('Plugin loaded', { name, version: plugin.version })
      } catch (error) {
        logger.error('Plugin initialization failed', { name, error: error.message })
      }
    }
  }

  getPlugin(name) {
    return this.world.pluginRegistry.getPlugin(name)
  }

  listPlugins() {
    return this.world.pluginRegistry.listAllPlugins()
  }

  getPluginStats() {
    return this.world.pluginRegistry.getPluginStats()
  }

  isPluginLoaded(name) {
    return this.world.pluginRegistry.isPluginLoaded(name)
  }

  getPluginAPI(name) {
    const plugin = this.world.pluginRegistry.getPlugin(name)
    return plugin?.api || null
  }

  getAllHooks() {
    return this.world.pluginHooks.getAllHooks()
  }

  getHookCount(name) {
    return this.world.pluginHooks.getHookCount(name)
  }

  async loadDefaultPlugins() {
    const { createDefaultPlugins } = await import('./plugins/defaultPlugins.js')
    const plugins = createDefaultPlugins(this.world)
    await this.initializePlugins(plugins)
    return plugins
  }

  isPluginEnabled(name) {
    return this.world.pluginRegistry.isPluginEnabled(name)
  }

  enablePlugin(name) {
    const plugin = this.world.pluginRegistry.getPlugin(name)
    if (plugin?.enable) {
      plugin.enable()
      return true
    }
    return false
  }

  disablePlugin(name) {
    const plugin = this.world.pluginRegistry.getPlugin(name)
    if (plugin?.disable) {
      plugin.disable()
      return true
    }
    return false
  }
}
