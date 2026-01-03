import { BaseManager } from '../patterns/index.js'
import { PluginHookSystem } from './PluginHookSystem.js'

export class PluginManager extends BaseManager {
  constructor() {
    super(null, 'PluginManager')
    this.plugins = new Map()
    this.hookSystem = new PluginHookSystem()
    this.assetHandlers = new Map()
    this.networkHandlers = new Map()
    this.scriptGlobals = new Map()
    this.serverRoutes = new Map()
  }

  get hooks() {
    return this.hookSystem.hooks
  }

  register(name, plugin) {
    if (this.plugins.has(name)) {
      this.logger.warn('Plugin already registered', { name })
      return false
    }

    if (!plugin || typeof plugin !== 'object') {
      this.logger.error('Invalid plugin object', { name })
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

    this.logger.info('Plugin registered', { name, version: plugin.version })
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

    this.logger.info('Plugin unregistered', { name })
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
      this.logger.error('Plugin not registered', { pluginName })
      return false
    }

    if (!this.assetHandlers.has(type)) {
      this.assetHandlers.set(type, new Map())
    }

    this.assetHandlers.get(type).set(pluginName, handler)
    this.logger.info('Asset handler registered', { pluginName, type })
    return true
  }

  getAssetHandlers(type) {
    const handlers = this.assetHandlers.get(type)
    if (!handlers) return []
    return Array.from(handlers.values())
  }

  registerNetworkHandler(pluginName, messageType, handler) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error('Plugin not registered', { pluginName })
      return false
    }

    if (!this.networkHandlers.has(messageType)) {
      this.networkHandlers.set(messageType, new Map())
    }

    this.networkHandlers.get(messageType).set(pluginName, handler)
    this.logger.info('Network handler registered', { pluginName, messageType })
    return true
  }

  getNetworkHandler(messageType) {
    const handlers = this.networkHandlers.get(messageType)
    if (!handlers || handlers.size === 0) return null
    return handlers.values().next().value
  }

  registerScriptGlobal(pluginName, name, value) {
    if (!this.plugins.has(pluginName)) {
      this.logger.error('Plugin not registered', { pluginName })
      return false
    }

    const id = `${pluginName}:${name}`
    this.scriptGlobals.set(id, {
      name,
      value,
      plugin: pluginName,
    })

    this.logger.info('Script global registered', { pluginName, name })
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
      this.logger.error('Plugin not registered', { pluginName })
      return false
    }

    const key = `${method}:${path}`
    this.serverRoutes.set(key, {
      path,
      method: method.toUpperCase(),
      handler,
      plugin: pluginName,
    })

    this.logger.info('Server route registered', { pluginName, path, method })
    return true
  }

  getServerRoutes() {
    return Array.from(this.serverRoutes.values())
  }

  registerHook(name, type = 'action') {
    return this.hookSystem.registerHook(name, type)
  }

  before(hook, fn) {
    return this.hookSystem.before(hook, fn)
  }

  after(hook, fn) {
    return this.hookSystem.after(hook, fn)
  }

  filter(hook, fn) {
    return this.hookSystem.filter(hook, fn)
  }

  action(hook, fn) {
    return this.hookSystem.action(hook, fn)
  }

  async executeHook(hook, ...args) {
    return this.hookSystem.executeHook(hook, ...args)
  }

  hook(name, fn) {
    return this.hookSystem.hook(name, fn)
  }

  async execute(name, ...args) {
    return this.hookSystem.execute(name, ...args)
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
    return this.hookSystem.getHooks()
  }

  getHookDetails(name) {
    return this.hookSystem.getHookDetails(name)
  }

  getAllHooks() {
    return this.hookSystem.getAllHooks()
  }

  getHookCount(name) {
    return this.hookSystem.getHookCount(name)
  }

  hasHook(name) {
    return this.hookSystem.hasHook(name)
  }

  async initInternal() {
  }

  async destroyInternal() {
    for (const plugin of this.plugins.values()) {
      plugin.destroy?.()
    }
    this.plugins.clear()
    this.hookSystem.clear()
    this.assetHandlers.clear()
    this.networkHandlers.clear()
    this.scriptGlobals.clear()
    this.serverRoutes.clear()
  }
}

export const pluginManager = new PluginManager()
