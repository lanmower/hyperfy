export async function registerWorldNetwork(fastify, world, logger, shutdownManager, errorTracker) {
  fastify.register(async function(fastify) {
    fastify.get('/ws', { websocket: true }, (ws, req) => {
      if (!shutdownManager.isAcceptingConnections()) {
        logger.warn('WS Connection rejected: server shutting down')
        ws.close(1001, 'Server shutting down')
        return
      }

      logger.info('WS Connection received')
      errorTracker.addBreadcrumb('WebSocket Connection', { query: req.query })
      shutdownManager.registerWebSocket(ws)

      ws.on('close', () => {
        shutdownManager.unregisterWebSocket(ws)
      })

      world.network.onConnection(ws, req.query)
    })
  })
}
