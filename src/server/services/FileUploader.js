
import crypto from 'crypto'
import { FileStorage } from './FileStorage.js'
import { UploadStats } from './uploader/UploadStats.js'
import { BatchUploader } from './uploader/BatchUploader.js'
import { formatBytes, formatDuration, exportStats } from './uploader/FormatUtils.js'

export class FileUploader {
  constructor(storage, maxUploadSize = 50 * 1024 * 1024) {
    this.storage = storage
    this.maxUploadSize = maxUploadSize
    this.uploads = new Map()
    this.stats = new UploadStats()
    this.batchUploader = new BatchUploader(this)
    this.onProgress = null
    this.onComplete = null
    this.onError = null
  }

  validateFile(buffer, filename) {
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty')
    }

    if (buffer.length > this.maxUploadSize) {
      throw new Error(`File size (${buffer.length} bytes) exceeds maximum allowed size (${this.maxUploadSize} bytes)`)
    }

    return true
  }

  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  async checkExists(hash) {
    return await this.storage.exists(hash)
  }

  async uploadFile(buffer, filename, options = {}) {
    const uploadId = options.uploadId || crypto.randomUUID()
    const {
      mimeType = 'application/octet-stream',
      uploader = null,
      onProgress = null,
      metadata = {}
    } = options

    try {
      this.validateFile(buffer, filename)

      const hash = this.calculateHash(buffer)
      const size = buffer.length

      const exists = await this.checkExists(hash)
      if (exists) {
        const existingRecord = await this.storage.getRecord(hash)
        const result = {
          uploadId,
          hash,
          filename,
          size,
          deduplicated: true,
          url: existingRecord.url,
          record: existingRecord,
          metadata
        }

        this.uploads.set(uploadId, result)
        this.stats.incrementTotal()
        this.stats.incrementSkipped()
        this.stats.addDeduplicatedBytes(size)

        if (onProgress) onProgress(100)
        if (this.onProgress) this.onProgress(uploadId, 100)
        if (this.onComplete) this.onComplete(uploadId, result)

        return result
      }

      const uploadRecord = {
        uploadId,
        hash,
        filename,
        size,
        mimeType,
        uploader,
        deduplicated: false,
        metadata,
        startTime: Date.now(),
        progress: 0
      }

      this.uploads.set(uploadId, uploadRecord)

      if (onProgress) onProgress(50)
      if (this.onProgress) this.onProgress(uploadId, 50)

      const record = await this.storage.store(hash, filename, buffer, {
        mimeType,
        uploader,
        ...metadata
      })

      uploadRecord.endTime = Date.now()
      uploadRecord.duration = uploadRecord.endTime - uploadRecord.startTime
      uploadRecord.url = record.url
      uploadRecord.record = record
      uploadRecord.progress = 100

      this.stats.incrementTotal()
      this.stats.incrementSuccessful()
      this.stats.addTotalBytes(size)

      if (onProgress) onProgress(100)
      if (this.onProgress) this.onProgress(uploadId, 100)
      if (this.onComplete) this.onComplete(uploadId, uploadRecord)

      return uploadRecord

    } catch (error) {
      this.stats.incrementTotal()
      this.stats.incrementFailed()

      const errorRecord = {
        uploadId,
        filename,
        error: error.message,
        timestamp: Date.now()
      }

      if (this.onError) this.onError(uploadId, error)
      throw error
    }
  }

  async uploadBatch(files, options = {}) {
    return this.batchUploader.uploadBatch(files, options)
  }

  getUpload(uploadId) {
    return this.uploads.get(uploadId)
  }

  getAllUploads() {
    return Array.from(this.uploads.values())
  }

  getActiveUploads() {
    return this.getAllUploads().filter(upload => !upload.endTime)
  }

  getCompletedUploads() {
    return this.getAllUploads().filter(upload => upload.endTime)
  }

  getStats() {
    return this.stats.getStats()
  }

  exportStats(format = 'json') {
    const stats = this.getStats()
    return exportStats(stats, format)
  }

  getProgress() {
    const active = this.getActiveUploads()
    const total = this.uploads.size

    if (total === 0) return { progress: 0, active: 0, total: 0 }

    const totalProgress = Array.from(this.uploads.values())
      .reduce((sum, upload) => sum + (upload.progress || 0), 0)

    return {
      progress: Math.round(totalProgress / total),
      active: active.length,
      total,
      completed: total - active.length
    }
  }

  clearUploads(olderThan = null) {
    if (olderThan === null) {
      this.uploads.clear()
      return
    }

    const cutoff = Date.now() - olderThan
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.endTime && upload.endTime < cutoff) {
        this.uploads.delete(id)
      }
    }
  }

  resetStats() {
    this.stats.reset()
  }

  on(event, callback) {
    switch (event) {
      case 'progress':
        this.onProgress = callback
        break
      case 'complete':
        this.onComplete = callback
        break
      case 'error':
        this.onError = callback
        break
      default:
        throw new Error(`Unknown uploader event: ${event}`)
    }
  }

  off(event) {
    switch (event) {
      case 'progress':
        this.onProgress = null
        break
      case 'complete':
        this.onComplete = null
        break
      case 'error':
        this.onError = null
        break
      default:
        throw new Error(`Unknown uploader event: ${event}`)
    }
  }

  formatBytes(bytes) {
    return formatBytes(bytes)
  }

  formatDuration(ms) {
    return formatDuration(ms)
  }

  toString() {
    const stats = this.getStats()
    return `FileUploader(${stats.total} uploads, ${stats.successful} successful, ${formatBytes(stats.totalBytes)} total)`
  }
}
