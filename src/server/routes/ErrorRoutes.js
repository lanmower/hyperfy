export function registerErrorRoutes(fastify, world) {
  fastify.get('/api/errors', async (request, reply) => {
    try {
      const { limit, type, since, side, critical } = request.query
      const options = {}
      if (limit) options.limit = parseInt(limit)
      if (type) options.type = type
      if (since) options.since = since
      if (side) options.side = side
      if (critical !== undefined) options.critical = critical === 'true'

      if (!world.errorMonitor) {
        return reply.code(503).send({ error: 'Error monitoring not available' })
      }

      const errors = world.errorMonitor.getErrors(options)
      const stats = world.errorMonitor.getStats()

      return reply.code(200).send({
        errors,
        stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error endpoint failed:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.post('/api/errors/clear', async (request, reply) => {
    try {
      if (!world.errorMonitor) {
        return reply.code(503).send({ error: 'Error monitoring not available' })
      }

      const count = world.errorMonitor.clearErrors()

      return reply.code(200).send({
        cleared: count,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error clear endpoint failed:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/errors/stream', { websocket: true }, (ws, req) => {
    if (!world.errorMonitor) {
      ws.close(1011, 'Error monitoring not available')
      return
    }

    const cleanup = world.errorMonitor.addListener((event, data) => {
      try {
        ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }))
      } catch (err) {
      }
    })

    ws.on('close', cleanup)
    ws.on('error', cleanup)

    try {
      ws.send(JSON.stringify({
        event: 'connected',
        data: {
          stats: world.errorMonitor.getStats(),
          recentErrors: world.errorMonitor.getErrors({ limit: 10 })
        },
        timestamp: new Date().toISOString()
      }))
    } catch (err) {
      cleanup()
    }
  })
}
