import { SecurityIntegration } from './SecurityIntegration.js'
import { createSecurityMiddleware, createCSRFProtectionMiddleware, createInputSanitizationMiddleware, createSecurityHeadersMiddleware } from '../middleware/SecurityMiddleware.js'

export async function initializeSecurityLayer(fastify, db) {
  const security = new SecurityIntegration()
  security.initialize(db)

  const auditor = security.getAuditor()
  const csrfManager = security.getCSRFManager()

  fastify.decorate('security', security)
  fastify.decorate('auditor', auditor)
  fastify.decorate('csrfManager', csrfManager)

  fastify.addHook('onRequest', createSecurityHeadersMiddleware())
  fastify.addHook('onRequest', createSecurityMiddleware(auditor))
  fastify.addHook('preHandler', createInputSanitizationMiddleware())

  return security
}

export function setupCSRFProtection(fastify) {
  const csrfManager = fastify.csrfManager

  fastify.addHook('preHandler', createCSRFProtectionMiddleware(csrfManager))

  fastify.get('/api/csrf-token', async (request, reply) => {
    const sessionId = request.session?.id || request.sessionID
    if (!sessionId) {
      return reply.code(401).send({ error: 'Session required' })
    }

    const token = csrfManager.generateToken(sessionId)
    return reply.send({ token, expiresIn: 3600 })
  })

  fastify.post('/api/csrf-refresh', async (request, reply) => {
    const sessionId = request.session?.id || request.sessionID
    const oldToken = request.body?.token

    if (!sessionId || !oldToken) {
      return reply.code(400).send({ error: 'Session and token required' })
    }

    try {
      const newToken = csrfManager.refreshToken(oldToken, sessionId)
      return reply.send({ token: newToken, expiresIn: 3600 })
    } catch (err) {
      return reply.code(403).send({ error: 'Token refresh failed' })
    }
  })
}

export function setupSecurityMetrics(fastify) {
  fastify.get('/api/admin/security/metrics', async (request, reply) => {
    if (!request.user?.isAdmin) {
      fastify.auditor.auditAccess('/admin/security/metrics', request.user?.id, false)
      return reply.code(403).send({ error: 'Unauthorized' })
    }

    fastify.auditor.auditAccess('/admin/security/metrics', request.user.id, true)

    const metrics = fastify.security.getSecurityMetrics()
    const violations = fastify.auditor.getSecurityViolations(100)
    const events = fastify.auditor.getEvents(null, 50)

    return reply.send({
      metrics,
      recentViolations: violations,
      recentEvents: events,
      timestamp: new Date().toISOString(),
    })
  })

  fastify.get('/api/admin/security/events', async (request, reply) => {
    if (!request.user?.isAdmin) {
      fastify.auditor.auditAccess('/admin/security/events', request.user?.id, false)
      return reply.code(403).send({ error: 'Unauthorized' })
    }

    const userId = request.query.userId
    const type = request.query.type
    const limit = Math.min(parseInt(request.query.limit || 100), 1000)

    let events
    if (userId) {
      events = fastify.auditor.getEventsByUser(userId, limit)
    } else if (type) {
      events = fastify.auditor.getEvents(type, limit)
    } else {
      events = fastify.auditor.getEvents(null, limit)
    }

    fastify.auditor.auditAccess('/admin/security/events', request.user.id, true, {
      filters: { userId, type },
      resultCount: events.length,
    })

    return reply.send({ events, count: events.length })
  })
}

export function setupSecurityErrorHandling(fastify) {
  fastify.setErrorHandler(async (error, request, reply) => {
    const correlationId = request.correlationId || 'unknown'

    if (error.code === 'CSRF_VALIDATION_FAILED') {
      fastify.auditor.auditSecurityViolation('CSRF_VIOLATION', 'MEDIUM', {
        correlationId,
        endpoint: request.url,
        sessionId: request.session?.id,
      })
      return reply.code(403).send({ error: 'CSRF validation failed', correlationId })
    }

    if (error.code === 'INPUT_VALIDATION') {
      fastify.auditor.auditSecurityViolation('INPUT_VALIDATION_FAILED', 'LOW', {
        correlationId,
        endpoint: request.url,
        errorMessage: error.message,
      })
      return reply.code(400).send({ error: 'Invalid input', correlationId })
    }

    if (error.code === 'DB_SECURITY_VIOLATION') {
      fastify.auditor.auditSecurityViolation('DATABASE_SECURITY_VIOLATION', 'HIGH', {
        correlationId,
        errorMessage: error.message,
      })
      return reply.code(500).send({ error: 'Database security error', correlationId })
    }

    return reply.code(error.statusCode || 500).send({
      error: error.message || 'Internal server error',
      correlationId,
    })
  })
}

export async function initializeCompleteSecurityStack(fastify, db) {
  const security = await initializeSecurityLayer(fastify, db)
  setupCSRFProtection(fastify)
  setupSecurityMetrics(fastify)
  setupSecurityErrorHandling(fastify)

  fastify.log.info('Complete security stack initialized', {
    modules: [
      'DatabaseSecurityWrapper',
      'XSSProtector',
      'CSRFTokenManager',
      'RetryManager',
      'SecurityAuditor',
      'SecurityMiddleware',
    ],
  })

  return security
}
