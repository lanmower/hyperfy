import { StructuredLogger } from '../logging/index.js'
import { ValidationHelper } from './ValidationHelper.js'

const logger = new StructuredLogger('APIMethodWrapper')

export class APIMethodWrapper {
  /**
   * Wraps a function with try-catch, error logging, and null-on-error handling
   * Use for methods that do NOT require entity validation
   * @param {Function} fn - The function to wrap, receives (...args)
   * @param {Object} options - Configuration options
   * @param {string} options.module - Module name for logging (e.g., 'WorldAPIConfig')
   * @param {string} options.method - Method name for logging (defaults to fn.name)
   * @param {*} options.defaultReturn - Value to return on error (defaults to null)
   * @returns {Function} Wrapped function that handles errors gracefully
   */
  static wrap(fn, options = {}) {
    const { module = '', method = fn.name || 'unknown', defaultReturn = null } = options

    return (...args) => {
      try {
        return fn(...args)
      } catch (e) {
        logger.error('API method execution failed', { module, method, error: e.message })
        return defaultReturn
      }
    }
  }

  /**
   * Wraps a function with entity validation, try-catch, error logging
   * Use for app methods that require entity.data.id validation
   * @param {Function} fn - The function to wrap, receives (apps, entity, ...args)
   * @param {Object} options - Configuration options
   * @param {string} options.module - Module name for logging (e.g., 'AppAPIConfig')
   * @param {string} options.method - Method name for logging (defaults to fn.name)
   * @param {string} options.operation - Operation name for validation context
   * @param {*} options.defaultReturn - Value to return on error (defaults to null)
   * @returns {Function} Wrapped function with automatic entity validation
   */
  static wrapWithValidation(fn, options = {}) {
    const {
      module = '',
      method = fn.name || 'unknown',
      operation = method,
      defaultReturn = null
    } = options

    return (apps, entity, ...args) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation })
        return fn(apps, entity, ...args)
      } catch (e) {
        logger.error('Validated method execution failed', { module, method, error: e.message })
        return defaultReturn
      }
    }
  }

  /**
   * Wraps a getter function with entity validation and default return
   * Use for getter methods that should return specific type on error
   * @param {Function} fn - Getter function (apps, entity) => value
   * @param {Object} options - Configuration options
   * @param {string} options.module - Module name for logging
   * @param {string} options.method - Method name for logging
   * @param {string} options.operation - Operation name for validation
   * @param {*} options.defaultReturn - Value to return on error
   * @returns {Function} Wrapped getter function
   */
  static wrapGetter(fn, options = {}) {
    const {
      module = '',
      method = fn.name || 'unknown',
      operation = `get ${method}`,
      defaultReturn = null
    } = options

    return (apps, entity) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation })
        return fn(apps, entity)
      } catch (e) {
        logger.error('Getter execution failed', { module, method, error: e.message })
        return defaultReturn
      }
    }
  }

  /**
   * Wraps a setter function with entity validation
   * Use for setter methods that don't return values
   * @param {Function} fn - Setter function (apps, entity, value) => void
   * @param {Object} options - Configuration options
   * @param {string} options.module - Module name for logging
   * @param {string} options.method - Method name for logging
   * @param {string} options.operation - Operation name for validation
   * @returns {Function} Wrapped setter function
   */
  static wrapSetter(fn, options = {}) {
    const {
      module = '',
      method = fn.name || 'unknown',
      operation = `set ${method}`
    } = options

    return (apps, entity, value) => {
      try {
        ValidationHelper.assertEntityValid(entity, { operation })
        return fn(apps, entity, value)
      } catch (e) {
        logger.error('Setter execution failed', { module, method, error: e.message })
      }
    }
  }

  /**
   * Wraps a method without entity validation (for world-level methods)
   * Use for methods that work with apps.world but not specific entity
   * @param {Function} fn - The function to wrap, receives (apps, entity, ...args)
   * @param {Object} options - Configuration options
   * @param {string} options.module - Module name for logging
   * @param {string} options.method - Method name for logging
   * @param {*} options.defaultReturn - Value to return on error
   * @returns {Function} Wrapped function without entity validation
   */
  static wrapMethod(fn, options = {}) {
    const {
      module = '',
      method = fn.name || 'unknown',
      defaultReturn = null
    } = options

    return (apps, entity, ...args) => {
      try {
        return fn(apps, entity, ...args)
      } catch (e) {
        logger.error('Wrapped method execution failed', { module, method, error: e.message })
        return defaultReturn
      }
    }
  }
}

export default APIMethodWrapper
