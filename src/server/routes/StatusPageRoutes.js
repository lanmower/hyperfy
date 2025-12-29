import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function registerStatusPageRoutes(fastify, statusPageData) {
  fastify.get('/api/status', async (request, reply) => {
    try {
      const fullStatus = statusPageData.getFullStatus()
      return reply.code(200).send(fullStatus)
    } catch (err) {
      fastify.logger?.error(`Status API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/status/summary', async (request, reply) => {
    try {
      const summary = statusPageData.getSummary()
      return reply.code(200).send(summary)
    } catch (err) {
      fastify.logger?.error(`Status summary API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/status/services', async (request, reply) => {
    try {
      const services = statusPageData.getServiceHealth()
      return reply.code(200).send({
        services,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      fastify.logger?.error(`Status services API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/status/history', async (request, reply) => {
    try {
      const limit = parseInt(request.query.limit) || 100
      const history = statusPageData.getIncidentHistory(limit)
      return reply.code(200).send({
        history,
        count: history.length,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      fastify.logger?.error(`Status history API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/status/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendUpdate = () => {
      try {
        const status = statusPageData.getSummary()
        reply.raw.write(`data: ${JSON.stringify(status)}\n\n`)
      } catch (err) {
        fastify.logger?.error(`SSE update failed: ${err.message}`)
      }
    }

    sendUpdate()
    const interval = setInterval(sendUpdate, 10000)

    request.raw.on('close', () => {
      clearInterval(interval)
    })
  })

  fastify.get('/status', async (request, reply) => {
    try {
      let htmlPath = path.join(__dirname, '../../build/public/status.html')

      if (!fs.existsSync(htmlPath)) {
        htmlPath = path.join(__dirname, '../../../public/status.html')
      }

      if (!fs.existsSync(htmlPath)) {
        return reply.code(404).send({
          error: 'Status page not found',
          timestamp: new Date().toISOString(),
        })
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      return reply.type('text/html').send(html)
    } catch (err) {
      fastify.logger?.error(`Status page failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })
}
