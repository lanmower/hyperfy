// Server restart trigger
import fs from 'fs-extra'
import path from 'path'
import { createServerWorld } from '../core/createServerWorld.js'
import { getDB } from './db.js'
import { Storage } from './Storage.js'
import { initCollections } from './collections.js'
import { createDbProxy } from '../core/services/DatabaseProxy.js'
import { Telemetry } from './telemetry/Telemetry.js'
import { Metrics } from './services/Metrics.js'
import { TimeoutManager } from './services/TimeoutManager.js'
import { CircuitBreakerManager } from './resilience/CircuitBreakerManager.js'
import { DegradationManager } from './resilience/DegradationManager.js'
import { DegradationStrategies } from './resilience/DegradationStrategies.js'
import { ShutdownManager } from './resilience/ShutdownManager.js'
import { StatusPageData } from './services/StatusPageData.js'
import { CORSConfig } from './config/CORSConfig.js'
import { StructuredLogger, LoggerFactory } from '../core/utils/logging/index.js'
import { ConsoleSink, FileSink } from '../core/utils/logging/ServerLogger.js'
import { ErrorTracker } from './services/ErrorTracker.js'

export class ServerInitializer {
  constructor(rootDir, env) {
    this.rootDir = rootDir
    this.env = env
    this.worldDir = path.join(rootDir, process.env.WORLD || 'world')
    this.assetsDir = path.join(this.worldDir, '/assets')
    this.collectionsDir = path.join(this.worldDir, '/collections')
    this.logsDir = path.join(this.worldDir, '/logs')
  }

  async preparePaths() {
    await fs.ensureDir(this.worldDir)
    await fs.ensureDir(this.assetsDir)
    await fs.ensureDir(this.collectionsDir)
    await fs.ensureDir(this.logsDir)
    await fs.copy(path.join(this.rootDir, 'src/world/assets'), this.assetsDir)
    await fs.copy(path.join(this.rootDir, 'src/world/collections'), this.collectionsDir)
  }

  setupLogger() {
    const logger = LoggerFactory.get('Server')
    logger.minLevel = this.env === 'production' ? 2 : 1
    logger.addSink(new ConsoleSink())
    if (this.env === 'production') {
      logger.addSink(new FileSink(this.logsDir, 'server'))
    }
    return logger
  }

  setupCORSConfig() {
    return new CORSConfig()
  }

  setupShutdownManager(logger) {
    return new ShutdownManager(logger, {
      gracefulTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT, 10) || 30000,
      forceTimeout: 5000,
    })
  }

  setupErrorTracking(logger) {
    return new ErrorTracker({ logger, samplingRate: this.env === 'production' ? 0.5 : 1.0 })
  }

  setupMetrics() {
    return new Metrics('Server')
  }

  setupTelemetry(logger) {
    return new Telemetry(logger, {
      batchInterval: 60000,
      endpoint: process.env.TELEMETRY_ENDPOINT || null,
      enabled: process.env.TELEMETRY_ENABLED !== 'false',
    })
  }

  setupTimeoutManager() {
    const timeoutManager = new TimeoutManager()
    if (process.env.HTTP_TIMEOUT) timeoutManager.setTimeouts({ http: parseInt(process.env.HTTP_TIMEOUT, 10) })
    if (process.env.WS_TIMEOUT) timeoutManager.setTimeouts({ websocket: parseInt(process.env.WS_TIMEOUT, 10) })
    if (process.env.UPLOAD_TIMEOUT) timeoutManager.setTimeouts({ upload: parseInt(process.env.UPLOAD_TIMEOUT, 10) })
    if (process.env.DB_TIMEOUT) timeoutManager.setTimeouts({ database: parseInt(process.env.DB_TIMEOUT, 10) })
    return timeoutManager
  }

  setupCircuitBreakerManager() {
    const manager = new CircuitBreakerManager()
    manager.register('database', {
      failureThreshold: parseInt(process.env.DB_CIRCUIT_FAILURE_THRESHOLD, 10) || 5,
      successThreshold: parseInt(process.env.DB_CIRCUIT_SUCCESS_THRESHOLD, 10) || 2,
      timeout: parseInt(process.env.DB_CIRCUIT_TIMEOUT, 10) || 60000,
    })
    manager.register('storage', {
      failureThreshold: parseInt(process.env.STORAGE_CIRCUIT_FAILURE_THRESHOLD, 10) || 5,
      successThreshold: parseInt(process.env.STORAGE_CIRCUIT_SUCCESS_THRESHOLD, 10) || 2,
      timeout: parseInt(process.env.STORAGE_CIRCUIT_TIMEOUT, 10) || 60000,
    })
    manager.register('websocket', {
      failureThreshold: parseInt(process.env.WS_CIRCUIT_FAILURE_THRESHOLD, 10) || 10,
      successThreshold: parseInt(process.env.WS_CIRCUIT_SUCCESS_THRESHOLD, 10) || 3,
      timeout: parseInt(process.env.WS_CIRCUIT_TIMEOUT, 10) || 30000,
    })
    manager.register('upload', {
      failureThreshold: parseInt(process.env.UPLOAD_CIRCUIT_FAILURE_THRESHOLD, 10) || 5,
      successThreshold: parseInt(process.env.UPLOAD_CIRCUIT_SUCCESS_THRESHOLD, 10) || 2,
      timeout: parseInt(process.env.UPLOAD_CIRCUIT_TIMEOUT, 10) || 90000,
    })
    return manager
  }

  async initializeWorld(logger, errorTracker, timeoutManager, circuitBreakerManager) {
    const collections = await initCollections({ collectionsDir: this.collectionsDir, assetsDir: this.assetsDir })

    const { importApp } = await import('../core/extras/appTools.js')
    const sceneHypPath = path.join(this.rootDir, 'src/world/scene.hyp')
    if (fs.existsSync(sceneHypPath)) {
      const sceneHypBuffer = fs.readFileSync(sceneHypPath)
      const sceneHypFile = new File([sceneHypBuffer], 'scene.hyp', { type: 'application/octet-stream' })
      const sceneApp = await importApp(sceneHypFile)
      if (sceneApp.blueprint) {
        collections.push({
          id: 'scene',
          name: 'Scene',
          blueprints: [{ ...sceneApp.blueprint, id: '$scene', scene: true }],
        })
        logger.info('Scene blueprint loaded from scene.hyp')
      }
    }

    let db = await getDB(this.worldDir)
    db = createDbProxy(db)
    const storage = new Storage(path.join(this.worldDir, '/storage.json'), circuitBreakerManager)

    const world = createServerWorld()
    world.assetsUrl = process.env.PUBLIC_ASSETS_URL || '/assets'
    world.assetsDir = this.assetsDir

    world.collections.deserialize(collections)
    await world.init({ db, storage, assetsDir: this.assetsDir, assetsUrl: world.assetsUrl })

    if (world.network && world.network.socketManager) {
      world.network.socketManager.setCircuitBreakerManager(circuitBreakerManager)
    }

    const degradationStrategies = DegradationStrategies.createAllStrategies(world, logger)
    const degradationManager = new DegradationManager(circuitBreakerManager, degradationStrategies)

    const statusPageData = new StatusPageData(
      world,
      logger,
      errorTracker,
      null,
      circuitBreakerManager,
      degradationManager,
      timeoutManager
    )

    logger.info('Server initialization complete', {
      entities: world.entities?.serialize?.()?.length || 0,
      blueprints: world.blueprints?.serialize?.()?.length || 0,
    })

    return { world, degradationManager, statusPageData }
  }
}
