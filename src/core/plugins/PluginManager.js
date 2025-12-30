import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('PluginManager')

export class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.hooks = new Map()
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

  registerHook(name, type = 'action') {
    if (this.hooks.has(name)) {
      logger.warn('Hook already registered', { name })
      return
    }

    this.hooks.set(name, {
      name,
      type,
      before: [],
      action: [],
      after: [],
      filters: [],
    })
  }

  before(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.before.push(fn)

    return () => {
      const idx = hookData.before.indexOf(fn)
      if (idx !== -1) hookData.before.splice(idx, 1)
    }
  }

  after(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.after.push(fn)

    return () => {
      const idx = hookData.after.indexOf(fn)
      if (idx !== -1) hookData.after.splice(idx, 1)
    }
  }

  filter(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.filters.push(fn)

    return () => {
      const idx = hookData.filters.indexOf(fn)
      if (idx !== -1) hookData.filters.splice(idx, 1)
    }
  }

  action(hook, fn) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return
    }

    hookData.action.push(fn)

    return () => {
      const idx = hookData.action.indexOf(fn)
      if (idx !== -1) hookData.action.splice(idx, 1)
    }
  }

  async executeHook(hook, ...args) {
    const hookData = this.hooks.get(hook)
    if (!hookData) {
      logger.warn('Hook does not exist', { hook })
      return args[0]
    }

    try {
      for (const fn of hookData.before) {
        await Promise.resolve(fn(...args))
      }

      let result = args[0]
      for (const fn of hookData.filters) {
        result = await Promise.resolve(fn(result, ...args.slice(1)))
      }

      for (const fn of hookData.action) {
        await Promise.resolve(fn(result, ...args.slice(1)))
      }

      for (const fn of hookData.after) {
        await Promise.resolve(fn(result, ...args.slice(1)))
      }

      return result
    } catch (error) {
      logger.error('Hook execution error', { hook, error: error.message })
      throw error
    }
  }

  hook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, {
        name,
        type: 'action',
        before: [],
        action: [],
        after: [],
        filters: [],
      })
    }
    this.hooks.get(name).action.push(fn)
    return () => {
      const hooks = this.hooks.get(name)
      const idx = hooks.action.indexOf(fn)
      if (idx !== -1) hooks.action.splice(idx, 1)
    }
  }

  async execute(name, ...args) {
    const hooks = this.hooks.get(name)
    if (!hooks) return

    for (const fn of hooks.action) {
      try {
        await Promise.resolve(fn(...args))
      } catch (error) {
        logger.error('Hook execution error', { hook: name, error: error.message })
      }
    }
  }

  listAllPlugins() {
    const list = []
    this.plugins.forEach((plugin, name) => {
      list.push({
        name,
        version: plugin.version,
        enabled: plugin.enabled || false
      })
    })
    return list
  }

  getPluginStats() {
    const all = this.plugins.size
    const handlers = this.assetHandlers.size
    const networkHandlers = this.networkHandlers.size
    const globals = this.scriptGlobals.size
    const routes = this.serverRoutes.size
    const hooks = this.hooks.size

    return {
      totalPlugins: all,
      assetHandlers: handlers,
      networkHandlers,
      scriptGlobals: globals,
      serverRoutes: routes,
      hooks
    }
  }

  isPluginLoaded(name) {
    return this.plugins.has(name)
  }

  isPluginEnabled(name) {
    const plugin = this.plugins.get(name)
    return plugin?.api?.enabled !== false
  }

  getHooks() {
    return Array.from(this.hooks.keys())
  }

  getHookDetails(name) {
    const hook = this.hooks.get(name)
    if (!hook) return null

    return {
      name: hook.name,
      type: hook.type,
      beforeCount: hook.before.length,
      afterCount: hook.after.length,
      filterCount: hook.filters.length,
      actionCount: hook.action.length,
    }
  }

  getAllHooks() {
    const hooks = []
    this.hooks.forEach((hook, name) => {
      hooks.push({
        name,
        type: hook.type,
        handlers: hook.before.length + hook.after.length + hook.action.length + hook.filters.length
      })
    })
    return hooks
  }

  getHookCount(name) {
    const hook = this.hooks.get(name)
    if (!hook) return 0
    return hook.before.length + hook.after.length + hook.action.length + hook.filters.length
  }

  hasHook(name) {
    return this.hooks.has(name)
  }
}

export const pluginManager = new PluginManager()
