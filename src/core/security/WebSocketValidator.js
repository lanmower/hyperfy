import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('WebSocketValidator')

export class WebSocketValidator {
  static MAX_MESSAGE_SIZE = 10 * 1024 * 1024
  static MAX_PAYLOAD_SIZE = 50 * 1024 * 1024
  static MAX_MESSAGES_PER_SECOND = 100
  static MAX_CONNECTIONS_PER_IP = 10

  static validateMessage(message) {
    const errors = []

    if (!message || typeof message !== 'string' && !(message instanceof ArrayBuffer)) {
      errors.push('Invalid message format')
    }

    const size = typeof message === 'string'
      ? Buffer.byteLength(message, 'utf8')
      : message.byteLength

    if (size > this.MAX_MESSAGE_SIZE) {
      errors.push(`Message size ${size} exceeds ${this.MAX_MESSAGE_SIZE} byte limit`)
    }

    return {
      valid: errors.length === 0,
      errors,
      size,
    }
  }

  static validatePacket(packetType, packetData) {
    const errors = []

    if (!packetType || typeof packetType !== 'string') {
      errors.push('Missing or invalid packet type')
    }

    if (!packetData || typeof packetData !== 'object') {
      errors.push('Packet data must be an object')
    }

    const dataSize = JSON.stringify(packetData).length
    if (dataSize > this.MAX_PAYLOAD_SIZE) {
      errors.push(`Payload size ${dataSize} exceeds ${this.MAX_PAYLOAD_SIZE} byte limit`)
    }

    return {
      valid: errors.length === 0,
      errors,
      size: dataSize,
    }
  }

  static createRateLimiter(maxPerSecond = this.MAX_MESSAGES_PER_SECOND) {
    const state = {
      count: 0,
      resetTime: Date.now() + 1000,
    }

    return {
      check() {
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

      reset() {
        state.count = 0
        state.resetTime = Date.now() + 1000
      },
    }
  }

  static createConnectionLimiter(maxPerIP = this.MAX_CONNECTIONS_PER_IP) {
    const connections = new Map()

    return {
      add(ip) {
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

      remove(ip) {
        const count = connections.get(ip) || 0
        if (count > 1) {
          connections.set(ip, count - 1)
        } else {
          connections.delete(ip)
        }
      },

      getStatus(ip) {
        const count = connections.get(ip) || 0
        return {
          ip,
          count,
          limit: maxPerIP,
          available: Math.max(0, maxPerIP - count),
        }
      },

      clear() {
        connections.clear()
      },

      getAll() {
        return Array.from(connections.entries()).map(([ip, count]) => ({
          ip,
          count,
          limit: maxPerIP,
        }))
      },
    }
  }

  static validateHandlerRegistry(registry) {
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
      valid: errors.length === 0,
      errors,
      warnings,
      handlerCount: Object.keys(registry).length,
    }
  }

  static sanitizeEventName(name) {
    return name
      .replace(/[^a-zA-Z0-9_:]/g, '_')
      .substring(0, 100)
  }

  static createSafeHandler(originalHandler, validator = null) {
    return async (socket, data) => {
      try {
        if (validator) {
          const validation = validator(data)
          if (!validation.valid) {
            logger.error('Handler validation failed', {
              error: validation.errors[0],
              eventType: originalHandler.name,
            })
            socket.send('error', { message: 'Invalid request' })
            return
          }
        }

        await originalHandler(socket, data)
      } catch (error) {
        logger.error('Handler execution error', {
          handler: originalHandler.name,
          error: error.message,
        })
        socket.send('error', { message: 'Handler execution failed' })
      }
    }
  }
}
