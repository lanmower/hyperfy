// WebSocket network plugin for multiplayer connectivity
export async function registerWorldNetwork(fastify, world, logger, shutdownManager, errorTracker) {
  fastify.register(async function(fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      const ws = connection.socket || connection

      if (!shutdownManager.isAcceptingConnections()) {
        logger.warn('WS Connection rejected: server shutting down')
        ws.close(1001, 'Server shutting down')
        return
      }

      if (!world.network) {
        logger.error('WS Connection rejected: world.network not initialized')
        ws.close(1002, 'Server error: network not ready')
        return
      }

      logger.info('WS Connection established')

      ws.on('close', () => {
        logger.info('WS Connection closed')
      })

      world.network.onConnection(ws, req.query)
    })
  })
}
