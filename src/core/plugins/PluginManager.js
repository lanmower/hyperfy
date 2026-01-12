import { BaseManager } from '../patterns/index.js'
import { PluginHookSystem } from './PluginHookSystem.js'
import { PluginManagerDependencies } from './PluginManagerDependencies.js'

export class PluginManager extends BaseManager {
  constructor() {
    super(null, 'PluginManager')
    this.plugins = new Map()
    this.hookSystem = new PluginHookSystem()
    this.dependencies = new PluginManagerDependencies()
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
    this.dependencies.cleanupPluginDependencies(name)

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
    return this.dependencies.registerAssetHandler(pluginName, type, handler, this.plugins, this.logger)
  }

  getAssetHandlers(type) {
    return this.dependencies.getAssetHandlers(type)
  }

  registerNetworkHandler(pluginName, messageType, handler) {
    return this.dependencies.registerNetworkHandler(pluginName, messageType, handler, this.plugins, this.logger)
  }

  getNetworkHandler(messageType) {
    return this.dependencies.getNetworkHandler(messageType)
  }

  registerScriptGlobal(pluginName, name, value) {
    return this.dependencies.registerScriptGlobal(pluginName, name, value, this.plugins, this.logger)
  }

  getScriptGlobals() {
    return this.dependencies.getScriptGlobals()
  }

  registerServerRoute(pluginName, path, method, handler) {
    return this.dependencies.registerServerRoute(pluginName, path, method, handler, this.plugins, this.logger)
  }

  getServerRoutes() {
    return this.dependencies.getServerRoutes()
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
    const handlers = this.dependencies.assetHandlers.size
    const networkHandlers = this.dependencies.networkHandlers.size
    const globals = this.dependencies.scriptGlobals.size
    const routes = this.dependencies.serverRoutes.size
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
    this.dependencies.clear()
  }
}

export const pluginManager = new PluginManager()
