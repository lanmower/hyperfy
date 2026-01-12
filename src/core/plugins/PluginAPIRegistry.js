import { pluginRegistry } from './PluginRegistry.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { validateHandler, validateRoute, validateMessageHandler } from './PluginAPIValidators.js'

const logger = new StructuredLogger('PluginAPI')

export class PluginAPIRegistry {
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
}
