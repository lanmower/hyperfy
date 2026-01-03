export class PluginManagerDependencies {
  constructor() {
    this.assetHandlers = new Map()
    this.networkHandlers = new Map()
    this.scriptGlobals = new Map()
    this.serverRoutes = new Map()
  }

  registerAssetHandler(pluginName, type, handler, pluginsMap, logger) {
    if (!pluginsMap.has(pluginName)) {
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

  registerNetworkHandler(pluginName, messageType, handler, pluginsMap, logger) {
    if (!pluginsMap.has(pluginName)) {
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

  registerScriptGlobal(pluginName, name, value, pluginsMap, logger) {
    if (!pluginsMap.has(pluginName)) {
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

  registerServerRoute(pluginName, path, method, handler, pluginsMap, logger) {
    if (!pluginsMap.has(pluginName)) {
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

  cleanupPluginDependencies(pluginName) {
    this.assetHandlers.forEach((handlers, type) => {
      if (handlers.has(pluginName)) {
        handlers.delete(pluginName)
      }
    })

    this.networkHandlers.forEach((handlers, msg) => {
      if (handlers.has(pluginName)) {
        handlers.delete(pluginName)
      }
    })

    this.scriptGlobals.forEach((values, id) => {
      if (values.plugin === pluginName) {
        this.scriptGlobals.delete(id)
      }
    })

    this.serverRoutes.forEach((routes, path) => {
      if (routes.plugin === pluginName) {
        this.serverRoutes.delete(path)
      }
    })
  }

  clear() {
    this.assetHandlers.clear()
    this.networkHandlers.clear()
    this.scriptGlobals.clear()
    this.serverRoutes.clear()
  }
}
