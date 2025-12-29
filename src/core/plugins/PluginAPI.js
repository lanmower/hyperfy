import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { pluginRegistry } from './PluginRegistry.js'
import { pluginHooks } from './PluginHooks.js'

const logger = new ComponentLogger('PluginAPI')

export class PluginAPI {
  constructor(world, pluginName) {
    this.world = world
    this.pluginName = pluginName
  }

  registerAssetHandler(type, handler) {
    if (typeof handler !== 'function') {
      logger.error('Invalid asset handler', { plugin: this.pluginName, type })
      return false
    }

    return pluginRegistry.registerAssetHandler(this.pluginName, type, handler)
  }

  registerNetworkMessage(messageType, handler) {
    if (typeof handler !== 'function') {
      logger.error('Invalid network handler', { plugin: this.pluginName, messageType })
      return false
    }

    return pluginRegistry.registerNetworkHandler(this.pluginName, messageType, handler)
  }

  registerScriptGlobal(name, value) {
    if (typeof name !== 'string') {
      logger.error('Invalid global name', { plugin: this.pluginName })
      return false
    }

    return pluginRegistry.registerScriptGlobal(this.pluginName, name, value)
  }

  registerServerRoute(path, method, handler) {
    if (typeof path !== 'string' || typeof method !== 'string' || typeof handler !== 'function') {
      logger.error('Invalid server route', { plugin: this.pluginName, path, method })
      return false
    }

    return pluginRegistry.registerServerRoute(this.pluginName, path, method, handler)
  }

  onWorldInit(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('world:init', fn)
  }

  onWorldStart(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('world:start', fn)
  }

  onWorldUpdate(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.action('world:update', fn)
  }

  onEntityCreated(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.after('entity:created', fn)
  }

  onEntityDestroyed(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('entity:destroyed', fn)
  }

  onScriptError(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid hook handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.after('script:error', fn)
  }

  onNetworkMessage(messageType, fn) {
    if (typeof messageType !== 'string' || typeof fn !== 'function') {
      logger.error('Invalid network hook', { plugin: this.pluginName, messageType })
      return
    }

    return pluginHooks.before(`network:${messageType}`, fn)
  }

  filterAssetURL(fn) {
    if (typeof fn !== 'function') {
      logger.error('Invalid filter handler', { plugin: this.pluginName })
      return
    }

    return pluginHooks.filter('asset:resolve', fn)
  }

  getSystem(name) {
    return this.world.serviceLocator?.get(name) || this.world[name]
  }

  getService(name) {
    try {
      return this.world.di?.get(name)
    } catch {
      return null
    }
  }

  log(level, message, data) {
    const logFn = logger[level] || logger.info
    logFn(`[${this.pluginName}] ${message}`, data)
  }
}

export function createPluginAPI(world, pluginName) {
  return new PluginAPI(world, pluginName)
}
