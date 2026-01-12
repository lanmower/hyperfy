import { LoggerFactory } from '../../core/utils/logging/index.js'
import { XSSProtector } from '../security/XSSProtector.js'
import { InputSanitizer } from '../../core/security/InputSanitizer.js'

const logger = LoggerFactory.get('SecurityMiddleware')

export function createSecurityMiddleware(auditor) {
  return async (request, reply) => {
    const correlationId = request.id
    request.correlationId = correlationId

    request.audit = {
      access: (resource, allowed, context = {}) => {
        const userId = request.user?.id || null
        return auditor.auditAccess(resource, userId, allowed, {
          correlationId,
          ...context,
        })
      },
      modification: (resource, data, context = {}) => {
        const userId = request.user?.id || null
        return auditor.auditModification(resource, userId, data, {
          correlationId,
          ...context,
        })
      },
      deletion: (resource, context = {}) => {
        const userId = request.user?.id || null
        return auditor.auditDeletion(resource, userId, {
          correlationId,
          ...context,
        })
      },
    }
  }
}

export function createCSRFProtectionMiddleware(csrfManager) {
  return async (request, reply) => {
    const method = request.method.toUpperCase()
    const exemptMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

    if (exemptMethods.has(method)) {
      return
    }

    const sessionId = request.sessionID || request.cookies?.sessionId
    if (!sessionId) {
      const error = new Error('Session required for state-changing operations')
      error.statusCode = 401
      throw error
    }

    const token = request.headers['x-csrf-token'] || request.body?.csrfToken

    if (!token) {
      logger.warn('CSRF token missing', { sessionId })
      const error = new Error('CSRF token required')
      error.statusCode = 403
      throw error
    }

    if (!csrfManager.validateToken(token, sessionId)) {
      logger.warn('CSRF token validation failed', { sessionId })
      const error = new Error('Invalid CSRF token')
      error.statusCode = 403
      throw error
    }
  }
}

export function createInputSanitizationMiddleware() {
  return async (request, reply) => {
    if (request.body && typeof request.body === 'object') {
      const violations = InputSanitizer.validateScript(JSON.stringify(request.body))

      if (!violations.valid) {
        logger.warn('Input validation failed', {
          violationCount: violations.violations.length,
          violations: violations.violations.slice(0, 5),
        })

        const error = new Error('Invalid input content')
        error.statusCode = 400
        error.code = 'INPUT_VALIDATION'
        throw error
      }
    }

    if (request.query && typeof request.query === 'object') {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          const xssPatterns = XSSProtector.checkForXSSPatterns(value)
          if (xssPatterns.length > 0) {
            logger.warn('XSS pattern detected in query parameter', {
              parameter: key,
              patternCount: xssPatterns.length,
            })
          }
        }
      }
    }
  }
}

export function createContentSecurityPolicyHeaders(reply) {
  try {
    reply.header('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '))

    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'accelerometer=(), microphone=(), geolocation=()')
  } catch (err) {
    // Headers already sent, silently skip
  }
}

export function createSecurityHeadersMiddleware() {
  return async (request, reply) => {
    createContentSecurityPolicyHeaders(reply)
  }
}
