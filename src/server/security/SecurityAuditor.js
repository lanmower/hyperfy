import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('SecurityAuditor')

export const AUDIT_TYPES = {
  ACCESS: 'ACCESS',
  MODIFICATION: 'MODIFICATION',
  DELETION: 'DELETION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
}

export class SecurityAuditor {
  constructor(options = {}) {
    this.events = []
    this.maxEvents = options.maxEvents || 10000
    this.eventListeners = []
  }

  auditAccess(resource, userId, allowed, context = {}) {
    const event = { type: AUDIT_TYPES.ACCESS, timestamp: new Date().toISOString(), resource, userId, allowed, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    if (!allowed) logger.warn('Access denied', { resource, userId: userId ? userId.slice(0, 8) : 'anonymous', ...context })
    else logger.debug('Access granted', { resource, userId: userId ? userId.slice(0, 8) : 'anonymous' })
    return event
  }

  auditModification(resource, userId, data, context = {}) {
    const event = { type: AUDIT_TYPES.MODIFICATION, timestamp: new Date().toISOString(), resource, userId, dataHash: this.hashData(data), dataSize: JSON.stringify(data).length, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    logger.info('Data modified', { resource, userId: userId ? userId.slice(0, 8) : 'unknown', dataSize: event.dataSize })
    return event
  }

  auditDeletion(resource, userId, context = {}) {
    const event = { type: AUDIT_TYPES.DELETION, timestamp: new Date().toISOString(), resource, userId, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    logger.info('Resource deleted', { resource, userId: userId ? userId.slice(0, 8) : 'unknown' })
    return event
  }

  auditAuthentication(userId, success, reason = null, context = {}) {
    const event = { type: AUDIT_TYPES.AUTHENTICATION, timestamp: new Date().toISOString(), userId, success, reason, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    if (!success) logger.warn('Authentication failed', { userId: userId ? userId.slice(0, 8) : 'unknown', reason })
    else logger.debug('Authentication successful', { userId: userId.slice(0, 8) })
    return event
  }

  auditAuthorization(userId, resource, action, allowed, context = {}) {
    const event = { type: AUDIT_TYPES.AUTHORIZATION, timestamp: new Date().toISOString(), userId, resource, action, allowed, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    if (!allowed) logger.warn('Authorization denied', { userId: userId ? userId.slice(0, 8) : 'unknown', resource, action })
    return event
  }

  auditSecurityViolation(violationType, severity, details = {}) {
    const event = { type: AUDIT_TYPES.SECURITY_VIOLATION, timestamp: new Date().toISOString(), violationType, severity, details, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    logger.error('Security violation detected', { violationType, severity, detailCount: Object.keys(details).length, correlationId: event.correlationId })
    return event
  }

  auditConfigurationChange(configKey, oldValue, newValue, userId = null, context = {}) {
    const event = { type: AUDIT_TYPES.CONFIGURATION_CHANGE, timestamp: new Date().toISOString(), configKey, oldValueHash: this.hashData(oldValue), newValueHash: this.hashData(newValue), userId, context, correlationId: this.generateCorrelationId() }
    this.recordEvent(event)
    logger.info('Configuration changed', { configKey, userId: userId ? userId.slice(0, 8) : 'system', correlationId: event.correlationId })
    return event
  }

  recordEvent(event) {
    this.events.push(event)
    if (this.events.length > this.maxEvents) this.events.shift()
    for (const listener of this.eventListeners) {
      try { listener(event) }
      catch (err) { logger.error('Event listener error', { error: err.message }) }
    }
  }

  addEventListener(listener) {
    if (typeof listener !== 'function') throw new Error('Listener must be a function')
    this.eventListeners.push(listener)
  }

  removeEventListener(listener) {
    const index = this.eventListeners.indexOf(listener)
    if (index >= 0) this.eventListeners.splice(index, 1)
  }

  getEvents(type = null, limit = 100) {
    let results = this.events
    if (type) results = results.filter(e => e.type === type)
    return results.slice(-limit)
  }

  getEventsByUser(userId, limit = 100) {
    return this.events.filter(e => e.userId === userId).slice(-limit)
  }

  getSecurityViolations(limit = 100) {
    return this.events.filter(e => e.type === AUDIT_TYPES.SECURITY_VIOLATION).slice(-limit)
  }

  getMetrics() {
    const violations = this.events.filter(e => e.type === AUDIT_TYPES.SECURITY_VIOLATION)
    const deniedAccess = this.events.filter(e => e.type === AUDIT_TYPES.ACCESS && !e.allowed)
    return {
      totalEvents: this.events.length,
      maxEvents: this.maxEvents,
      eventTypes: this.getEventTypeCounts(),
      securityViolations: violations.length,
      deniedAccess: deniedAccess.length,
      eventRate: this.calculateEventRate(),
    }
  }

  getEventTypeCounts() {
    const counts = {}
    for (const event of this.events) counts[event.type] = (counts[event.type] || 0) + 1
    return counts
  }

  calculateEventRate() {
    if (this.events.length < 2) return 0
    const now = Date.now()
    const oneHourAgo = now - 3600000
    const recentEvents = this.events.filter(e => new Date(e.timestamp).getTime() > oneHourAgo)
    return recentEvents.length / 60
  }

  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }

  hashData(data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(36)
    } catch (err) {
      return 'invalid'
    }
  }

  clear() {
    this.events = []
    logger.info('Audit log cleared')
  }
}

export function createSecurityAuditor(options = {}) {
  return new SecurityAuditor(options)
}
