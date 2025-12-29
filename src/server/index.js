import 'dotenv-flow/config'
import 'ses'
import '../core/lockdown'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

let __filename = fileURLToPath(import.meta.url)
if (__filename.startsWith('/') && __filename[2] === ':') {
  __filename = __filename.slice(1)
}
const __dirname = path.dirname(__filename)
import Fastify from 'fastify'
import ws from '@fastify/websocket'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import multipart from '@fastify/multipart'

import { World } from '../core/World.js'
import { getDB } from './db.js'
import { Storage } from './Storage.js'
import { initCollections } from './collections.js'
import { registerErrorRoutes } from './routes/ErrorRoutes.js'
import { registerUploadRoutes } from './routes/UploadRoutes.js'
import { registerStatusAPI } from './routes/StatusAPI.js'
import { registerAdminRoutes } from './routes/AdminRoutes.js'
import { registerStatusPageRoutes } from './routes/StatusPageRoutes.js'
import { ErrorTracker } from './logging/ErrorTracker.js'
import { createRequestIdMiddleware, createErrorHandler } from './middleware/RequestTracking.js'
import { setupGlobalErrorTracking } from './logging/IntegrationUtils.js'
import { AIProviderHealth } from './health/AIProviderHealth.js'
import { Telemetry } from './telemetry/Telemetry.js'
import { Metrics } from './services/Metrics.js'
import { TimeoutManager } from './services/TimeoutManager.js'
import { createTimeoutMiddleware } from './middleware/TimeoutMiddleware.js'
import { CircuitBreakerManager } from './resilience/CircuitBreakerManager.js'
import { DegradationManager } from './resilience/DegradationManager.js'
import { DegradationStrategies } from './resilience/DegradationStrategies.js'
import { ShutdownManager } from './resilience/ShutdownManager.js'
import { StatusPageData } from './services/StatusPageData.js'
import { CORSConfig } from './config/CORSConfig.js'

import { AIProviderConfig } from './config/AIProviderConfig.js'
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

const logger = new Logger({ name: 'Server', level: env === 'production' ? 'INFO' : 'DEBUG', logsDir })
logger.addSink(new ConsoleSink())
if (env === 'production') {
  logger.addSink(new FileSink(logsDir, 'server'))
}
await logger.init()

const corsConfig = new CORSConfig(logger)
const shutdownManager = new ShutdownManager(logger, {
  gracefulTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT) || 30000,
  forceTimeout: 5000,
})

const errorTracker = new ErrorTracker({ logger, samplingRate: env === 'production' ? 0.5 : 1.0 })
const metrics = new Metrics('Server')
const aiProviderHealth = new AIProviderHealth(logger)
if (process.env.ANTHROPIC_API_KEY) {
  aiProviderHealth.addProvider('anthropic', {
    apiKey: process.env.ANTHROPIC_API_KEY,
    healthEndpoint: AIProviderConfig.providers.anthropic.healthCheckEndpoint,
  })
}
if (process.env.OPENAI_API_KEY) {
  aiProviderHealth.addProvider('openai', {
    apiKey: process.env.OPENAI_API_KEY,
    healthEndpoint: AIProviderConfig.providers.openai.healthCheckEndpoint,
  })
}
if (process.env.XAI_API_KEY) {
  aiProviderHealth.addProvider('xai', {
    apiKey: process.env.XAI_API_KEY,
    healthEndpoint: AIProviderConfig.providers.xai.healthCheckEndpoint,
  })
}
if (process.env.GOOGLE_API_KEY) {
  aiProviderHealth.addProvider('google', {
    apiKey: process.env.GOOGLE_API_KEY,
    healthEndpoint: AIProviderConfig.providers.google.healthCheckEndpoint,
  })
}

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

setupGlobalErrorTracking(logger, errorTracker)

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

  const db = await getDB(worldDir, timeoutManager, circuitBreakerManager)
  const storage = new Storage(path.join(worldDir, '/storage.json'), circuitBreakerManager)

  world = new World()
  world.isServer = true
  world.assetsUrl = process.env.PUBLIC_ASSETS_URL
  world.collections.deserialize(collections)

  const { ServerNetwork } = await import('../core/systems/ServerNetwork.js')
  const { ServerLiveKit } = await import('../core/systems/ServerLiveKit.js')
  world.register('network', ServerNetwork)
  world.register('livekit', ServerLiveKit)

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
    aiProviderHealth,
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
fastify.aiProviderHealth = aiProviderHealth
fastify.timeoutManager = timeoutManager
fastify.circuitBreakerManager = circuitBreakerManager
fastify.degradationManager = degradationManager
fastify.statusPageData = statusPageData
fastify.corsConfig = corsConfig
fastify.shutdownManager = shutdownManager

async function worldNetwork(fastify) {
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
}

fastify.register(createRequestIdMiddleware())
fastify.register(createErrorHandler(logger, errorTracker))
fastify.register(createTimeoutMiddleware(timeoutManager))

fastify.addHook('onSend', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'SAMEORIGIN')
  reply.header('X-XSS-Protection', '1; mode=block')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.header('Permissions-Policy', 'microphone=(), camera=(), geolocation=()')
})

const corsOptions = corsConfig.getCORSOptions()
fastify.register(cors, corsOptions)
logger.info('[CORS] CORS configuration registered', {
  origins: corsConfig.allowedOrigins.length,
  methods: corsConfig.allowedMethods.length,
  environment: env,
})

fastify.addHook('onRequest', async (request, reply) => {
  if (shutdownManager.isShuttingDown) {
    const isHealthEndpoint = request.url.startsWith('/health') || request.url === '/metrics'
    if (!isHealthEndpoint) {
      return reply.code(503).send({
        error: 'Service Unavailable',
        message: 'Server is shutting down',
        statusCode: 503,
      })
    }
  }

  const origin = request.headers.origin
  if (origin && !corsConfig.isOriginAllowed(origin)) {
    const isHealthEndpoint = request.url.startsWith('/health') || request.url === '/metrics'
    if (!isHealthEndpoint) {
      logger.warn(`[CORS] Blocked request from non-whitelisted origin: ${origin}`, {
        url: request.url,
        method: request.method,
      })
      corsConfig.logRejectedRequest(origin)
      reply.code(403).send({
        error: 'Forbidden',
        message: `CORS policy: Origin ${origin} is not allowed`,
        statusCode: 403,
      })
    }
  }
})

fastify.register(compress)
fastify.register(multipart, {
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
})
fastify.register(ws)
fastify.register(worldNetwork)

registerErrorRoutes(fastify, world)
registerUploadRoutes(fastify, assetsDir)
registerStatusRoutes(fastify, world)
registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager })
registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager })
registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager })
registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager })
registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager })

fastify.get('/', async (req, reply) => {
  const title = world.settings.title || 'World'
  const desc = world.settings.desc || ''
  const image = world.resolveURL(world.settings.image?.url) || ''
  const url = process.env.PUBLIC_ASSETS_URL
  const filePath = path.join(__dirname, '../build/public', 'index.html')
  let html = fs.readFileSync(filePath, 'utf-8')

  const buildDir = path.join(__dirname, '../build/public')
  const files = fs.readdirSync(buildDir)
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'))
  const particlesFile = files.find(f => f.startsWith('particles-') && f.endsWith('.js'))

  html = html.replace('{jsPath}', jsFile ? '/' + jsFile : '/index.js')
  html = html.replace('{particlesPath}', particlesFile ? '/' + particlesFile : '/particles.js')
  html = html.replaceAll('{buildId}', Date.now())
  html = html.replaceAll('{url}', url)
  html = html.replaceAll('{title}', title)
  html = html.replaceAll('{desc}', desc)
  html = html.replaceAll('{image}', image)
  reply.type('text/html').send(html)
})
fastify.register(statics, {
  root: path.join(__dirname, '../build/public'),
  prefix: '/',
  decorateReply: false,
  setHeaders: res => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  },
})
fastify.register(statics, {
  root: assetsDir,
  prefix: '/assets/',
  decorateReply: false,
  setHeaders: res => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString()) // older browsers
  },
})

const publicEnvs = {}
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    const value = process.env[key]
    publicEnvs[key] = value
  }
}
const envsCode = `
  if (!globalThis.env) globalThis.env = {}
  globalThis.env = ${JSON.stringify(publicEnvs)}
`
fastify.get('/env.js', async (req, reply) => {
  reply.type('application/javascript').send(envsCode)
})

async function startServer(retries = 10) {
  try {
    await fastify.listen({ port, host: '0.0.0.0', exclusive: false })
    logger.info(`Server running on port ${port}`, { port, env })
    metrics.gauge('server.port', port)
    aiProviderHealth.start()
    telemetry.start()

    shutdownManager.addShutdownHandler('cache', async () => {
      if (world?.db?.cache) {
        logger.info('[SHUTDOWN] Closing cache')
        if (world.db.cache.cache && typeof world.db.cache.cache.close === 'function') {
          await world.db.cache.cache.close()
        }
      }
    }, 90)

    shutdownManager.addShutdownHandler('database', async () => {
      if (world?.db) {
        logger.info('[SHUTDOWN] Closing database')
      }
    }, 80)

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

    shutdownManager.addShutdownHandler('aiProviderHealth', async () => {
      logger.info('[SHUTDOWN] Stopping AI provider health')
      aiProviderHealth.stop()
    }, 50)

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
      return startServer(retries - 1)
    }
    logger.critical(`Failed to launch on port ${port}: ${err.message}`)
    errorTracker.captureException(err, { category: 'ServerStartup', module: 'Server', port })
    process.exit(1)
  }
}

await startServer()

async function shutdown(signal) {
  errorTracker.addBreadcrumb('Server Shutdown', { signal })
  const result = await shutdownManager.shutdown(signal)
  process.exit(result.code)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('uncaughtException', (err) => {
  logger.critical(`Uncaught Exception: ${err.message}`, { stack: err.stack })
  errorTracker.captureException(err, { category: 'UncaughtException', module: 'Server' })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${String(reason)}`, { promise: String(promise) })
  if (reason instanceof Error) {
    errorTracker.captureException(reason, { category: 'UnhandledRejection', module: 'Server' })
  }
})
