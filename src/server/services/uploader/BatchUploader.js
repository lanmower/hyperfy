import { LoggerFactory } from '../../../core/utils/logging/index.js'

const logger = LoggerFactory.get('BatchUploader')

export class BatchUploader {
  constructor(fileUploader) {
    this.fileUploader = fileUploader
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
          const result = await this.fileUploader.uploadFile(file.buffer, file.filename, {
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
        logger.error('Batch upload error', { error: error.message })
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
}
