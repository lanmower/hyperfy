/**
 * BaseSystem - Enhanced System with built-in utilities
 *
 * Extends System with common patterns like handler registry, caching, and state management.
 * Provides a foundation for creating DRY, modular systems.
 *
 * Usage:
 *   class MySystem extends BaseSystem {
 *     getDefaultConfig() {
 *       return { enabled: true }
 *     }
 *
 *     getInitialState() {
 *       return { count: 0 }
 *     }
 *
 *     getHandlerMap() {
 *       return {
 *         'myEvent': 'handleMyEvent'
 *       }
 *     }
 *
 *     handleMyEvent(data) {
 *       this.setState({ count: this.state.count + 1 })
 *     }
 *
 *     async init() {
 *       await super.init()
 *       // Your init logic
 *     }
 *   }
 */

import { System } from './System.js'
import { withHandlerRegistry } from '../mixins/HandlerRegistryMixin.js'
import { withCacheable } from '../mixins/CacheableMixin.js'
import { withStateManager } from '../mixins/StateManagerMixin.js'

// Compose all mixins with System as the base
const SystemWithMixins = withStateManager(withCacheable(withHandlerRegistry(System)))

export class BaseSystem extends SystemWithMixins {
  constructor(world, config = {}) {
    super(world)

    // Initialize configuration
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    }

    // Mark as BaseSystem for instanceof checks
    this._isBaseSystem = true
  }

  /**
   * Override to provide default configuration
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {}
  }

  /**
   * Get a config value
   * @param {string} key - Config key
   * @param {any} defaultValue - Default if not found
   * @returns {any} Config value
   */
  getConfig(key, defaultValue = undefined) {
    return key in this.config ? this.config[key] : defaultValue
  }

  /**
   * Set a config value
   * @param {string} key - Config key
   * @param {any} value - Value to set
   */
  setConfig(key, value) {
    this.config[key] = value
  }

  /**
   * Check if system is enabled (from config)
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    return this.getConfig('enabled', true)
  }

  /**
   * Enable/disable system
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.setConfig('enabled', enabled)
  }

  /**
   * Log with system name prefix
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args)
  }

  /**
   * Log warning with system name prefix
   * @param {...any} args - Arguments to warn
   */
  warn(...args) {
    console.warn(`[${this.constructor.name}]`, ...args)
  }

  /**
   * Log error with system name prefix
   * @param {...any} args - Arguments to error
   */
  error(...args) {
    console.error(`[${this.constructor.name}]`, ...args)
  }

  /**
   * Get system metadata
   * @returns {Object} Metadata
   */
  getMetadata() {
    return {
      name: this.constructor.name,
      enabled: this.isEnabled(),
      config: this.config,
      state: this.getState(),
    }
  }

  /**
   * Reset system to initial state
   */
  reset() {
    this.resetState()
    this.invalidateCache()
  }
}
