import path from 'path'
import fs from 'fs-extra'
import { hashFile } from '../../core/utils.js'
import { createRateLimiter } from '../middleware/RateLimiter.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('UploadRoutes')
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js'])

export function registerUploadRoutes(fastify, assetsDir) {
  fastify.post('/api/upload', {
    preHandler: createRateLimiter('upload'),
  }, async (req, reply) => {
    const timeoutManager = fastify.timeoutManager
    const circuitBreakerManager = fastify.circuitBreakerManager
    const uploadTimeout = timeoutManager ? timeoutManager.getTimeout('upload') : 120000

    const executeUpload = async () => {
      const filePromise = req.file()
      const file = await (timeoutManager
        ? timeoutManager.wrapPromise(filePromise, uploadTimeout, 'upload', 'file-upload')
        : filePromise)
      if (!file) {
        throw new Error('No file provided')
      }

      const ext = file.filename.split('.').pop().toLowerCase()
      if (BLOCKED_EXTENSIONS.has(ext)) {
        throw new Error('File type not allowed')
      }

      const chunks = []
      let totalSize = 0
      for await (const chunk of file.file) {
        totalSize += chunk.length
        if (totalSize > MAX_UPLOAD_SIZE) {
          const error = new Error('File size exceeds maximum allowed')
          error.code = 'FILE_TOO_LARGE'
          throw error
        }
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)
      const hash = await hashFile(buffer)
      const filename = `${hash}.${ext}`
      const filePath = path.join(assetsDir, filename)

      const exists = await fs.exists(filePath)
      if (!exists) {
        await fs.writeFile(filePath, buffer)
      }

      return { success: true, hash }
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
        return reply.code(503).send({ error: 'Upload service unavailable' })
      }
      if (error.code === 'TIMEOUT') {
        logger.error('Upload timeout', { error: error.message })
        return reply.code(408).send({ error: 'Upload timeout', message: error.message })
      }
      if (error.code === 'FILE_TOO_LARGE') {
        return reply.code(413).send({ error: error.message })
      }
      if (error.message === 'No file provided' || error.message === 'File type not allowed') {
        return reply.code(400).send({ error: error.message })
      }
      logger.error('Upload failed', { error: error.message })
      return reply.code(500).send({ error: 'Upload failed' })
    }
  })

  fastify.get('/api/upload-check', async (req, reply) => {
    try {
      const { hash } = req.query

      if (!hash) {
        return reply.code(400).send({ error: 'Hash parameter required' })
      }

      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
        return reply.code(400).send({ error: 'Invalid hash format' })
      }

      const filename = hash.substring(0, 2) + '/' + hash.substring(2)
      const filePath = path.resolve(path.join(assetsDir, filename))

      if (!filePath.startsWith(path.resolve(assetsDir))) {
        return reply.code(400).send({ error: 'Invalid path' })
      }

      const exists = await fs.exists(filePath)
      return reply.code(200).send({ exists })
    } catch (error) {
      logger.error('Upload check failed', { error: error.message })
      return reply.code(500).send({ error: 'Check failed' })
    }
  })
}
