import { StructuredLogger } from '../utils/logging/index.js'
import { pluginRegistry } from './PluginRegistry.js'
import { pluginHooks } from './PluginHooks.js'

const logger = new StructuredLogger('PluginAPI')

function validateHandler(fn, name = 'handler') {
  if (typeof fn !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}

function validateRoute(path, method, handler) {
  if (typeof path !== 'string' || typeof method !== 'string' || typeof handler !== 'function') {
    throw new Error('Invalid route configuration')
  }
}

function validateMessageHandler(type, fn) {
  if (typeof type !== 'string' || typeof fn !== 'function') {
    throw new Error('Invalid message handler')
  }
}

export class PluginAPI {
  constructor(world, pluginName) {
    this.world = world
    this.pluginName = pluginName
  }

  registerAssetHandler(type, handler) {
    try {
      validateHandler(handler, 'asset handler')
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName, type })
      return false
    }

    return pluginRegistry.registerAssetHandler(this.pluginName, type, handler)
  }

  registerNetworkMessage(messageType, handler) {
    try {
      validateMessageHandler(messageType, handler)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName, messageType })
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
    try {
      validateRoute(path, method, handler)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName, path, method })
      return false
    }

    return pluginRegistry.registerServerRoute(this.pluginName, path, method, handler)
  }

  onWorldInit(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('world:init', fn)
  }

  onWorldStart(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('world:start', fn)
  }

  onWorldUpdate(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.action('world:update', fn)
  }

  onEntityCreated(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.after('entity:created', fn)
  }

  onEntityDestroyed(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('entity:destroyed', fn)
  }

  onScriptError(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.after('script:error', fn)
  }

  onNetworkMessage(messageType, fn) {
    try {
      validateMessageHandler(messageType, fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName, messageType })
      return
    }

    return pluginHooks.before(`network:${messageType}`, fn)
  }

  filterAssetURL(fn) {
    try {
      validateHandler(fn, 'filter handler')
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.filter('asset:resolve', fn)
  }

  getSystem(name) {
    return this.world[name] || null
  }

  getAllSystems() {
    const systems = {}
    const registryKeys = Object.keys(this.world)
    for (const key of registryKeys) {
      if (this.world[key] && typeof this.world[key] === 'object') {
        systems[key] = this.world[key]
      }
    }
    return systems
  }

  registerGlobalFunction(name, fn) {
    try {
      validateHandler(fn, 'global function')
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName, name })
      return false
    }

    pluginRegistry.registerScriptGlobal(this.pluginName, name, fn)
    return true
  }

  onAssetResolve(fn) {
    try {
      validateHandler(fn, 'asset resolver')
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.filter('asset:resolve', fn)
  }

  onWorldDestroy(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }

    return pluginHooks.before('world:destroy', fn)
  }

  log(level, message, data) {
    const logFn = logger[level] || logger.info
    logFn(`[${this.pluginName}] ${message}`, data)
  }
}

export function createPluginAPI(world, pluginName) {
  return new PluginAPI(world, pluginName)
}
