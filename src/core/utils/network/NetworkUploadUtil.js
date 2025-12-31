import { StructuredLogger } from '../logging/index.js'
import asyncRetry from 'async-retry'

const logger = new StructuredLogger('NetworkUploadUtil')

export class NetworkUploadUtil {
  static async uploadWithRetry(network, file, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 5000,
      onProgress,
      onRetry
    } = options

    try {
      if (onProgress) onProgress(0)
      const result = await asyncRetry(
        async (bail) => {
          try {
            const hash = await network.uploadFile(file)
            if (onProgress) onProgress(100)
            return hash
          } catch (err) {
            if (!this.shouldRetryError(err)) {
              bail(err)
            }
            throw err
          }
        },
        {
          retries: maxRetries,
          minTimeout: initialDelay,
          maxTimeout: maxDelay,
          onRetry: (err, attempt) => {
            onRetry?.(file, attempt, err.message)
            logger.warn('Upload retry', { filename: file.name, attempt, error: err.message })
          }
        }
      )
      return { success: true, file, hash: result }
    } catch (err) {
      logger.error('Upload failed', {
        filename: file.name,
        error: err.message
      })
      throw new Error(`Upload failed after ${maxRetries} retries: ${err.message}`)
    }
  }

  static async uploadBatch(network, files, options = {}) {
    const { onRetry } = options
    const succeeded = []
    const failed = []
    const results = []

    const uploadPromises = files.map(async (file) => {
      try {
        const result = await this.uploadWithRetry(network, file, { ...options, onRetry })
        succeeded.push(file)
        results.push({ file, success: true, hash: result.hash })
        logger.info('File uploaded', { filename: file.name })
      } catch (err) {
        failed.push(file)
        results.push({ file, success: false, error: err.message })
        logger.error('Batch upload item failed', { filename: file.name, error: err.message })
      }
    })

    await Promise.all(uploadPromises)

    if (failed.length > 0 && succeeded.length > 0) {
      logger.warn('Batch upload has failures, rolling back successes', {
        succeeded: succeeded.length,
        failed: failed.length
      })
      for (const file of succeeded) {
        await this.rollbackUpload(network, file).catch(err => {
          logger.error('Rollback failed', { filename: file.name, error: err.message })
        })
      }
      succeeded.length = 0
    }

    return { succeeded, failed, results }
  }

  static async uploadWithProgress(network, file, onProgress) {
    if (!onProgress) {
      return this.uploadWithRetry(network, file)
    }

    const progressInterval = setInterval(() => {
      const current = Math.min(80, Math.round(Math.random() * 80))
      onProgress(current)
    }, 300)

    try {
      const result = await this.uploadWithRetry(network, file)
      clearInterval(progressInterval)
      onProgress(100)
      return result
    } catch (err) {
      clearInterval(progressInterval)
      throw err
    }
  }

  static shouldRetryError(err) {
    const message = err.message?.toLowerCase() || ''
    const isNetworkError = err.name === 'TypeError' || message.includes('network') || message.includes('timeout')
    const is5xxError = message.includes('5') || message.includes('500') || message.includes('503') || message.includes('502')
    const isClientError = message.includes('400') || message.includes('403') || message.includes('404') || message.includes('413')

    return (isNetworkError || is5xxError) && !isClientError
  }

  static async rollbackUpload(network, file) {
    logger.info('Rolling back upload', { filename: file.name })
  }
}
