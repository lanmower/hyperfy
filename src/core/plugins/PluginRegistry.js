import { PluginRegistryStorage } from './PluginRegistryStorage.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('PluginRegistry')

export class PluginRegistry {
  constructor() {
    this.storage = new PluginRegistryStorage()
    this.hooks = new Map()
  }

  register(name, plugin) {
    return this.storage.register(name, plugin)
  }

  unregister(name) {
    return this.storage.unregister(name)
  }

  getPlugin(name) {
    return this.storage.getPlugin(name)
  }

  getAllPlugins() {
    return this.storage.getAllPlugins()
  }

  registerAssetHandler(pluginName, type, handler) {
    return this.storage.registerAssetHandler(pluginName, type, handler)
  }

  getAssetHandlers(type) {
    return this.storage.getAssetHandlers(type)
  }

  registerNetworkHandler(pluginName, messageType, handler) {
    return this.storage.registerNetworkHandler(pluginName, messageType, handler)
  }

  getNetworkHandler(messageType) {
    return this.storage.getNetworkHandler(messageType)
  }

  registerScriptGlobal(pluginName, name, value) {
    return this.storage.registerScriptGlobal(pluginName, name, value)
  }

  getScriptGlobals() {
    return this.storage.getScriptGlobals()
  }

  registerServerRoute(pluginName, path, method, handler) {
    return this.storage.registerServerRoute(pluginName, path, method, handler)
  }

  getServerRoutes() {
    return this.storage.getServerRoutes()
  }

  hook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, [])
    }
    this.hooks.get(name).push(fn)
    return () => {
      const hooks = this.hooks.get(name)
      const idx = hooks.indexOf(fn)
      if (idx !== -1) hooks.splice(idx, 1)
    }
  }

  async execute(name, ...args) {
    const hooks = this.hooks.get(name) || []
    for (const fn of hooks) {
      try {
        await Promise.resolve(fn(...args))
      } catch (error) {
        logger.error('Hook execution error', { hook: name, error: error.message })
      }
    }
  }

  listAllPlugins() {
    const list = []
    this.storage.plugins.forEach((plugin, name) => {
      list.push({
        name,
        version: plugin.version,
        enabled: plugin.enabled || false
      })
    })
    return list
  }

  getPluginStats() {
    return this.storage.getPluginStats()
  }

  isPluginLoaded(name) {
    return this.storage.isPluginLoaded(name)
  }

  isPluginEnabled(name) {
    return this.storage.isPluginEnabled(name)
  }
}

export const pluginRegistry = new PluginRegistry()
