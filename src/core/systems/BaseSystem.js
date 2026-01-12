
import { System } from './System.js'
import { withHandlerRegistry } from '../mixins/HandlerRegistryMixin.js'
import { withCacheable } from '../mixins/CacheableMixin.js'
import { withStateManager } from '../mixins/StateManagerMixin.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { EventListenerManager } from './EventListenerManager.js'

const SystemWithMixins = withStateManager(withCacheable(withHandlerRegistry(System)))

export class BaseSystem extends SystemWithMixins {
  constructor(world, config = {}) {
    super(world)

    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    }

    this._isBaseSystem = true
    this.logger = new StructuredLogger(this.constructor.name)
    this.listeners = new EventListenerManager(this)
  }

  getDefaultConfig() {
    return {}
  }

  getConfig(key, defaultValue = undefined) {
    return key in this.config ? this.config[key] : defaultValue
  }

  setConfig(key, value) {
    this.config[key] = value
  }

  isEnabled() {
    return this.getConfig('enabled', true)
  }

  setEnabled(enabled) {
    this.setConfig('enabled', enabled)
  }

  log(message, context = {}) {
    this.logger.info(message, context)
  }

  warn(message, context = {}) {
    this.logger.warn(message, context)
  }

  error(message, context = {}) {
    this.logger.error(message, context)
  }

  getMetadata() {
    return {
      name: this.constructor.name,
      enabled: this.isEnabled(),
      config: this.config,
      state: this.getState(),
    }
  }

  reset() {
    this.resetState()
    this.invalidateCache()
  }

  destroy() {
    this.listeners.clear()
    super.destroy?.()
  }
}
