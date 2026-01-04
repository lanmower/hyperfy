export async function registerWorldNetwork(fastify, world, logger, shutdownManager, errorTracker) {
  fastify.register(async function(fastify) {
    fastify.get('/ws', { websocket: true }, (ws, req) => {
      if (!shutdownManager.isAcceptingConnections()) {
        logger.warn('WS Connection rejected: server shutting down')
        ws.close(1001, 'Server shutting down')
        return
      }

      logger.info('WS Connection received', { wsType: typeof ws, wsMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(ws)).slice(0, 10) })

      ws.on('close', () => {
        logger.info('WS Connection closed')
      })

      world.network.onConnection(ws, req.query)
    })
  })
}
