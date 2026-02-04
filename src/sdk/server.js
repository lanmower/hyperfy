import { WebSocketServer as WSServer } from 'ws'
import { TickSystem } from '../netcode/TickSystem.js'
import { PlayerManager } from '../netcode/PlayerManager.js'
import { NetworkState } from '../netcode/NetworkState.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'
import { AppRuntime } from '../apps/AppRuntime.js'
import { AppLoader } from '../apps/AppLoader.js'
import { EntityAppBinder } from '../apps/EntityAppBinder.js'

export function createServer(config = {}) {
  const port = config.port || 8080
  const tickRate = config.tickRate || 128
  const appsDir = config.appsDir || './apps'

  const tickSystem = new TickSystem(tickRate)
  const playerManager = new PlayerManager()
  const networkState = new NetworkState()
  const appRuntime = new AppRuntime({
    gravity: config.gravity || [0, -9.81, 0],
    playerManager
  })
  appRuntime.setPlayerManager(playerManager)
  const appLoader = new AppLoader(appRuntime, { dir: appsDir })
  const binder = new EntityAppBinder(appRuntime, appLoader)

  let wss = null

  function onClientConnect(socket) {
    const playerId = playerManager.addPlayer(socket)
    networkState.addPlayer(playerId)
    socket.send(JSON.stringify({
      type: 'player_assigned',
      playerId,
      tick: tickSystem.currentTick
    }))
    const entitySnap = appRuntime.getSnapshot()
    socket.send(JSON.stringify({
      type: 'world_state',
      data: SnapshotEncoder.encode(entitySnap)
    }))
    socket.on('message', (raw) => {
      try {
        const data = JSON.parse(raw)
        onClientMessage(playerId, data)
      } catch (e) {}
    })
    socket.on('close', () => onClientDisconnect(playerId))
    socket.on('error', () => {})
  }

  function onClientMessage(playerId, data) {
    if (data.type === 'input') {
      playerManager.addInput(playerId, data.input)
    } else if (data.type === 'interact') {
      appRuntime.fireInteract(data.entityId, { id: playerId })
    } else if (data.type === 'message') {
      appRuntime.fireMessage(data.entityId, data.payload)
    }
  }

  function onClientDisconnect(playerId) {
    playerManager.removePlayer(playerId)
    networkState.removePlayer(playerId)
    playerManager.broadcast({
      type: 'player_disconnected',
      playerId,
      tick: tickSystem.currentTick
    })
  }

  function onTick(tick, dt) {
    networkState.setTick(tick, Date.now())
    for (const player of playerManager.getConnectedPlayers()) {
      const inputs = playerManager.getInputs(player.id)
      if (inputs.length > 0) {
        const last = inputs[inputs.length - 1]
        const st = player.state
        if (last.data) {
          if (last.data.forward) st.position[2] += 0.1 * dt
          if (last.data.backward) st.position[2] -= 0.1 * dt
          if (last.data.left) st.position[0] -= 0.1 * dt
          if (last.data.right) st.position[0] += 0.1 * dt
        }
      }
      const st = player.state
      st.velocity[1] -= 9.81 * dt
      st.position[1] += st.velocity[1] * dt
      if (st.position[1] < 0) {
        st.position[1] = 0
        st.velocity[1] = 0
        st.onGround = true
      }
    }
    appRuntime.tick(tick, dt)
    const playerSnap = networkState.getSnapshot()
    const entitySnap = appRuntime.getSnapshot()
    const combined = {
      tick: playerSnap.tick,
      timestamp: playerSnap.timestamp,
      players: playerSnap.players,
      entities: entitySnap.entities
    }
    const encoded = SnapshotEncoder.encode(combined)
    playerManager.broadcast({ type: 'snapshot', data: encoded })
  }

  return {
    runtime: appRuntime,
    loader: appLoader,
    binder,
    tickSystem,
    playerManager,
    networkState,

    async loadApps() {
      return appLoader.loadAll()
    },

    async loadWorld(worldDef) {
      await appLoader.loadAll()
      return binder.loadWorld(worldDef)
    },

    async start() {
      await appLoader.loadAll()
      wss = new WSServer({ port })
      wss.on('connection', onClientConnect)
      tickSystem.onTick(onTick)
      tickSystem.start()
      appLoader.watchAll()
      return { port, tickRate }
    },

    stop() {
      tickSystem.stop()
      appLoader.stopWatching()
      if (wss) wss.close()
    },

    getPlayerCount() { return playerManager.getPlayerCount() },
    getEntityCount() { return binder.getEntityCount() },
    getSnapshot() { return appRuntime.getSnapshot() }
  }
}
