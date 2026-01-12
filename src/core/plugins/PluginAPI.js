import { StructuredLogger } from '../utils/logging/index.js'
import { PluginAPIHooks } from './PluginAPIHooks.js'
import { PluginAPIRegistry } from './PluginAPIRegistry.js'

const logger = new StructuredLogger('PluginAPI')

export class PluginAPI extends PluginAPIHooks {
  constructor(world, pluginName) {
    super(world, pluginName)
    this.registry = new PluginAPIRegistry(world, pluginName)
  }

  registerAssetHandler(type, handler) {
    return this.registry.registerAssetHandler(type, handler)
  }

  registerNetworkMessage(messageType, handler) {
    return this.registry.registerNetworkMessage(messageType, handler)
  }

  registerScriptGlobal(name, value) {
    return this.registry.registerScriptGlobal(name, value)
  }

  registerServerRoute(path, method, handler) {
    return this.registry.registerServerRoute(path, method, handler)
  }

  registerGlobalFunction(name, fn) {
    return this.registry.registerGlobalFunction(name, fn)
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

  log(level, message, data) {
    const logFn = logger[level] || logger.info
    logFn(`[${this.pluginName}] ${message}`, data)
  }
}

export function createPluginAPI(world, pluginName) {
  return new PluginAPI(world, pluginName)
}
