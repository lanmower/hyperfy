import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MSG } from '../protocol/MessageTypes.js'
import { ConnectionManager } from '../connection/ConnectionManager.js'
import { SessionStore } from '../connection/SessionStore.js'
import { Inspector } from '../debug/Inspector.js'
import { TickSystem } from '../netcode/TickSystem.js'
import { PlayerManager } from '../netcode/PlayerManager.js'
import { NetworkState } from '../netcode/NetworkState.js'
import { LagCompensator } from '../netcode/LagCompensator.js'
import { PhysicsIntegration } from '../netcode/PhysicsIntegration.js'
import { PhysicsWorld } from '../physics/World.js'
import { AppRuntime } from '../apps/AppRuntime.js'
import { AppLoader } from '../apps/AppLoader.js'
import { EntityAppBinder } from '../apps/EntityAppBinder.js'
import { createTickHandler } from './TickHandler.js'
import { EventEmitter } from '../protocol/EventEmitter.js'
import { ReloadManager } from './ReloadManager.js'
import { createReloadHandlers } from './ReloadHandlers.js'
import { createServerAPI } from './ServerAPI.js'
import { createConnectionHandlers } from './ServerHandlers.js'

export async function boot(overrides = {}) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const worldPath = resolve(ROOT, 'apps/world/index.js')
  const worldUrl = pathToFileURL(worldPath).href + `?t=${Date.now()}`
  const worldMod = await import(worldUrl)
  const worldDef = worldMod.default || worldMod
  const config = {
    port: parseInt(process.env.PORT || String(worldDef.port || 8080), 10),
    tickRate: worldDef.tickRate || 128,
    appsDir: join(ROOT, 'apps'),
    gravity: worldDef.gravity,
    movement: worldDef.movement,
    staticDirs: [
      { prefix: '/src/', dir: join(ROOT, 'src') },
      { prefix: '/world/', dir: join(ROOT, 'world') },
      { prefix: '/', dir: join(ROOT, 'client') }
    ],
    ...overrides
  }
  const server = await createServer(config)
  await server.loadWorld(worldDef)
  server.on('playerJoin', ({ id }) => console.log())
  server.on('playerLeave', ({ id }) => console.log())
  const info = await server.start()
  console.log()
  return server
}

export async function createServer(config = {}) {
  const port = config.port || 8080
  const tickRate = config.tickRate || 128
  const appsDir = config.appsDir || './apps'
  const gravity = config.gravity || [0, -9.81, 0]
  const movement = config.movement || {}
  const staticDirs = config.staticDirs || []

  const physics = new PhysicsWorld({ gravity })
  await physics.init()

  const emitter = new EventEmitter()
  const tickSystem = new TickSystem(tickRate)
  const playerManager = new PlayerManager()
  const networkState = new NetworkState()
  const lagCompensator = new LagCompensator()
  const physicsIntegration = new PhysicsIntegration({ gravity, physicsWorld: physics })
  const connections = new ConnectionManager({
    heartbeatInterval: config.heartbeatInterval || 1000,
    heartbeatTimeout: config.heartbeatTimeout || 3000
  })
  const sessions = new SessionStore({ ttl: config.sessionTTL || 30000 })
  const inspector = new Inspector()
  const reloadManager = new ReloadManager()

  const appRuntime = new AppRuntime({ gravity, playerManager, physics, physicsIntegration })
  appRuntime.setPlayerManager(playerManager)
  const appLoader = new AppLoader(appRuntime, { dir: appsDir })
  const binder = new EntityAppBinder(appRuntime, appLoader)

  appLoader._onReloadCallback = (name, code) => {
    connections.broadcast(MSG.APP_MODULE, { app: name, code })
  }

  const ctx = {
    config,
    port,
    tickRate,
    appsDir,
    gravity,
    movement,
    staticDirs,
    physics,
    emitter,
    tickSystem,
    playerManager,
    networkState,
    lagCompensator,
    physicsIntegration,
    connections,
    sessions,
    inspector,
    reloadManager,
    appRuntime,
    appLoader,
    binder,
    currentWorldDef: null,
    worldSpawnPoint: [0, 5, 0],
    snapshotSeq: 0,
    httpServer: null,
    wss: null,
    wtServer: null,
    handlerState: { fn: null },
    onTick: (tick, dt) => { if (ctx.handlerState.fn) ctx.handlerState.fn(tick, dt) },
    setTickHandler: (fn) => { ctx.handlerState.fn = fn }
  }

  const reloadHandlers = createReloadHandlers({
    networkState,
    playerManager,
    physicsIntegration,
    lagCompensator,
    physics,
    appRuntime,
    connections
  })
  ctx.reloadHandlers = reloadHandlers

  ctx.setTickHandler(createTickHandler({
    networkState,
    playerManager,
    physicsIntegration,
    lagCompensator,
    physics,
    appRuntime,
    connections,
    movement
  }))

  const { onClientConnect } = createConnectionHandlers(ctx)
  ctx.onClientConnect = onClientConnect

  ctx.setupSDKWatchers = () => {
    const reloadTick = async () => { ctx.setTickHandler(await reloadHandlers.reloadTickHandler()) }
    const w = [
      ['tick-handler', './src/sdk/TickHandler.js', reloadTick],
      ['physics-integration', './src/netcode/PhysicsIntegration.js', reloadHandlers.reloadPhysicsIntegration],
      ['lag-compensator', './src/netcode/LagCompensator.js', reloadHandlers.reloadLagCompensator],
      ['player-manager', './src/netcode/PlayerManager.js', reloadHandlers.reloadPlayerManager],
      ['network-state', './src/netcode/NetworkState.js', reloadHandlers.reloadNetworkState]
    ]
    for (const [id, path, reload] of w) reloadManager.addWatcher(id, path, reload)
    const clientReload = () => { connections.broadcast(MSG.HOT_RELOAD, { timestamp: Date.now() }) }
    const clientFiles = [
      ['client-app', './client/app.js'],
      ['client-input', './src/client/InputHandler.js'],
      ['client-network', './src/client/PhysicsNetworkClient.js'],
      ['client-prediction', './src/client/PredictionEngine.js'],
      ['client-reconciliation', './src/client/ReconciliationEngine.js'],
      ['client-index', './src/index.client.js']
    ]
    for (const [id, path] of clientFiles) reloadManager.addWatcher(id, path, clientReload)
  }

  const api = createServerAPI(ctx)
  if (typeof globalThis.__DEBUG__ === 'undefined') globalThis.__DEBUG__ = {}
  globalThis.__DEBUG__.server = api
  return api
}
