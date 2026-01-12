import { StructuredLogger } from '../../utils/logging/index.js'
import { FileUploadValidator } from '../../validation/FileUploadValidator.js'

const logger = new StructuredLogger('FileUploadHandler')

const fileValidator = new FileUploadValidator()

export class FileUploadHandler {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  onFileUpload = async (socket, data) => {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid upload data structure')
      }

      const { buffer, filename, mimeType, metadata } = data

      const validation = fileValidator.validateFileData({
        name: filename,
        type: mimeType || 'application/octet-stream',
        data: buffer,
        metadata: metadata || {},
      })

      if (!validation.valid) {
        logger.error('File validation failed', { filename, errors: validation.errors })
        socket.send('fileUploadError', {
          filename: filename || 'unknown',
          error: `File validation failed: ${validation.errors[0]}`
        })
        return
      }

      const bufferData = Buffer.from(buffer)

      const result = await this.serverNetwork.fileUploader.uploadFile(bufferData, filename, {
        mimeType: mimeType || 'application/octet-stream',
        uploader: socket.id,
        metadata: metadata || {},
        onProgress: (progress) => {
          socket.send('fileUploadProgress', { filename, progress })
        }
      })

      socket.send('fileUploadComplete', {
        filename,
        hash: result.hash,
        url: result.url,
        size: result.size,
        deduplicated: result.deduplicated
      })

    } catch (error) {
      logger.error('File upload failed', { filename: data.filename, error: error.message })
      socket.send('fileUploadError', {
        filename: data.filename,
        error: error.message
      })
    }
  }

  onFileUploadCheck = async (socket, data) => {
    try {
      const { hash } = data
      const exists = await this.serverNetwork.fileUploader.checkExists(hash)
      const record = exists ? await this.serverNetwork.fileStorage.getRecord(hash) : null

      socket.send('fileUploadCheckResult', {
        hash,
        exists,
        record
      })
    } catch (error) {
      logger.error('File upload check failed', { hash: data.hash, error: error.message })
      socket.send('fileUploadCheckResult', {
        hash: data.hash,
        exists: false,
        error: error.message
      })
    }
  }

  onFileUploadStats = async (socket) => {
    try {
      const stats = this.serverNetwork.fileUploader.getStats()
      const storageStats = await this.serverNetwork.fileStorage.getStats()

      socket.send('fileUploadStats', {
        uploader: stats,
        storage: storageStats
      })
    } catch (error) {
      logger.error('Failed to get file upload stats', { error: error.message })
      socket.send('fileUploadStats', {
        error: error.message
      })
    }
  }
}
