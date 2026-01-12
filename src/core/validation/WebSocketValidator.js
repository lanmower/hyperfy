import { BaseValidator } from './BaseValidator.js'

export class WebSocketValidator extends BaseValidator {
  static MAX_MESSAGE_SIZE = 10 * 1024 * 1024
  static MAX_PAYLOAD_SIZE = 50 * 1024 * 1024
  static MAX_MESSAGES_PER_SECOND = 100
  static MAX_CONNECTIONS_PER_IP = 10

  constructor() {
    super('WebSocketValidator')
  }

  validateMessage(message) {
    const errors = []
    if (!message || (typeof message !== 'string' && !(message instanceof ArrayBuffer))) {
      errors.push('Invalid message format')
    }

    const size = typeof message === 'string'
      ? Buffer.byteLength(message, 'utf8')
      : message.byteLength
    if (size > WebSocketValidator.MAX_MESSAGE_SIZE) {
      errors.push(`Message size ${size} exceeds ${WebSocketValidator.MAX_MESSAGE_SIZE} byte limit`)
    }

    if (errors.length) throw Object.assign(new Error(errors[0]), { name: 'ValidationError', errors, validator: this.name })
    return { valid: true, size }
  }

  validatePacket(packetType, packetData) {
    const errors = []
    if (!packetType || typeof packetType !== 'string') {
      errors.push('Missing or invalid packet type')
    }
    if (!packetData || typeof packetData !== 'object') {
      errors.push('Packet data must be an object')
    }

    const dataSize = JSON.stringify(packetData).length
    if (dataSize > WebSocketValidator.MAX_PAYLOAD_SIZE) {
      errors.push(`Payload size ${dataSize} exceeds ${WebSocketValidator.MAX_PAYLOAD_SIZE} byte limit`)
    }

    if (errors.length) throw Object.assign(new Error(errors[0]), { name: 'ValidationError', errors, validator: this.name })
    return { valid: true, size: dataSize }
  }

  createRateLimiter(maxPerSecond = WebSocketValidator.MAX_MESSAGES_PER_SECOND) {
    const state = {
      count: 0,
      resetTime: Date.now() + 1000,
    }

    return {
      check: () => {
        const now = Date.now()
        if (now >= state.resetTime) {
          state.count = 0
          state.resetTime = now + 1000
        }
        state.count++
        return {
          allowed: state.count <= maxPerSecond,
          count: state.count,
          limit: maxPerSecond,
          remaining: Math.max(0, maxPerSecond - state.count),
        }
      },

      reset: () => {
        state.count = 0
        state.resetTime = Date.now() + 1000
      },
    }
  }

  createConnectionLimiter(maxPerIP = WebSocketValidator.MAX_CONNECTIONS_PER_IP) {
    const connections = new Map()

    return {
      add: (ip) => {
        const count = connections.get(ip) || 0
        if (count >= maxPerIP) {
          return {
            allowed: false,
            count,
            limit: maxPerIP,
            message: `IP ${ip} has reached connection limit`,
          }
        }
        connections.set(ip, count + 1)
        return {
          allowed: true,
          count: count + 1,
          limit: maxPerIP,
        }
      },

      remove: (ip) => {
        const count = connections.get(ip) || 0
        if (count > 1) {
          connections.set(ip, count - 1)
        } else {
          connections.delete(ip)
        }
      },

      getStatus: (ip) => {
        const count = connections.get(ip) || 0
        return {
          ip,
          count,
          limit: maxPerIP,
          available: Math.max(0, maxPerIP - count),
        }
      },

      clear: () => connections.clear(),

      getAll: () => Array.from(connections.entries()).map(([ip, count]) => ({
        ip,
        count,
        limit: maxPerIP,
      })),
    }
  }

  validateHandlerRegistry(registry) {
    if (!registry || typeof registry !== 'object') {
      return { valid: false, errors: ['Invalid handler registry'] }
    }

    const errors = []
    const warnings = []

    for (const [eventName, handler] of Object.entries(registry)) {
      if (!eventName || typeof eventName !== 'string') {
        errors.push('Invalid event name in registry')
      }
      if (typeof handler !== 'function') {
        errors.push(`Handler for event "${eventName}" is not a function`)
      }
      if (eventName.includes('__') || eventName.includes('..')) {
        warnings.push(`Suspicious event name: "${eventName}"`)
      }
    }

    return {
      valid: !errors.length,
      errors,
      warnings,
      handlerCount: Object.keys(registry).length,
    }
  }

  sanitizeEventName(name) {
    return name
      .replace(/[^a-zA-Z0-9_:]/g, '_')
      .substring(0, 100)
  }
}
