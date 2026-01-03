import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('PluginRegistry')

export class PluginRegistryStorage {
  constructor() {
    this.plugins = new Map()
    this.assetHandlers = new Map()
    this.networkHandlers = new Map()
    this.scriptGlobals = new Map()
    this.serverRoutes = new Map()
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      logger.warn('Plugin already registered', { name })
      return false
    }

    if (!plugin || typeof plugin !== 'object') {
      logger.error('Invalid plugin object', { name })
      return false
    }

    this.plugins.set(name, {
      name,
      version: plugin.version || '1.0.0',
      init: plugin.init || (() => {}),
      start: plugin.start || (() => {}),
      destroy: plugin.destroy || (() => {}),
      api: plugin.api || null,
    })

    logger.info('Plugin registered', { name, version: plugin.version })
    return true
  }

  unregister(name) {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    plugin.destroy?.()
    this.plugins.delete(name)

    this.assetHandlers.forEach((handlers, type) => {
      if (handlers.has(name)) {
        handlers.delete(name)
      }
    })

    this.networkHandlers.forEach((handlers, msg) => {
      if (handlers.has(name)) {
        handlers.delete(name)
      }
    })

    this.scriptGlobals.forEach((values, id) => {
      if (values.plugin === name) {
        this.scriptGlobals.delete(id)
      }
    })

    this.serverRoutes.forEach((routes, path) => {
      if (routes.plugin === name) {
        this.serverRoutes.delete(path)
      }
    })

    logger.info('Plugin unregistered', { name })
    return true
  }

  getPlugin(name) {
    return this.plugins.get(name)
  }

  getAllPlugins() {
    return Array.from(this.plugins.values())
  }

  registerAssetHandler(pluginName, type, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error('Plugin not registered', { pluginName })
      return false
    }

    if (!this.assetHandlers.has(type)) {
      this.assetHandlers.set(type, new Map())
    }

    this.assetHandlers.get(type).set(pluginName, handler)
    logger.info('Asset handler registered', { pluginName, type })
    return true
  }

  getAssetHandlers(type) {
    const handlers = this.assetHandlers.get(type)
    if (!handlers) return []
    return Array.from(handlers.values())
  }

  registerNetworkHandler(pluginName, messageType, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error('Plugin not registered', { pluginName })
      return false
    }

    if (!this.networkHandlers.has(messageType)) {
      this.networkHandlers.set(messageType, new Map())
    }

    this.networkHandlers.get(messageType).set(pluginName, handler)
    logger.info('Network handler registered', { pluginName, messageType })
    return true
  }

  getNetworkHandler(messageType) {
    const handlers = this.networkHandlers.get(messageType)
    if (!handlers || handlers.size === 0) return null
    return handlers.values().next().value
  }

  registerScriptGlobal(pluginName, name, value) {
    if (!this.plugins.has(pluginName)) {
      logger.error('Plugin not registered', { pluginName })
      return false
    }

    const id = `${pluginName}:${name}`
    this.scriptGlobals.set(id, {
      name,
      value,
      plugin: pluginName,
    })

    logger.info('Script global registered', { pluginName, name })
    return true
  }

  getScriptGlobals() {
    const globals = {}
    this.scriptGlobals.forEach(({ name, value }) => {
      globals[name] = value
    })
    return globals
  }

  registerServerRoute(pluginName, path, method, handler) {
    if (!this.plugins.has(pluginName)) {
      logger.error('Plugin not registered', { pluginName })
      return false
    }

    const key = `${method}:${path}`
    this.serverRoutes.set(key, {
      path,
      method: method.toUpperCase(),
      handler,
      plugin: pluginName,
    })

    logger.info('Server route registered', { pluginName, path, method })
    return true
  }

  getServerRoutes() {
    return Array.from(this.serverRoutes.values())
  }

  getPluginStats() {
    const all = this.plugins.size
    const handlers = this.assetHandlers.size
    const networkHandlers = this.networkHandlers.size
    const globals = this.scriptGlobals.size
    const routes = this.serverRoutes.size

    return {
      totalPlugins: all,
      assetHandlers: handlers,
      networkHandlers,
      scriptGlobals: globals,
      serverRoutes: routes
    }
  }

  isPluginLoaded(name) {
    return this.plugins.has(name)
  }

  isPluginEnabled(name) {
    const plugin = this.plugins.get(name)
    return plugin?.api?.enabled !== false
  }
}
