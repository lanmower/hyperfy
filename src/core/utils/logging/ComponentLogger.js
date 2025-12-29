/**
 * @file Unified logging for all components
 */

/**
 * @class ComponentLogger
 * Provides consistent console logging with component name prefixes
 * @example
 * const logger = new ComponentLogger('EntitySpawner')
 * logger.error('Failed to spawn:', err)
 * logger.warn('Missing data')
 * logger.info('Created entity:', id)
 * logger.debug('Internal state:', state)
 */
export class ComponentLogger {
  /**
   * @param {string} name Component or module name
   */
  constructor(name) {
    this.name = name
  }

  /**
   * Log error with component prefix
   * @param {string} message
   * @param {Error|any} [data]
   */
  error(message, data = null) {
    if (data instanceof Error) {
      console.error(`[${this.name}]`, message, data.message)
    } else if (data) {
      console.error(`[${this.name}]`, message, data)
    } else {
      console.error(`[${this.name}]`, message)
    }
  }

  /**
   * Log warning with component prefix
   * @param {string} message
   * @param {any} [data]
   */
  warn(message, data = null) {
    if (data) {
      console.warn(`[${this.name}]`, message, data)
    } else {
      console.warn(`[${this.name}]`, message)
    }
  }

  /**
   * Log info with component prefix
   * @param {string} message
   * @param {any} [data]
   */
  info(message, data = null) {
    if (data) {
      console.log(`[${this.name}]`, message, data)
    } else {
      console.log(`[${this.name}]`, message)
    }
  }

  /**
   * Log debug message (only if DEBUG env var is set)
   * @param {string} message
   * @param {any} [data]
   */
  debug(message, data = null) {
    if (process.env.DEBUG === 'true') {
      if (data) {
        console.log(`[${this.name}] DEBUG:`, message, data)
      } else {
        console.log(`[${this.name}] DEBUG:`, message)
      }
    }
  }
}

export default ComponentLogger
