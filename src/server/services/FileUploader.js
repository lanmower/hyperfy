// Server-side file upload handler with feature parity to SDK FileUploader

import crypto from 'crypto'
import { FileStorage } from './FileStorage.js'

export class FileUploader {
  constructor(storage, maxUploadSize = 50 * 1024 * 1024) {
    this.storage = storage
    this.maxUploadSize = maxUploadSize
    this.uploads = new Map()
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      totalBytes: 0,
      deduplicatedBytes: 0,
      startTime: Date.now()
    }
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
        this.stats.total++
        this.stats.skipped++
        this.stats.deduplicatedBytes += size

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

      this.stats.total++
      this.stats.successful++
      this.stats.totalBytes += size

      if (onProgress) onProgress(100)
      if (this.onProgress) this.onProgress(uploadId, 100)
      if (this.onComplete) this.onComplete(uploadId, uploadRecord)

      return uploadRecord

    } catch (error) {
      this.stats.total++
      this.stats.failed++

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
    const {
      concurrent = 3,
      onProgress = null,
      onFileComplete = null,
      onFileError = null,
      uploader = null
    } = options

    const results = []
    const errors = []
    let completed = 0

    for (let i = 0; i < files.length; i += concurrent) {
      const batch = files.slice(i, i + concurrent)
      const batchPromises = batch.map(async (file, batchIndex) => {
        try {
          const result = await this.uploadFile(file.buffer, file.filename, {
            mimeType: file.mimeType,
            uploader,
            metadata: file.metadata || {}
          })

          completed++
          if (onProgress) onProgress(completed / files.length * 100)
          if (onFileComplete) onFileComplete(result, i + batchIndex)

          return result
        } catch (error) {
          completed++
          errors.push({ filename: file.filename, error: error.message })
          if (onProgress) onProgress(completed / files.length * 100)
          if (onFileError) onFileError(error, file.filename, i + batchIndex)
          throw error
        }
      })

      try {
        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          }
        })
      } catch (error) {
        console.error('Batch upload error:', error)
      }
    }

    return {
      results,
      errors,
      total: files.length,
      successful: results.length,
      failed: errors.length
    }
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
    const elapsed = Date.now() - this.stats.startTime
    const elapsedSec = elapsed / 1000

    return {
      total: this.stats.total,
      successful: this.stats.successful,
      failed: this.stats.failed,
      skipped: this.stats.skipped,
      totalBytes: this.stats.totalBytes,
      deduplicatedBytes: this.stats.deduplicatedBytes,
      uploadRate: elapsedSec > 0 ? Math.round(this.stats.totalBytes / elapsedSec) : 0,
      deduplicationRatio: this.stats.total > 0 ? (this.stats.skipped / this.stats.total * 100).toFixed(2) : 0,
      elapsed,
      averageTime: this.stats.successful > 0 ? Math.round(elapsed / this.stats.successful) : 0
    }
  }

  exportStats(format = 'json') {
    const stats = this.getStats()

    if (format === 'json') {
      return JSON.stringify(stats, null, 2)
    }

    if (format === 'csv') {
      const headers = Object.keys(stats).join(',')
      const values = Object.values(stats).join(',')
      return `${headers}\n${values}`
    }

    if (format === 'text') {
      return Object.entries(stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    }

    throw new Error(`Unknown export format: ${format}`)
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
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      totalBytes: 0,
      deduplicatedBytes: 0,
      startTime: Date.now()
    }
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
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  toString() {
    const stats = this.getStats()
    return `FileUploader(${stats.total} uploads, ${stats.successful} successful, ${this.formatBytes(stats.totalBytes)} total)`
  }
}
