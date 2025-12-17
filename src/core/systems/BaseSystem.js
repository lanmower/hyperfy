
import { System } from './System.js'
import { withHandlerRegistry } from '../mixins/HandlerRegistryMixin.js'
import { withCacheable } from '../mixins/CacheableMixin.js'
import { withStateManager } from '../mixins/StateManagerMixin.js'

const SystemWithMixins = withStateManager(withCacheable(withHandlerRegistry(System)))

export class BaseSystem extends SystemWithMixins {
  constructor(world, config = {}) {
    super(world)

    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    }

    this._isBaseSystem = true
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

  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args)
  }

  warn(...args) {
    console.warn(`[${this.constructor.name}]`, ...args)
  }

  error(...args) {
    console.error(`[${this.constructor.name}]`, ...args)
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
}
