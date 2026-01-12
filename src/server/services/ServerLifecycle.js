import { closeDB } from '../db.js'

export async function startServer(fastify, port, logger, metrics, telemetry, shutdownManager, world, degradationManager, errorTracker, retries = 10) {
  try {
    logger.info(`Attempting to start Fastify server on port ${port}...`)
    await fastify.listen({ port, host: '0.0.0.0' })
    logger.info(`Fastify.listen() completed successfully`)
    logger.info(`Server running on port ${port}`, { port, env: process.env.NODE_ENV || 'development' })
    metrics.gauge('server.port', port)
    telemetry.start()

    let gameLoopId = null
    let lastFrameTime = performance.now()
    const TARGET_FPS = 60
    const FRAME_TIME = 1000 / TARGET_FPS

    const gameLoop = () => {
      const now = performance.now()
      const elapsed = now - lastFrameTime

      if (elapsed >= FRAME_TIME) {
        try {
          world.tick(now)
        } catch (err) {
          logger.error('Game loop error', { error: err.message })
        }
        lastFrameTime = now
      }

      gameLoopId = setTimeout(gameLoop, 1)
    }

    gameLoopId = setTimeout(gameLoop, 1)
    logger.info('Server game loop started', { targetFps: TARGET_FPS })

    shutdownManager.addShutdownHandler('gameLoop', async () => {
      if (gameLoopId) {
        clearTimeout(gameLoopId)
        logger.info('[SHUTDOWN] Stopping game loop')
      }
    }, 85)

    shutdownManager.addShutdownHandler('cache', async () => {
      if (world?.db?.cache) {
        logger.info('[SHUTDOWN] Closing cache')
        if (world.db.cache.cache && typeof world.db.cache.cache.close === 'function') {
          await world.db.cache.cache.close()
        }
      }
    }, 80)

    shutdownManager.addShutdownHandler('database', async () => {
      logger.info('[SHUTDOWN] Closing database')
      await closeDB()
    }, 75)

    shutdownManager.addShutdownHandler('storage', async () => {
      if (world?.storage) {
        logger.info('[SHUTDOWN] Persisting storage')
        await world.storage.persist()
      }
    }, 70)

    shutdownManager.addShutdownHandler('telemetry', async () => {
      logger.info('[SHUTDOWN] Stopping telemetry')
      telemetry.stop()
    }, 60)

    shutdownManager.addShutdownHandler('degradationManager', async () => {
      logger.info('[SHUTDOWN] Shutting down degradation manager')
      degradationManager.shutdown()
    }, 40)

    shutdownManager.addShutdownHandler('fastify', async () => {
      logger.info('[SHUTDOWN] Closing Fastify server')
      if (fastify.server) {
        fastify.server.close()
      }
      await fastify.close()
    }, 30)

    shutdownManager.addShutdownHandler('logger', async () => {
      logger.info('[SHUTDOWN] Flushing logs')
      await logger.flush()
    }, 10)

    logger.info('AI provider health checks and telemetry started')
  } catch (err) {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      logger.warn(`Port ${port} in use, retrying in 2s...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return startServer(fastify, port, logger, metrics, telemetry, shutdownManager, world, degradationManager, errorTracker, retries - 1)
    }
    logger.error(`Failed to launch on port ${port}: ${err.message}`)
    errorTracker.captureException(err, { category: 'ServerStartup', module: 'Server', port })
    process.exit(1)
  }
}

export async function shutdown(shutdownManager, errorTracker, signal) {
  errorTracker.addBreadcrumb('Server Shutdown', { signal })
  const result = await shutdownManager.shutdown(signal)
  process.exit(result.code)
}

export function registerSignalHandlers(shutdownManager, errorTracker, logger) {
  process.on('SIGINT', () => shutdown(shutdownManager, errorTracker, 'SIGINT'))
  process.on('SIGTERM', () => shutdown(shutdownManager, errorTracker, 'SIGTERM'))

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack })
    errorTracker.captureException(err, { category: 'UncaughtException', module: 'Server' })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection: ${String(reason)}`, { promise: String(promise) })
    if (reason instanceof Error) {
      errorTracker.captureException(reason, { category: 'UnhandledRejection', module: 'Server' })
    }
  })
}
