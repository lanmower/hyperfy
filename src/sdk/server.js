import { createServer as createHttpServer } from 'node:http'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { WebSocketServer as WSServer } from 'ws'
import { MSG, DISCONNECT_REASONS } from '../protocol/MessageTypes.js'
import { ConnectionManager } from '../connection/ConnectionManager.js'
import { SessionStore } from '../connection/SessionStore.js'
import { Inspector } from '../debug/Inspector.js'
import { TickSystem } from '../netcode/TickSystem.js'
import { PlayerManager } from '../netcode/PlayerManager.js'
import { NetworkState } from '../netcode/NetworkState.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'
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
import { createStaticHandler } from './StaticHandler.js'
import { WebSocketTransport } from '../transport/WebSocketTransport.js'
import { WebTransportServer } from '../transport/WebTransportServer.js'

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
  server.on('playerJoin', ({ id }) => console.log(`[+] player ${id}`))
  server.on('playerLeave', ({ id }) => console.log(`[-] player ${id}`))
  const info = await server.start()
  console.log(`[server] http://localhost:${info.port} @ ${info.tickRate} TPS`)
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
  const connections = new ConnectionManager({ heartbeatInterval: config.heartbeatInterval || 1000, heartbeatTimeout: config.heartbeatTimeout || 3000 })
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
  let wss = null, httpServer = null, wtServer = null, snapshotSeq = 0
  let worldSpawnPoint = [0, 5, 0], currentWorldDef = null

  const handlerState = { fn: null }
  const onTick = (tick, dt) => { if (handlerState.fn) handlerState.fn(tick, dt) }
  const setTickHandler = (fn) => { handlerState.fn = fn }

  setTickHandler(createTickHandler({
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections, movement
  }))

  function onClientConnect(transport) {
    const sp = [...worldSpawnPoint]
    const playerId = playerManager.addPlayer(transport, { position: sp })
    networkState.addPlayer(playerId, { position: sp })
    physicsIntegration.addPlayerCollider(playerId, 0.4)
    physicsIntegration.setPlayerPosition(playerId, sp)
    const playerState = playerManager.getPlayer(playerId).state
    lagCompensator.recordPlayerPosition(
      playerId, playerState.position, playerState.rotation, playerState.velocity,
      tickSystem.currentTick
    )
    const client = connections.addClient(playerId, transport)
    client.sessionToken = sessions.create(playerId, playerManager.getPlayer(playerId).state)
    connections.send(playerId, MSG.HANDSHAKE_ACK, {
      playerId, tick: tickSystem.currentTick,
      sessionToken: client.sessionToken, tickRate
    })
    if (currentWorldDef) {
      connections.send(playerId, MSG.WORLD_DEF, currentWorldDef)
    }
    const clientModules = appLoader.getClientModules()
    for (const [appName, code] of Object.entries(clientModules)) {
      connections.send(playerId, MSG.APP_MODULE, { app: appName, code })
    }
    const snap = appRuntime.getSnapshot()
    connections.send(playerId, MSG.SNAPSHOT, {
      seq: ++snapshotSeq, ...SnapshotEncoder.encode(snap)
    })
    appRuntime.fireMessage('game', { type: 'player_join', playerId })
    emitter.emit('playerJoin', { id: playerId })
  }

  connections.on('message', (clientId, msg) => {
    if (inspector.handleMessage(clientId, msg)) return
    if (msg.type === MSG.INPUT || msg.type === MSG.PLAYER_INPUT) {
      playerManager.addInput(clientId, msg.payload?.input || msg.payload)
      return
    }
    if (msg.type === MSG.APP_EVENT) {
      if (msg.payload?.entityId) appRuntime.fireInteract(msg.payload.entityId, { id: clientId })
      if (msg.payload?.type === 'fire') {
        const shooter = playerManager.getPlayer(clientId)
        const pos = shooter?.state?.position || [0, 0, 0]
        const origin = [pos[0], pos[1] + 0.9, pos[2]]
        appRuntime.fireMessage('game', { ...msg.payload, shooterId: clientId, origin })
      }
      return
    }
    if (msg.type === MSG.RECONNECT) {
      const session = sessions.get(msg.payload?.sessionToken)
      if (!session) { connections.send(clientId, MSG.DISCONNECT_REASON, { code: DISCONNECT_REASONS.INVALID_SESSION }); return }
      const snap = networkState.getSnapshot(), ents = appRuntime.getSnapshot()
      connections.send(clientId, MSG.RECONNECT_ACK, { playerId: session.playerId, tick: tickSystem.currentTick, sessionToken: msg.payload.sessionToken })
      connections.send(clientId, MSG.STATE_RECOVERY, { snapshot: SnapshotEncoder.encode({ tick: snap.tick, timestamp: snap.timestamp, players: snap.players, entities: ents.entities }), tick: tickSystem.currentTick })
      return
    }
    emitter.emit('message', clientId, msg)
  })

  connections.on('disconnect', (clientId, reason) => {
    const client = connections.getClient(clientId)
    if (client?.sessionToken) { const p = playerManager.getPlayer(clientId); if (p) sessions.update(client.sessionToken, { state: p.state }) }
    appRuntime.fireMessage('game', { type: 'player_leave', playerId: clientId })
    physicsIntegration.removePlayerCollider(clientId); lagCompensator.clearPlayerHistory(clientId); inspector.removeClient(clientId)
    playerManager.removePlayer(clientId); networkState.removePlayer(clientId)
    connections.broadcast(MSG.PLAYER_LEAVE, { playerId: clientId })
    emitter.emit('playerLeave', { id: clientId, reason })
  })

  const reloadHandlers = createReloadHandlers({
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections
  })

  const setupSDKWatchers = () => {
    const reloadTick = async () => { setTickHandler(await reloadHandlers.reloadTickHandler()) }
    const w = [['tick-handler', './src/sdk/TickHandler.js', reloadTick], ['physics-integration', './src/netcode/PhysicsIntegration.js', reloadHandlers.reloadPhysicsIntegration], ['lag-compensator', './src/netcode/LagCompensator.js', reloadHandlers.reloadLagCompensator], ['player-manager', './src/netcode/PlayerManager.js', reloadHandlers.reloadPlayerManager], ['network-state', './src/netcode/NetworkState.js', reloadHandlers.reloadNetworkState]]
    for (const [id, path, reload] of w) reloadManager.addWatcher(id, path, reload)
    const clientReload = () => { connections.broadcast(MSG.HOT_RELOAD, { timestamp: Date.now() }) }
    const clientFiles = [['client-app', './client/app.js'], ['client-input', './src/client/InputHandler.js'], ['client-network', './src/client/PhysicsNetworkClient.js'], ['client-prediction', './src/client/PredictionEngine.js'], ['client-reconciliation', './src/client/ReconciliationEngine.js'], ['client-index', './src/index.client.js']]
    for (const [id, path] of clientFiles) reloadManager.addWatcher(id, path, clientReload)
  }

  const api = {
    physics, runtime: appRuntime, loader: appLoader, binder,
    tickSystem, playerManager, networkState, lagCompensator,
    connections, sessions, inspector, emitter, reloadManager,
    on: emitter.on.bind(emitter), off: emitter.off.bind(emitter),
    async loadWorld(worldDef) {
      currentWorldDef = worldDef
      if (worldDef.spawnPoint) worldSpawnPoint = [...worldDef.spawnPoint]
      await appLoader.loadAll()
      return binder.loadWorld(worldDef)
    },
    async start() {
      await appLoader.loadAll()
      await new Promise((resolve, reject) => {
        if (staticDirs.length > 0) {
          httpServer = createHttpServer(createStaticHandler(staticDirs))
          wss = new WSServer({ server: httpServer, path: '/ws' })
          httpServer.on('error', reject)
          httpServer.listen(port, () => resolve())
        } else {
          wss = new WSServer({ port }, () => resolve())
          wss.on('error', reject)
        }
      })
      wss.on('connection', (socket) => {
        onClientConnect(new WebSocketTransport(socket))
      })
      if (config.webTransport) {
        const wtp = config.webTransport.port || 4433
        wtServer = new WebTransportServer({ port: wtp, cert: config.webTransport.cert, key: config.webTransport.key })
        wtServer.on('session', onClientConnect)
        if (await wtServer.start()) console.log(`[server] WebTransport on port ${wtp}`)
      }
      tickSystem.onTick(onTick); tickSystem.start(); appLoader.watchAll()
      setupSDKWatchers()
      return { port, tickRate }
    },
    stop() {
      tickSystem.stop(); appLoader.stopWatching(); reloadManager.stopAllWatchers()
      connections.destroy(); sessions.destroyAll()
      if (wtServer) wtServer.stop()
      if (wss) wss.close(); if (httpServer) httpServer.close(); physics.destroy()
    },
    send(id, type, p) { return connections.send(id, type, p) },
    broadcast(type, p) { connections.broadcast(type, p) },
    getPlayerCount() { return playerManager.getPlayerCount() },
    getEntityCount() { return binder.getEntityCount() },
    getSnapshot() { return appRuntime.getSnapshot() },
    reloadTickHandler: async () => { setTickHandler(await reloadHandlers.reloadTickHandler()) },
    getReloadStats() { return reloadManager.getStats() },
    getAllStats() {
      return { connections: connections.getAllStats(), inspector: inspector.getAllClients(connections),
        sessions: sessions.getActiveCount(), tick: tickSystem.currentTick, players: playerManager.getPlayerCount() }
    }
  }
  if (typeof globalThis.__DEBUG__ === 'undefined') globalThis.__DEBUG__ = {}
  globalThis.__DEBUG__.server = api; return api
}
