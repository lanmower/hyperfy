import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FileUploadValidator')

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
