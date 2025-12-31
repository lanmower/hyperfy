// Consolidated validation module for WebSocket, FileUpload, and domain validation
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Validators')

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

export class FileUploadValidator {
  static MAX_FILE_SIZE = 500 * 1024 * 1024
  static MAX_FILENAME_LENGTH = 255
  static ALLOWED_MIME_TYPES = new Set([
    'model/gltf-binary',
    'model/gltf+json',
    'application/gzip',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'application/json',
  ])

  static validateFileData(fileData) {
    const errors = []

    if (!fileData || typeof fileData !== 'object') {
      return { valid: false, errors: ['File data must be an object'] }
    }

    if (!fileData.name || typeof fileData.name !== 'string') {
      errors.push('Missing or invalid filename')
    } else if (fileData.name.length === 0) {
      errors.push('Filename cannot be empty')
    } else if (fileData.name.length > this.MAX_FILENAME_LENGTH) {
      errors.push(`Filename exceeds ${this.MAX_FILENAME_LENGTH} character limit`)
    } else if (!/^[a-zA-Z0-9._\-\s]+$/.test(fileData.name)) {
      errors.push('Filename contains invalid characters')
    }

    if (!fileData.type || typeof fileData.type !== 'string') {
      errors.push('Missing or invalid MIME type')
    } else if (!this.ALLOWED_MIME_TYPES.has(fileData.type)) {
      errors.push(`MIME type "${fileData.type}" not allowed`)
    }

    if (!fileData.data) {
      errors.push('Missing file data')
    } else if (typeof fileData.data === 'string') {
      const byteLength = Buffer.byteLength(fileData.data, 'base64')
      if (byteLength > this.MAX_FILE_SIZE) {
        errors.push(`File size ${byteLength} exceeds ${this.MAX_FILE_SIZE} byte limit`)
      }
    } else if (fileData.data instanceof ArrayBuffer) {
      if (fileData.data.byteLength > this.MAX_FILE_SIZE) {
        errors.push(`File size ${fileData.data.byteLength} exceeds ${this.MAX_FILE_SIZE} byte limit`)
      }
    } else if (ArrayBuffer.isView(fileData.data)) {
      if (fileData.data.byteLength > this.MAX_FILE_SIZE) {
        errors.push(`File size ${fileData.data.byteLength} exceeds ${this.MAX_FILE_SIZE} byte limit`)
      }
    } else {
      errors.push('Invalid file data format')
    }

    if (fileData.metadata && typeof fileData.metadata !== 'object') {
      errors.push('Metadata must be an object')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  static validateBatchUpload(files) {
    if (!Array.isArray(files)) {
      return { valid: false, errors: ['Files must be an array'] }
    }

    if (files.length === 0) {
      return { valid: false, errors: ['File list cannot be empty'] }
    }

    if (files.length > 100) {
      return { valid: false, errors: ['Cannot upload more than 100 files at once'] }
    }

    const results = []
    let totalSize = 0

    for (let i = 0; i < files.length; i++) {
      const validation = this.validateFileData(files[i])
      if (!validation.valid) {
        results.push({
          index: i,
          filename: files[i]?.name || 'unknown',
          valid: false,
          errors: validation.errors,
        })
      } else {
        const fileSize = typeof files[i].data === 'string'
          ? Buffer.byteLength(files[i].data, 'base64')
          : files[i].data.byteLength || 0
        totalSize += fileSize
      }
    }

    if (totalSize > 2 * 1024 * 1024 * 1024) {
      return {
        valid: false,
        errors: [`Total batch size ${totalSize} exceeds 2GB limit`],
        results
      }
    }

    return {
      valid: results.every(r => r.valid !== false),
      results,
      totalSize,
    }
  }

  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
      .substring(0, this.MAX_FILENAME_LENGTH)
      .trim()
  }

  static validateUploadRequest(request) {
    if (!request || typeof request !== 'object') {
      return { valid: false, errors: ['Invalid request object'] }
    }

    const errors = []

    if (!request.files || !Array.isArray(request.files)) {
      errors.push('Missing or invalid files array')
    }

    if (request.entityId && typeof request.entityId !== 'string') {
      errors.push('Invalid entity ID')
    }

    if (request.blueprintId && typeof request.blueprintId !== 'string') {
      errors.push('Invalid blueprint ID')
    }

    if (request.userId && typeof request.userId !== 'string') {
      errors.push('Invalid user ID')
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    return this.validateBatchUpload(request.files)
  }

  static logValidation(filename, validation) {
    if (validation.valid) {
      logger.info('File validation passed', { filename })
    } else {
      logger.error('File validation failed', {
        filename,
        errors: validation.errors
      })
    }
  }
}

export class AppValidator {
  static validateBlueprint(blueprint) {
    // Re-export from schema validators
    const { validateBlueprint } = require('../schemas/AppBlueprint.schema.js')
    return validateBlueprint(blueprint)
  }

  static normalizeBlueprint(blueprint) {
    const { normalizeBlueprint } = require('../schemas/AppBlueprint.schema.js')
    return normalizeBlueprint(blueprint)
  }

  static validateAppEntity(entity, blueprintMap) {
    if (!entity) {
      return { valid: false, error: 'Entity is null or undefined' }
    }

    if (!entity.type || entity.type !== 'app') {
      return { valid: false, error: `Entity type must be 'app', got '${entity.type}'` }
    }

    if (!entity.blueprintId && !entity.blueprint) {
      return { valid: false, error: 'App entity missing blueprint ID' }
    }

    const blueprintId = entity.blueprintId || entity.blueprint
    if (typeof blueprintId !== 'string') {
      return { valid: false, error: 'Blueprint ID must be a string' }
    }

    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return { valid: false, error: `Blueprint '${blueprintId}' does not exist` }
    }

    return this.validateBlueprint(blueprint)
  }

  static isAppListable(app, blueprintMap) {
    if (!app || app.type !== 'app') {
      return false
    }

    const blueprintId = app.blueprintId || app.blueprint
    if (!blueprintId) {
      return false
    }

    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return false
    }

    const { isListableApp } = require('../schemas/AppBlueprint.schema.js')
    return isListableApp(blueprint)
  }

  static filterListableApps(apps, blueprintMap) {
    if (!Array.isArray(apps)) {
      return []
    }

    return apps.filter(app => {
      try {
        return this.isAppListable(app, blueprintMap)
      } catch (err) {
        logger.warn('App failed listability check', { appId: app?.id, error: err.message })
        return false
      }
    })
  }

  static getValidationErrors(blueprint) {
    const errors = []

    if (!blueprint) {
      errors.push('Blueprint is null or undefined')
      return errors
    }

    const result = this.validateBlueprint(blueprint)
    if (!result.valid) {
      errors.push(result.error)
    }

    return errors
  }
}
