import { BaseManager } from '../../core/patterns/index.js'

export class TimeoutManager extends BaseManager {
  constructor() {
    super(null, 'TimeoutManager')
    this.timeouts = {
      http: 30000,
      websocket: 60000,
      database: 30000,
      upload: 120000,
      fetch: 30000,
    }
    this.timeoutStats = {
      total: 0,
      byType: {},
    }
  }

  setTimeouts(config) {
    Object.assign(this.timeouts, config)
  }

  getTimeout(type) {
    return this.timeouts[type] || this.timeouts.http
  }

  recordTimeout(type, operation = 'unknown') {
    this.timeoutStats.total++
    if (!this.timeoutStats.byType[type]) {
      this.timeoutStats.byType[type] = { count: 0, operations: {} }
    }
    this.timeoutStats.byType[type].count++
    if (!this.timeoutStats.byType[type].operations[operation]) {
      this.timeoutStats.byType[type].operations[operation] = 0
    }
    this.timeoutStats.byType[type].operations[operation]++
  }

  getStats() {
    return {
      timeouts: { ...this.timeouts },
      stats: JSON.parse(JSON.stringify(this.timeoutStats)),
    }
  }

  resetStats() {
    this.timeoutStats = {
      total: 0,
      byType: {},
    }
  }

  wrapPromise(promise, timeout, type = 'http', operation = 'unknown') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.recordTimeout(type, operation)
        const error = new Error(`[TIMEOUT] Operation timed out after ${timeout}ms`)
        error.code = 'TIMEOUT'
        error.timeoutType = type
        error.operation = operation
        reject(error)
      }, timeout)

      promise
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(err => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }

  async withTimeout(fn, timeout, type = 'http', operation = 'unknown') {
    return this.wrapPromise(fn(), timeout, type, operation)
  }
}

export const globalTimeoutManager = new TimeoutManager()
