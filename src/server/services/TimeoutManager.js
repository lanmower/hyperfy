import { BaseManager } from '../../core/patterns/index.js'
import { MasterConfig } from '../config/MasterConfig.js'

export class TimeoutManager extends BaseManager {
  constructor() {
    super(null, 'TimeoutManager')
    this.timeouts = {
      http: MasterConfig.network.requestTimeout,
      websocket: MasterConfig.network.inactivityTimeout,
      database: MasterConfig.network.databaseQueryTimeout,
      upload: MasterConfig.uploads.maxFileSize ? 120000 : 120000,
      fetch: MasterConfig.network.fetchDefaultTimeout,
    }
    this.timeoutStats = { total: 0, byType: {} }
  }

  async initInternal() {}

  setTimeouts(config) {
    if (!config || typeof config !== 'object') return
    const allowed = ['http', 'websocket', 'database', 'upload', 'fetch']
    for (const key of allowed) {
      if (config.hasOwnProperty(key) && typeof config[key] === 'number') {
        this.timeouts[key] = config[key]
      }
    }
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
    this.timeoutStats = { total: 0, byType: {} }
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

  async destroyInternal() {
    this.resetStats()
  }
}

export const globalTimeoutManager = new TimeoutManager()
