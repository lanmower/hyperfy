import { pluginRegistry } from './PluginRegistry.js'
import { pluginHooks } from './PluginHooks.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { validateHandler, validateMessageHandler } from './PluginAPIValidators.js'

const logger = new StructuredLogger('PluginAPI')

export class PluginAPIHooks {
  constructor(world, pluginName) {
    this.world = world
    this.pluginName = pluginName
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

  onWorldDestroy(fn) {
    try {
      validateHandler(fn)
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }
    return pluginHooks.before('world:destroy', fn)
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

  onAssetResolve(fn) {
    try {
      validateHandler(fn, 'asset resolver')
    } catch (err) {
      logger.error(err.message, { plugin: this.pluginName })
      return
    }
    return pluginHooks.filter('asset:resolve', fn)
  }
}
