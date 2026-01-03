import 'dotenv-flow/config'
import '../core/lockdown.js'
import './bootstrap.js'
import { validateEnvironment } from './config/EnvValidator.js'

validateEnvironment()

import path from 'path'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import { ServerInitializer } from './ServerInitializer.js'
import { registerMiddleware } from './middleware/ServerMiddleware.js'
import { registerWorldNetwork } from './plugins/WorldNetworkPlugin.js'
import { registerRoutes } from './routes/index.js'
import { registerStaticAssets, registerEnvEndpoint } from './routes/StaticAssets.js'
import { startServer, registerSignalHandlers } from './services/ServerLifecycle.js'
import { ServerHMR } from './dev/ServerHMR.js'
import { initHMRBridge } from './dev/HMRBridge.js'

global.SERVER_START_TIME = Date.now()

let __filename = fileURLToPath(import.meta.url)
if (__filename.startsWith('/') && __filename[2] === ':') {
  __filename = __filename.slice(1)
}
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '../../')
const port = process.env.PORT || 3000
const env = process.env.NODE_ENV || 'development'

const initializer = new ServerInitializer(rootDir, env)
await initializer.preparePaths()

const logger = initializer.setupLogger()
const corsConfig = initializer.setupCORSConfig()
await corsConfig.init()

const shutdownManager = initializer.setupShutdownManager(logger)
const errorTracker = initializer.setupErrorTracking(logger)
const metrics = initializer.setupMetrics()
const telemetry = initializer.setupTelemetry(logger)
const timeoutManager = initializer.setupTimeoutManager()
const circuitBreakerManager = initializer.setupCircuitBreakerManager()

let world, degradationManager, statusPageData
try {
  logger.info('Initializing server...')
  const result = await initializer.initializeWorld(logger, errorTracker, timeoutManager, circuitBreakerManager)
  world = result.world
  degradationManager = result.degradationManager
  statusPageData = result.statusPageData
} catch (err) {
  logger.error(`Server initialization failed: ${err.message}`, { stack: err.stack })
  errorTracker.captureException(err, { category: 'Initialization', module: 'Server' })
  process.exit(1)
}

const fastify = Fastify({
  logger: { level: 'error' },
  trust: parseInt(process.env.TRUST_PROXY_HOPS, 10) || 1,
  bodyLimit: 52428800,
})

fastify.metrics = metrics
fastify.errorTracker = errorTracker
fastify.logger = logger
fastify.telemetry = telemetry
fastify.timeoutManager = timeoutManager
fastify.circuitBreakerManager = circuitBreakerManager
fastify.degradationManager = degradationManager
fastify.statusPageData = statusPageData
fastify.corsConfig = corsConfig
fastify.shutdownManager = shutdownManager

await registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager)
await registerWorldNetwork(fastify, world, logger, shutdownManager, errorTracker)

await registerRoutes(fastify, world, initializer.assetsDir)
registerEnvEndpoint(fastify)
registerStaticAssets(fastify, __dirname, initializer.assetsDir, world)

let hmr = null
if (process.env.NODE_ENV === 'development') {
  await new Promise(resolve => {
    fastify.ready(() => {
      hmr = new ServerHMR(fastify.server)
      fastify.hmr = hmr
      initHMRBridge(fastify)
      logger.info('HMR server initialized')
      resolve()
    })
  })
}

await startServer(fastify, port, logger, metrics, telemetry, shutdownManager, world, degradationManager, errorTracker)
registerSignalHandlers(shutdownManager, errorTracker, logger)
