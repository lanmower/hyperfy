import 'dotenv-flow/config'
import 'ses'
import '../core/lockdown'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

let __filename = fileURLToPath(import.meta.url)
if (__filename.startsWith('/') && __filename[2] === ':') {
  __filename = __filename.slice(1)
}
const __dirname = path.dirname(__filename)
import Fastify from 'fastify'

import { World } from '../core/World.js'
import { getDB } from './db.js'
import { Storage } from './Storage.js'
import { initCollections } from './collections.js'
import { registerRoutes } from './routes/index.js'
import { createDbProxy } from "../core/services/DatabaseProxy.js"
import { Telemetry } from './telemetry/Telemetry.js'
import { Metrics } from './services/Metrics.js'
import { TimeoutManager } from './services/TimeoutManager.js'
import { CircuitBreakerManager } from './resilience/CircuitBreakerManager.js'
import { DegradationManager } from './resilience/DegradationManager.js'
import { DegradationStrategies } from './resilience/DegradationStrategies.js'
import { ShutdownManager } from './resilience/ShutdownManager.js'
import { StatusPageData } from './services/StatusPageData.js'
import { CORSConfig } from './config/CORSConfig.js'
import { ServerLogger, ConsoleSink, FileSink } from '../core/utils/logging/index.js'
import { ErrorTracker } from './services/ErrorTracker.js'
import { registerMiddleware } from './middleware/ServerMiddleware.js'
import { registerWorldNetwork } from './plugins/WorldNetworkPlugin.js'
import { registerStaticAssets, registerEnvEndpoint } from './routes/StaticAssets.js'
import { startServer, registerSignalHandlers } from './services/ServerLifecycle.js'
global.SERVER_START_TIME = Date.now()

const rootDir = path.join(__dirname, '../')
const worldDir = path.join(rootDir, process.env.WORLD || 'world')
const assetsDir = path.join(worldDir, '/assets')
const collectionsDir = path.join(worldDir, '/collections')
const logsDir = path.join(worldDir, '/logs')
const port = process.env.PORT || 3000
const env = process.env.NODE_ENV || 'development'

await fs.ensureDir(worldDir)
await fs.ensureDir(assetsDir)
await fs.ensureDir(collectionsDir)
await fs.ensureDir(logsDir)

await fs.copy(path.join(rootDir, 'src/world/assets'), path.join(assetsDir))
await fs.copy(path.join(rootDir, 'src/world/collections'), path.join(collectionsDir))

const logger = new ServerLogger({ name: 'Server', level: env === 'production' ? 'INFO' : 'DEBUG', logsDir })
logger.addSink(new ConsoleSink())
if (env === 'production') {
  logger.addSink(new FileSink(logsDir, 'server'))
}
await logger.init()

const corsConfig = new CORSConfig()
await corsConfig.init()
const shutdownManager = new ShutdownManager(logger, {
  gracefulTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT) || 30000,
  forceTimeout: 5000,
})

const errorTracker = new ErrorTracker({ logger, samplingRate: env === 'production' ? 0.5 : 1.0 })
const metrics = new Metrics('Server')

const telemetry = new Telemetry(logger, {
  batchInterval: 60000,
  endpoint: process.env.TELEMETRY_ENDPOINT || null,
  enabled: process.env.TELEMETRY_ENABLED !== 'false',
})

const timeoutManager = new TimeoutManager()
if (process.env.HTTP_TIMEOUT) timeoutManager.setTimeouts({ http: parseInt(process.env.HTTP_TIMEOUT) })
if (process.env.WS_TIMEOUT) timeoutManager.setTimeouts({ websocket: parseInt(process.env.WS_TIMEOUT) })
if (process.env.UPLOAD_TIMEOUT) timeoutManager.setTimeouts({ upload: parseInt(process.env.UPLOAD_TIMEOUT) })
if (process.env.DB_TIMEOUT) timeoutManager.setTimeouts({ database: parseInt(process.env.DB_TIMEOUT) })

const circuitBreakerManager = new CircuitBreakerManager()
circuitBreakerManager.register('database', {
  failureThreshold: parseInt(process.env.DB_CIRCUIT_FAILURE_THRESHOLD) || 5,
  successThreshold: parseInt(process.env.DB_CIRCUIT_SUCCESS_THRESHOLD) || 2,
  timeout: parseInt(process.env.DB_CIRCUIT_TIMEOUT) || 60000,
})
circuitBreakerManager.register('storage', {
  failureThreshold: parseInt(process.env.STORAGE_CIRCUIT_FAILURE_THRESHOLD) || 5,
  successThreshold: parseInt(process.env.STORAGE_CIRCUIT_SUCCESS_THRESHOLD) || 2,
  timeout: parseInt(process.env.STORAGE_CIRCUIT_TIMEOUT) || 60000,
})
circuitBreakerManager.register('websocket', {
  failureThreshold: parseInt(process.env.WS_CIRCUIT_FAILURE_THRESHOLD) || 10,
  successThreshold: parseInt(process.env.WS_CIRCUIT_SUCCESS_THRESHOLD) || 3,
  timeout: parseInt(process.env.WS_CIRCUIT_TIMEOUT) || 30000,
})
circuitBreakerManager.register('upload', {
  failureThreshold: parseInt(process.env.UPLOAD_CIRCUIT_FAILURE_THRESHOLD) || 5,
  successThreshold: parseInt(process.env.UPLOAD_CIRCUIT_SUCCESS_THRESHOLD) || 2,
  timeout: parseInt(process.env.UPLOAD_CIRCUIT_TIMEOUT) || 90000,
})

let world
let degradationManager
let statusPageData
try {
  logger.info('Initializing server...')
  const collections = await initCollections({ collectionsDir, assetsDir })

  const { importApp } = await import('../core/extras/appTools.js')
  const sceneHypPath = path.join(rootDir, 'src/world/scene.hyp')
  if (fs.existsSync(sceneHypPath)) {
    const sceneHypBuffer = fs.readFileSync(sceneHypPath)
    const sceneHypFile = new File([sceneHypBuffer], 'scene.hyp', { type: 'application/octet-stream' })
    const sceneApp = await importApp(sceneHypFile)
    if (sceneApp.blueprint) {
      const sceneBlueprint = { ...sceneApp.blueprint, id: '$scene' }
      collections.push({
        id: 'scene',
        name: 'Scene',
        blueprints: [sceneBlueprint],
      })
      logger.info('Scene blueprint loaded from scene.hyp')
    }
  }

  let db = await getDB(worldDir, timeoutManager, circuitBreakerManager)
  db = createDbProxy(db)
  const storage = new Storage(path.join(worldDir, '/storage.json'), circuitBreakerManager)

  world = new World()
  world.isServer = true
  world.assetsUrl = process.env.PUBLIC_ASSETS_URL

  const { Collections } = await import('../core/systems/Collections.js')
  const { BlueprintManager } = await import('../core/systems/BlueprintManager.js')
  const { Entities } = await import('../core/systems/Entities.js')
  const { ServerNetwork } = await import('../core/systems/ServerNetwork.js')
  const { Settings } = await import("../core/systems/Settings.js")
  const { ServerLiveKit } = await import('../core/systems/ServerLiveKit.js')
  world.register('collections', Collections)
  world.register("settings", Settings)
  world.register('blueprints', BlueprintManager)
  world.register('entities', Entities)
  world.register('network', ServerNetwork)
  world.register('livekit', ServerLiveKit)
  world.collections.deserialize(collections)

  world.init({ db, storage, assetsDir })

  if (world.network && world.network.socketManager) {
    world.network.socketManager.setCircuitBreakerManager(circuitBreakerManager)
  }

  const degradationStrategies = DegradationStrategies.createAllStrategies(world, logger)
  degradationManager = new DegradationManager(circuitBreakerManager, degradationStrategies)

  statusPageData = new StatusPageData(
    world,
    logger,
    errorTracker,
    null,
    circuitBreakerManager,
    degradationManager,
    timeoutManager
  )

  logger.info('Server initialization complete', {
    entities: world.entities?.list?.length || 0,
    blueprints: world.blueprints?.list?.length || 0,
  })
} catch (err) {
  logger.critical(`Server initialization failed: ${err.message}`, { stack: err.stack })
  errorTracker.captureException(err, { category: 'Initialization', module: 'Server' })
  process.exit(1)
}

const fastify = Fastify({
  logger: { level: 'error' },
  trust: parseInt(process.env.TRUST_PROXY_HOPS) || 1,
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

registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager)
await registerWorldNetwork(fastify, world, logger, shutdownManager, errorTracker)

registerRoutes(fastify, world, assetsDir)
registerStaticAssets(fastify, __dirname, assetsDir, world)
registerEnvEndpoint(fastify)

await startServer(fastify, port, logger, metrics, telemetry, shutdownManager, world, degradationManager, errorTracker)
registerSignalHandlers(shutdownManager, errorTracker, logger)
