import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('TimeoutManager')

export class TimeoutManager {
  constructor(defaultTimeout = 30000) {
    this.defaultTimeout = defaultTimeout
    this.timeouts = {
      fetch: 30000,
      websocket: 60000,
    }
    this.stats = {
      total: 0,
      byType: {},
    }
  }

  recordTimeout(type, url = 'unknown') {
    this.stats.total++
    if (!this.stats.byType[type]) {
      this.stats.byType[type] = { count: 0, urls: {} }
    }
    this.stats.byType[type].count++
    if (!this.stats.byType[type].urls[url]) {
      this.stats.byType[type].urls[url] = 0
    }
    this.stats.byType[type].urls[url]++
    logger.error('Operation timeout', { type, url })
  }

  getStats() {
    return JSON.parse(JSON.stringify(this.stats))
  }

  resetStats() {
    this.stats = {
      total: 0,
      byType: {},
    }
  }

  async fetchWithTimeout(url, options = {}, timeout = null) {
    const timeoutMs = timeout || this.timeouts.fetch
    const controller = new AbortController()
    const signal = controller.signal

    const timeoutId = setTimeout(() => {
      controller.abort()
      this.recordTimeout('fetch', url)
    }, timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`[TIMEOUT] Fetch request timed out after ${timeoutMs}ms`)
        timeoutError.code = 'TIMEOUT'
        timeoutError.url = url
        throw timeoutError
      }
      throw error
    }
  }

  wrapPromise(promise, timeout, type = 'fetch', identifier = 'unknown') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.recordTimeout(type, identifier)
        const error = new Error(`[TIMEOUT] Operation timed out after ${timeout}ms`)
        error.code = 'TIMEOUT'
        error.type = type
        error.identifier = identifier
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
}

export const clientTimeoutManager = new TimeoutManager()
