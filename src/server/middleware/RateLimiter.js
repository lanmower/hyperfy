import { RATE_LIMIT_PRESETS } from '../config/RateLimitConfig.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { ErrorResponses } from './ErrorResponses.js'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'
import { TTLMap } from '../utils/collections/TTLMap.js'

const logger = LoggerFactory.get('RateLimiter')
const rateLimitStore = new TTLMap(60000)
const violationLog = []

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    'unknown'
}

function checkRateLimit(clientIP, endpoint, config) {
  const now = Date.now()
  const key = `${clientIP}:${endpoint}`
  const cutoff = now - config.window

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { requests: [], config }, config.window)
  }

  const data = rateLimitStore.get(key)
  data.requests = data.requests.filter(ts => ts > cutoff)

  const currentCount = data.requests.length
  const burstLimit = Math.floor(config.max * config.burst)

  if (currentCount >= burstLimit) {
    return {
      allowed: false,
      current: currentCount,
      limit: config.max,
      resetIn: Math.min(...data.requests) + config.window - now,
    }
  }

  data.requests.push(now)

  return {
    allowed: true,
    current: currentCount + 1,
    limit: config.max,
    resetIn: config.window,
  }
}

function logViolation(clientIP, endpoint, current, limit) {
  const violation = {
    timestamp: new Date().toISOString(),
    ip: clientIP,
    endpoint,
    current,
    limit,
  }

  violationLog.push(violation)
  if (violationLog.length > 1000) {
    violationLog.shift()
  }

  logger.warn('Rate limit violation', { ip: clientIP, endpoint, current, limit })
}

export function createRateLimiter(endpoint, customConfig = {}) {
  const config = { ...RATE_LIMIT_PRESETS[endpoint] || RATE_LIMIT_PRESETS.api, ...customConfig }

  return async (req, reply) => {
    const isDevelopment = process.env.NODE_ENV !== 'production'
    if (isDevelopment) {
      return
    }

    const clientIP = getClientIP(req)
    const result = checkRateLimit(clientIP, endpoint, config)

    reply.header('X-RateLimit-Limit', result.limit)
    reply.header('X-RateLimit-Remaining', Math.max(0, result.limit - result.current))
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000))

    if (!result.allowed) {
      logViolation(clientIP, endpoint, result.current, result.limit)
      return ErrorResponseBuilder.sendError(reply, 'RATE_LIMIT_EXCEEDED', 'Too Many Requests', {
        limit: result.limit,
        current: result.current,
        retryAfter: Math.ceil(result.resetIn / 1000),
      })
    }
  }
}

export function getRateLimitStats() {
  const activeIPSet = new Set()
  for (const [key] of rateLimitStore.entries()) {
    const ip = key.split(':')[0]
    activeIPSet.add(ip)
  }

  return {
    totalKeys: rateLimitStore.size,
    violations: violationLog.length,
    recentViolations: violationLog.slice(-10),
    activeIPCount: activeIPSet.size,
  }
}

export function clearRateLimitForIP(ip) {
  let cleared = 0
  for (const [key] of rateLimitStore.entries()) {
    if (key.startsWith(ip + ':')) {
      rateLimitStore.delete(key)
      cleared++
    }
  }
  return cleared
}
