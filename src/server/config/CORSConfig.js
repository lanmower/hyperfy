import { BaseManager } from '../../core/patterns/BaseManager.js'

export class CORSConfig extends BaseManager {
  constructor() {
    super(null, 'CORSConfig')
    this.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    this.allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Admin-Code',
      'X-Request-ID',
      'Accept',
      'Origin',
      'Referer',
      'User-Agent',
    ]
    this.exposedHeaders = [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Response-Time',
      'X-Request-ID',
    ]
    this.credentials = true
    this.preflightCacheDuration = 3600
    this.rejectedRequests = []
    this.acceptedRequests = []
    this.maxLogSize = 100
  }

  async initInternal() {
    this.allowedOrigins = this.parseAllowedOrigins()
  }

  async destroyInternal() {
    this.rejectedRequests = []
    this.acceptedRequests = []
  }

  parseAllowedOrigins() {
    const env = process.env.NODE_ENV || 'development'
    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS

    if (corsOrigins) {
      return corsOrigins.split(',').filter(o => o.trim()).map(o => o.trim())
    }

    if (env === 'production') {
      return []
    }

    if (env === 'staging') {
      return [
        /^https?:\/\/.*\.staging\.hyperfy\.io$/,
        /^https?:\/\/staging\.hyperfy\.io$/,
      ]
    }

    return [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/\[::1\](:\d+)?$/,
    ]
  }

  isOriginAllowed(origin) {
    if (!origin) {
      const env = process.env.NODE_ENV || 'development'
      const isDev = env === 'development'
      if (isDev && this.logger) {
        this.logger.debug('[CORS] Allowing undefined origin in development')
      }
      return isDev
    }

    for (const allowed of this.allowedOrigins) {
      if (typeof allowed === 'string') {
        if (allowed === '*') return true
        if (allowed === origin) return true
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*')
          const regex = new RegExp(`^${pattern}$`)
          if (regex.test(origin)) return true
        }
      } else if (allowed instanceof RegExp) {
        if (allowed.test(origin)) return true
      }
    }

    return false
  }

  validateOrigin(origin, callback) {
    const allowed = this.isOriginAllowed(origin)

    if (allowed) {
      if (origin) this.logAcceptedRequest(origin)
      callback(null, true)
    } else {
      this.logRejectedRequest(origin)
      callback(new Error(`CORS policy: Origin ${origin || 'undefined'} not allowed`), false)
    }
  }

  logRejectedRequest(origin) {
    const entry = {
      origin,
      timestamp: new Date().toISOString(),
    }

    this.rejectedRequests.push(entry)
    if (this.rejectedRequests.length > this.maxLogSize) {
      this.rejectedRequests.shift()
    }

    if (this.logger) {
      this.logger.warn(`[CORS] Rejected request from non-whitelisted origin: ${origin}`)
    }
  }

  logAcceptedRequest(origin) {
    const entry = {
      origin,
      timestamp: new Date().toISOString(),
    }

    this.acceptedRequests.push(entry)
    if (this.acceptedRequests.length > this.maxLogSize) {
      this.acceptedRequests.shift()
    }

    if (this.logger) {
      this.logger.debug(`[CORS] Accepted request from origin: ${origin}`)
    }
  }

  _formatOrigins() {
    return this.allowedOrigins.map(origin => {
      if (origin instanceof RegExp) {
        return origin.toString()
      }
      return origin
    })
  }

  getCORSOptions() {
    return {
      origin: (origin, callback) => this.validateOrigin(origin, callback),
      credentials: this.credentials,
      methods: this.allowedMethods,
      allowedHeaders: this.allowedHeaders,
      exposedHeaders: this.exposedHeaders,
      maxAge: this.preflightCacheDuration,
      strictPreflight: true,
      preflightContinue: false,
    }
  }

  getStats() {
    return {
      allowedOrigins: this._formatOrigins(),
      allowedMethods: this.allowedMethods,
      allowedHeaders: this.allowedHeaders,
      exposedHeaders: this.exposedHeaders,
      credentials: this.credentials,
      preflightCacheDuration: this.preflightCacheDuration,
      rejectedCount: this.rejectedRequests.length,
      acceptedCount: this.acceptedRequests.length,
      recentRejections: this.rejectedRequests.slice(-10),
      recentAcceptances: this.acceptedRequests.slice(-10),
    }
  }

  getConfig() {
    return {
      allowedOrigins: this._formatOrigins(),
      allowedMethods: this.allowedMethods,
      allowedHeaders: this.allowedHeaders,
      exposedHeaders: this.exposedHeaders,
      credentials: this.credentials,
      preflightCacheDuration: this.preflightCacheDuration,
    }
  }

  addOrigin(origin) {
    if (typeof origin === 'string') {
      if (!this.allowedOrigins.includes(origin)) {
        this.allowedOrigins.push(origin)
        if (this.logger) {
          this.logger.info(`[CORS] Added origin to whitelist: ${origin}`)
        }
        return true
      }
    }
    return false
  }

  removeOrigin(origin) {
    const index = this.allowedOrigins.indexOf(origin)
    if (index !== -1) {
      this.allowedOrigins.splice(index, 1)
      if (this.logger) {
        this.logger.info(`[CORS] Removed origin from whitelist: ${origin}`)
      }
      return true
    }
    return false
  }
}
