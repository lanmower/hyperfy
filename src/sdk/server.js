import { createServer as createHttpServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
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

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.wasm': 'application/wasm'
}

function createStaticHandler(dirs) {
  return (req, res) => {
    const url = req.url.split('?')[0]
    for (const { prefix, dir } of dirs) {
      if (!url.startsWith(prefix)) continue
      const relative = url === prefix ? '/index.html' : url.slice(prefix.length)
      const fp = join(dir, relative)
      if (existsSync(fp)) {
        res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(fp)] || 'application/octet-stream' })
        res.end(readFileSync(fp))
        return
      }
    }
    res.writeHead(404)
    res.end('not found')
  }
}

export async function createServer(config = {}) {
  const port = config.port || 8080
  const tickRate = config.tickRate || 128
  const appsDir = config.appsDir || './apps'
  const gravity = config.gravity || [0, -9.81, 0]
  const staticDirs = config.staticDirs || []

  const physics = new PhysicsWorld({ gravity })
  await physics.init()

  const emitter = new EventEmitter()
  const tickSystem = new TickSystem(tickRate)
  const playerManager = new PlayerManager()
  const networkState = new NetworkState()
  const lagCompensator = new LagCompensator()
  const physicsIntegration = new PhysicsIntegration({ gravity })
  const connections = new ConnectionManager({
    heartbeatInterval: config.heartbeatInterval || 1000,
    heartbeatTimeout: config.heartbeatTimeout || 3000
  })
  const sessions = new SessionStore({ ttl: config.sessionTTL || 30000 })
  const inspector = new Inspector()
  const reloadManager = new ReloadManager()

  const appRuntime = new AppRuntime({ gravity, playerManager, physics })
  appRuntime.setPlayerManager(playerManager)
  const appLoader = new AppLoader(appRuntime, { dir: appsDir })
  const binder = new EntityAppBinder(appRuntime, appLoader)
  let wss = null
  let httpServer = null
  let snapshotSeq = 0

  const handlerState = { fn: null }
  const onTick = (tick, dt) => {
    if (handlerState.fn) handlerState.fn(tick, dt)
  }

  const setTickHandler = (fn) => {
    handlerState.fn = fn
  }

  setTickHandler(createTickHandler({
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections
  }))

  function onClientConnect(socket) {
    const playerId = playerManager.addPlayer(socket)
    networkState.addPlayer(playerId)
    physicsIntegration.addPlayerCollider(playerId, 0.4)
    const playerState = playerManager.getPlayer(playerId).state
    lagCompensator.recordPlayerPosition(
      playerId, playerState.position, playerState.rotation, playerState.velocity,
      tickSystem.currentTick
    )
    const client = connections.addClient(playerId, socket)
    client.sessionToken = sessions.create(playerId, playerManager.getPlayer(playerId).state)
    connections.send(playerId, MSG.HANDSHAKE_ACK, {
      playerId, tick: tickSystem.currentTick,
      sessionToken: client.sessionToken, tickRate
    })
    const snap = appRuntime.getSnapshot()
    connections.send(playerId, MSG.SNAPSHOT, {
      seq: ++snapshotSeq, ...SnapshotEncoder.encode(snap)
    })
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
      return
    }
    if (msg.type === MSG.RECONNECT) {
      _handleReconnect(clientId, msg.payload)
      return
    }
    emitter.emit('message', clientId, msg)
  })

  connections.on('disconnect', (clientId, reason) => {
    const client = connections.getClient(clientId)
    if (client?.sessionToken) {
      const p = playerManager.getPlayer(clientId)
      if (p) sessions.update(client.sessionToken, { state: p.state })
    }
    physicsIntegration.removePlayerCollider(clientId)
    lagCompensator.clearPlayerHistory(clientId)
    inspector.removeClient(clientId)
    playerManager.removePlayer(clientId)
    networkState.removePlayer(clientId)
    connections.broadcast(MSG.PLAYER_LEAVE, { playerId: clientId })
    emitter.emit('playerLeave', { id: clientId, reason })
  })

  function _handleReconnect(clientId, payload) {
    const session = sessions.get(payload?.sessionToken)
    if (!session) {
      connections.send(clientId, MSG.DISCONNECT_REASON, { code: DISCONNECT_REASONS.INVALID_SESSION })
      return
    }
    const snap = networkState.getSnapshot()
    const ents = appRuntime.getSnapshot()
    const combined = { tick: snap.tick, timestamp: snap.timestamp, players: snap.players, entities: ents.entities }
    connections.send(clientId, MSG.RECONNECT_ACK, {
      playerId: session.playerId, tick: tickSystem.currentTick, sessionToken: payload.sessionToken
    })
    connections.send(clientId, MSG.STATE_RECOVERY, {
      snapshot: SnapshotEncoder.encode(combined), tick: tickSystem.currentTick
    })
  }

  const reloadTickHandler = async () => {
    const { createTickHandler: refreshHandler } = await import('./TickHandler.js?' + Date.now())
    const newHandler = refreshHandler({
      networkState, playerManager, physicsIntegration,
      lagCompensator, physics, appRuntime, connections
    })
    setTickHandler(newHandler)
  }

  const reloadPhysicsIntegration = async () => {
    const oldColliders = new Map(physicsIntegration.playerColliders)
    const { PhysicsIntegration: NewPhysicsIntegration } = await import('../netcode/PhysicsIntegration.js?' + Date.now())
    const newIntegration = new NewPhysicsIntegration({ gravity: physicsIntegration.config.gravity })
    newIntegration.playerColliders = oldColliders
    Object.assign(physicsIntegration, newIntegration)
  }

  const reloadLagCompensator = async () => {
    const oldHistory = new Map(lagCompensator.playerHistory)
    const { LagCompensator: NewLagCompensator } = await import('../netcode/LagCompensator.js?' + Date.now())
    const newLag = new NewLagCompensator(lagCompensator.historyWindow)
    newLag.playerHistory = oldHistory
    Object.assign(lagCompensator, newLag)
  }

  const reloadPlayerManager = async () => {
    const oldPlayers = new Map(playerManager.players)
    const oldInputBuffers = new Map(playerManager.inputBuffers)
    const { PlayerManager: NewPlayerManager } = await import('../netcode/PlayerManager.js?' + Date.now())
    const newPM = new NewPlayerManager()
    newPM.players = oldPlayers
    newPM.inputBuffers = oldInputBuffers
    newPM.nextPlayerId = playerManager.nextPlayerId
    Object.assign(playerManager, newPM)
  }

  const reloadNetworkState = async () => {
    const oldPlayers = new Map(networkState.players)
    const { NetworkState: NewNetworkState } = await import('../netcode/NetworkState.js?' + Date.now())
    const newNS = new NewNetworkState()
    newNS.players = oldPlayers
    newNS.tick = networkState.tick
    newNS.timestamp = networkState.timestamp
    Object.assign(networkState, newNS)
  }

  const setupSDKWatchers = () => {
    const watcherConfig = [
      { id: 'tick-handler', path: './src/sdk/TickHandler.js', reload: reloadTickHandler },
      { id: 'physics-integration', path: './src/netcode/PhysicsIntegration.js', reload: reloadPhysicsIntegration },
      { id: 'lag-compensator', path: './src/netcode/LagCompensator.js', reload: reloadLagCompensator },
      { id: 'player-manager', path: './src/netcode/PlayerManager.js', reload: reloadPlayerManager },
      { id: 'network-state', path: './src/netcode/NetworkState.js', reload: reloadNetworkState }
    ]
    for (const { id, path, reload } of watcherConfig) {
      reloadManager.addWatcher(id, path, reload)
    }
  }

  const api = {
    physics, runtime: appRuntime, loader: appLoader, binder,
    tickSystem, playerManager, networkState, lagCompensator,
    connections, sessions, inspector, emitter, reloadManager,
    on: emitter.on.bind(emitter), off: emitter.off.bind(emitter),
    async loadWorld(worldDef) { await appLoader.loadAll(); return binder.loadWorld(worldDef) },
    async start() {
      await appLoader.loadAll()
      if (staticDirs.length > 0) {
        httpServer = createHttpServer(createStaticHandler(staticDirs))
        wss = new WSServer({ server: httpServer })
        await new Promise((resolve, reject) => {
          httpServer.on('error', reject); httpServer.listen(port, () => resolve())
        })
      } else { wss = new WSServer({ port }) }
      wss.on('connection', onClientConnect)
      tickSystem.onTick(onTick); tickSystem.start(); appLoader.watchAll()
      setupSDKWatchers()
      return { port, tickRate }
    },
    stop() {
      tickSystem.stop(); appLoader.stopWatching(); reloadManager.stopAllWatchers()
      connections.destroy(); sessions.destroy()
      if (wss) wss.close(); if (httpServer) httpServer.close(); physics.destroy()
    },
    send(id, type, p) { return connections.send(id, type, p) },
    broadcast(type, p) { connections.broadcast(type, p) },
    getPlayerCount() { return playerManager.getPlayerCount() },
    getEntityCount() { return binder.getEntityCount() },
    getSnapshot() { return appRuntime.getSnapshot() },
    reloadTickHandler,
    getReloadStats() { return reloadManager.getStats() },
    getAllStats() {
      return { connections: connections.getAllStats(), inspector: inspector.getAllClients(connections),
        sessions: sessions.getActiveCount(), tick: tickSystem.currentTick, players: playerManager.getPlayerCount() }
    }
  }
  if (typeof globalThis.__DEBUG__ === 'undefined') globalThis.__DEBUG__ = {}
  globalThis.__DEBUG__.server = api; return api
}
