import { createHash, randomBytes } from 'crypto'
import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('CSRFTokenManager')

export class CSRFTokenManager {
  constructor(options = {}) {
    this.tokenStore = new Map()
    this.sessionStore = new Map()
    this.tokenExpiry = options.tokenExpiry || 3600000
    this.maxTokensPerSession = options.maxTokensPerSession || 10
    this.algorithm = 'sha256'
    this.cleanupInterval = setInterval(() => this.cleanup(), 600000)
  }

  generateToken(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID must be a non-empty string')
    }

    const random = randomBytes(32).toString('hex')
    const tokenData = `${sessionId}:${random}:${Date.now()}`
    const token = createHash(this.algorithm).update(tokenData).digest('hex')

    const tokenEntry = {
      token,
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.tokenExpiry,
      used: false,
    }

    const sessionTokens = this.tokenStore.get(sessionId) || []

    if (sessionTokens.length >= this.maxTokensPerSession) {
      const oldest = sessionTokens.shift()
      logger.debug('Token rotated', { sessionId, removedToken: oldest.token.slice(0, 8) })
    }

    sessionTokens.push(tokenEntry)
    this.tokenStore.set(sessionId, sessionTokens)

    logger.debug('CSRF token generated', {
      sessionId: sessionId.slice(0, 8),
      tokenPrefix: token.slice(0, 8),
    })

    return token
  }

  validateToken(token, sessionId) {
    if (!token || typeof token !== 'string') {
      logger.warn('Token validation failed: invalid token format', { sessionId })
      return false
    }

    if (!sessionId || typeof sessionId !== 'string') {
      logger.warn('Token validation failed: invalid session ID', { tokenPrefix: token.slice(0, 8) })
      return false
    }

    const sessionTokens = this.tokenStore.get(sessionId)
    if (!sessionTokens || sessionTokens.length === 0) {
      logger.warn('Token validation failed: no tokens for session', { sessionId })
      return false
    }

    const tokenEntry = sessionTokens.find(t => t.token === token)
    if (!tokenEntry) {
      logger.warn('Token validation failed: token not found', {
        sessionId,
        tokenPrefix: token.slice(0, 8),
      })
      return false
    }

    if (Date.now() > tokenEntry.expiresAt) {
      sessionTokens.splice(sessionTokens.indexOf(tokenEntry), 1)
      logger.warn('Token validation failed: token expired', {
        sessionId,
        expiresAt: tokenEntry.expiresAt,
      })
      return false
    }

    if (tokenEntry.used) {
      logger.error('Token validation failed: token already used', {
        sessionId,
        usedAt: tokenEntry.usedAt,
      })
      return false
    }

    tokenEntry.used = true
    tokenEntry.usedAt = Date.now()

    logger.debug('CSRF token validated successfully', {
      sessionId: sessionId.slice(0, 8),
      tokenAge: Date.now() - tokenEntry.createdAt,
    })

    return true
  }

  refreshToken(oldToken, sessionId) {
    if (!this.validateToken(oldToken, sessionId)) {
      throw new Error('Cannot refresh invalid or expired token')
    }

    const newToken = this.generateToken(sessionId)

    logger.info('CSRF token refreshed', {
      sessionId: sessionId.slice(0, 8),
      oldTokenPrefix: oldToken.slice(0, 8),
      newTokenPrefix: newToken.slice(0, 8),
    })

    return newToken
  }

  invalidateSession(sessionId) {
    if (this.tokenStore.has(sessionId)) {
      const tokens = this.tokenStore.get(sessionId)
      this.tokenStore.delete(sessionId)

      logger.info('Session tokens invalidated', {
        sessionId: sessionId.slice(0, 8),
        tokenCount: tokens.length,
      })
    }
  }

  cleanup() {
    let removedCount = 0
    const now = Date.now()

    for (const [sessionId, tokens] of this.tokenStore.entries()) {
      const validTokens = tokens.filter(t => t.expiresAt > now)

      if (validTokens.length === 0) {
        this.tokenStore.delete(sessionId)
      } else if (validTokens.length < tokens.length) {
        this.tokenStore.set(sessionId, validTokens)
        removedCount += tokens.length - validTokens.length
      }
    }

    if (removedCount > 0) {
      logger.debug('CSRF token cleanup completed', { removedCount })
    }
  }

  getMetrics() {
    let totalTokens = 0
    for (const tokens of this.tokenStore.values()) {
      totalTokens += tokens.length
    }

    return {
      activeSessions: this.tokenStore.size,
      totalTokens,
      averageTokensPerSession: this.tokenStore.size > 0 ? totalTokens / this.tokenStore.size : 0,
      tokenExpiry: this.tokenExpiry,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.tokenStore.clear()
    this.sessionStore.clear()
    logger.info('CSRF Token Manager destroyed')
  }
}

export function createCSRFTokenManager(options = {}) {
  return new CSRFTokenManager(options)
}
