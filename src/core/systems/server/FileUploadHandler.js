import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FileUploadHandler')

export class FileUploadHandler {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  onFileUpload = async (socket, data) => {
    try {
      const { buffer, filename, mimeType, metadata } = data
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
