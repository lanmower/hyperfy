import { createRateLimiter } from '../middleware/RateLimiter.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'
import { MasterConfig } from '../config/MasterConfig.js'
import { getFileExtension } from '../../core/utils/getFileExtension.js'
import { createAssets } from '../assets.js'

const logger = LoggerFactory.get('Routes.Upload')

const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js'])

export async function registerUploadRoutes(fastify, assetsDir) {
  const assets = createAssets({ worldDir: assetsDir })
  await assets.init({ worldDir: assetsDir, rootDir: process.cwd() })

  fastify.post('/api/upload', {
    preHandler: createRateLimiter('upload'),
  }, async (req, reply) => {
    const timeoutManager = fastify.timeoutManager
    const circuitBreakerManager = fastify.circuitBreakerManager
    const uploadTimeout = timeoutManager ? timeoutManager.getTimeout('upload') : 120000
    const maxUploadSize = MasterConfig.uploads.maxFileSize

    const executeUpload = async () => {
      const filePromise = req.file()
      const file = await (timeoutManager
        ? timeoutManager.wrapPromise(filePromise, uploadTimeout, 'upload', 'file-upload')
        : filePromise)
      if (!file) {
        throw new Error('No file provided')
      }

      const ext = getFileExtension(file.filename)
      if (BLOCKED_EXTENSIONS.has(ext)) {
        throw new Error('File type not allowed')
      }

      const chunks = []
      let totalSize = 0
      for await (const chunk of file.file) {
        totalSize += chunk.length
        if (totalSize > maxUploadSize) {
          const error = new Error('File size exceeds maximum allowed')
          error.code = 'FILE_TOO_LARGE'
          throw error
        }
        chunks.push(chunk)
      }

      const mockFile = {
        arrayBuffer: async () => Buffer.concat(chunks),
        name: file.filename,
      }

      const result = await assets.upload(mockFile)
      return { success: true, hash: result.hash, filename: result.filename }
    }

    try {
      let result
      if (circuitBreakerManager && circuitBreakerManager.has('upload')) {
        result = await circuitBreakerManager.execute('upload', executeUpload)
      } else {
        result = await executeUpload()
      }
      return reply.code(200).send(result)
    } catch (error) {
      if (error.code === 'CIRCUIT_OPEN') {
        logger.error('Upload circuit breaker open', {})
        return ErrorResponseBuilder.sendError(reply, 'SERVICE_UNAVAILABLE', 'Upload service unavailable')
      }
      if (error.code === 'TIMEOUT') {
        logger.error('Upload timeout', { error: error.message })
        return ErrorResponseBuilder.sendError(reply, 'INTERNAL_ERROR', 'Upload timeout', { timeout: uploadTimeout })
      }
      if (error.code === 'FILE_TOO_LARGE') {
        return ErrorResponseBuilder.sendError(reply, 'INPUT_VALIDATION', error.message)
      }
      if (error.message === 'No file provided' || error.message === 'File type not allowed') {
        return ErrorResponseBuilder.sendError(reply, 'INPUT_VALIDATION', error.message)
      }
      logger.error('Upload failed', { error: error.message })
      return ErrorResponseBuilder.sendError(reply, 'INTERNAL_ERROR', 'Upload failed')
    }
  })

  fastify.get('/api/upload-check', async (req, reply) => {
    try {
      const { hash } = req.query

      if (!hash) {
        return ErrorResponseBuilder.sendError(reply, 'INPUT_VALIDATION', 'Hash parameter required')
      }

      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
        return ErrorResponseBuilder.sendError(reply, 'INPUT_VALIDATION', 'Invalid hash format')
      }

      const ext = req.query.ext || 'bin'
      const filename = `${hash}.${ext}`
      const exists = await assets.exists(filename)
      return reply.code(200).send({ exists })
    } catch (error) {
      logger.error('Upload check failed', { error: error.message })
      return ErrorResponseBuilder.sendError(reply, 'INTERNAL_ERROR', 'Check failed')
    }
  })
}
