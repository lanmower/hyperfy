import crypto from 'crypto'
import { MasterConfig } from '../config/MasterConfig.js'

export class FileUploaderValidation {
  constructor(maxUploadSize = null) {
    this.maxUploadSize = maxUploadSize ?? MasterConfig.uploads.maxFileSize
  }

  validateFile(buffer, filename) {
    if (!buffer?.length) {
      throw new Error('File buffer is empty')
    }

    if (buffer.length > this.maxUploadSize) {
      throw new Error(`File size (${buffer.length} bytes) exceeds maximum allowed size (${this.maxUploadSize} bytes)`)
    }

    return true
  }

  async calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  validateUploadOptions(options) {
    if (typeof options !== 'object' || options === null) {
      throw new Error('Upload options must be an object')
    }

    return {
      mimeType: options.mimeType || 'application/octet-stream',
      uploader: options.uploader || null,
      metadata: options.metadata || {},
      uploadId: options.uploadId || crypto.randomUUID(),
    }
  }

  createUploadRecord(hash, filename, size, options) {
    return {
      uploadId: options.uploadId,
      hash,
      filename,
      size,
      mimeType: options.mimeType,
      uploader: options.uploader,
      deduplicated: false,
      metadata: options.metadata,
      startTime: Date.now(),
      progress: 0,
    }
  }

  createDeduplicatedRecord(hash, filename, size, url, uploadId, metadata) {
    return {
      uploadId,
      hash,
      filename,
      size,
      deduplicated: true,
      url,
      metadata,
    }
  }
}
