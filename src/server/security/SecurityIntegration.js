import { DatabaseSecurityWrapper } from './DatabaseSecurityWrapper.js'
import { XSSProtector } from './XSSProtector.js'
import { CSRFTokenManager } from './CSRFTokenManager.js'
import { SecurityAuditor } from './SecurityAuditor.js'
import { RetryManager } from '../resilience/RetryManager.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('SecurityIntegration')

export class SecurityIntegration {
  constructor() {
    this.auditor = new SecurityAuditor({ maxEvents: 50000 })
    this.csrfManager = new CSRFTokenManager({ tokenExpiry: 3600000 })
    this.dbWrapper = null
    this.initialized = false
  }

  initialize(db) {
    this.dbWrapper = new DatabaseSecurityWrapper(db)
    this.initialized = true
    logger.info('Security integration initialized')
  }

  getAuditor() {
    return this.auditor
  }

  getCSRFManager() {
    return this.csrfManager
  }

  getDatabaseWrapper() {
    if (!this.dbWrapper) {
      throw new Error('Database wrapper not initialized')
    }
    return this.dbWrapper
  }

  sanitizeHTML(html, config = {}) {
    return XSSProtector.sanitizeHTML(html, config)
  }

  sanitizeText(text) {
    return XSSProtector.sanitizeText(text)
  }

  sanitizeObject(obj) {
    return XSSProtector.sanitizeObject(obj)
  }

  generateCSRFToken(sessionId) {
    return this.csrfManager.generateToken(sessionId)
  }

  validateCSRFToken(token, sessionId) {
    return this.csrfManager.validateToken(token, sessionId)
  }

  async executeWithRetry(fn, maxRetries = 3) {
    return RetryManager.execute(fn, maxRetries, 100)
  }

  async executeWithBackoff(fn, options = {}) {
    return RetryManager.executeWithBackoff(fn, options)
  }

  getSecurityMetrics() {
    return {
      auditor: this.auditor.getMetrics(),
      csrfManager: this.csrfManager.getMetrics(),
      database: this.dbWrapper ? this.dbWrapper.getMetrics() : null,
    }
  }

  onAccessDenied(resource, userId, context = {}) {
    this.auditor.auditAccess(resource, userId, false, context)
  }

  onAccessGranted(resource, userId, context = {}) {
    this.auditor.auditAccess(resource, userId, true, context)
  }

  onDataModified(resource, userId, data, context = {}) {
    this.auditor.auditModification(resource, userId, data, context)
  }

  onDataDeleted(resource, userId, context = {}) {
    this.auditor.auditDeletion(resource, userId, context)
  }

  onAuthenticationSuccess(userId, context = {}) {
    this.auditor.auditAuthentication(userId, true, null, context)
  }

  onAuthenticationFailure(userId, reason = null, context = {}) {
    this.auditor.auditAuthentication(userId, false, reason, context)
  }

  onSecurityViolation(violationType, severity, details = {}) {
    this.auditor.auditSecurityViolation(violationType, severity, details)
  }

  getRecentViolations(limit = 50) {
    return this.auditor.getSecurityViolations(limit)
  }

  getEventsByUser(userId, limit = 100) {
    return this.auditor.getEventsByUser(userId, limit)
  }

  getEvents(type = null, limit = 100) {
    return this.auditor.getEvents(type, limit)
  }

  destroy() {
    this.csrfManager.destroy()
    this.auditor.clear()
    logger.info('Security integration destroyed')
  }
}

export function createSecurityIntegration() {
  return new SecurityIntegration()
}
