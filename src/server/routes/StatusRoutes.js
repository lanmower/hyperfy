export function registerStatusRoutes(fastify, world) {
  fastify.get('/health', async (request, reply) => {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }

      return reply.code(200).send(health)
    } catch (error) {
      console.error('Health check failed:', error)
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/status', async (request, reply) => {
    try {
      const status = {
        uptime: Math.round(world.time),
        protected: process.env.ADMIN_CODE !== undefined ? true : false,
        connectedUsers: [],
        commitHash: process.env.COMMIT_HASH,
      }
      for (const socket of world.network.sockets.values()) {
        status.connectedUsers.push({
          id: socket.player.data.userId,
          position: socket.player.position.value.toArray(),
          name: socket.player.data.name,
        })
      }

      return reply.code(200).send(status)
    } catch (error) {
      console.error('Status failed:', error)
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  })
}
