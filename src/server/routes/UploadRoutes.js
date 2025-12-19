import path from 'path'
import fs from 'fs-extra'
import { hashFile } from '../../core/utils.js'

export function registerUploadRoutes(fastify, assetsDir) {
  fastify.post('/api/upload', async (req, reply) => {
    const file = await req.file()
    const ext = file.filename.split('.').pop().toLowerCase()
    const chunks = []
    for await (const chunk of file.file) {
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
  })

  fastify.get('/api/upload-check', async (req, reply) => {
    const filename = req.query.filename
    const filePath = path.join(assetsDir, filename)
    const exists = await fs.exists(filePath)
    return { exists }
  })
}
