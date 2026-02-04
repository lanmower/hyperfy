import { WebSocketServer as WSServer } from 'ws'
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
import { pack, unpack as unpackMsg } from 'msgpackr'

export async function createServer(config = {}) {
  const port = config.port || 8080
  const tickRate = config.tickRate || 128
  const appsDir = config.appsDir || './apps'
  const gravity = config.gravity || [0, -9.81, 0]

  const physics = new PhysicsWorld({ gravity })
  await physics.init()

  const tickSystem = new TickSystem(tickRate)
  const playerManager = new PlayerManager()
  const networkState = new NetworkState()
  const lagCompensator = new LagCompensator()
  const physicsIntegration = new PhysicsIntegration({ gravity })

  const appRuntime = new AppRuntime({ gravity, playerManager, physics })
  appRuntime.setPlayerManager(playerManager)
  const appLoader = new AppLoader(appRuntime, { dir: appsDir })
  const binder = new EntityAppBinder(appRuntime, appLoader)

  let wss = null
  const moveSpeed = 6.0
  const jumpImpulse = 7.0

  function onClientConnect(socket) {
    const playerId = playerManager.addPlayer(socket)
    networkState.addPlayer(playerId)
    physicsIntegration.addPlayerCollider(playerId, 0.4)
    lagCompensator.recordPlayerState(playerId, playerManager.getPlayer(playerId).state, tickSystem.currentTick, Date.now())

    const assignMsg = pack({ t: 1, id: playerId, tick: tickSystem.currentTick })
    socket.send(assignMsg)

    const entitySnap = appRuntime.getSnapshot()
    const worldMsg = pack({ t: 2, data: SnapshotEncoder.encode(entitySnap) })
    socket.send(worldMsg)

    socket.on('message', (raw) => {
      try {
        const data = Buffer.isBuffer(raw) ? unpackMsg(raw) : JSON.parse(raw)
        onClientMessage(playerId, data)
      } catch (e) {}
    })
    socket.on('close', () => onClientDisconnect(playerId))
    socket.on('error', () => {})
  }

  function onClientMessage(playerId, data) {
    if (data.type === 'input' || data.t === 3) {
      playerManager.addInput(playerId, data.input || data.i)
    } else if (data.type === 'interact' || data.t === 4) {
      appRuntime.fireInteract(data.entityId || data.eid, { id: playerId })
    }
  }

  function onClientDisconnect(playerId) {
    physicsIntegration.removePlayerCollider(playerId)
    lagCompensator.clearPlayerHistory(playerId)
    playerManager.removePlayer(playerId)
    networkState.removePlayer(playerId)
    const dcMsg = pack({ t: 5, id: playerId, tick: tickSystem.currentTick })
    playerManager.broadcastBinary(dcMsg)
  }

  function onTick(tick, dt) {
    networkState.setTick(tick, Date.now())

    for (const player of playerManager.getConnectedPlayers()) {
      const inputs = playerManager.getInputs(player.id)
      const st = player.state
      let vx = 0, vz = 0

      if (inputs.length > 0) {
        const last = inputs[inputs.length - 1]
        const inp = last.data
        if (inp) {
          if (inp.forward) vz += moveSpeed
          if (inp.backward) vz -= moveSpeed
          if (inp.left) vx -= moveSpeed
          if (inp.right) vx += moveSpeed
          if (inp.jump && st.onGround) {
            st.velocity[1] = jumpImpulse
            st.onGround = false
          }
        }
        playerManager.clearInputs(player.id)
      }

      st.velocity[0] = vx
      st.velocity[2] = vz

      const updated = physicsIntegration.updatePlayerPhysics(player.id, st, dt)
      st.position = updated.position
      st.velocity = updated.velocity
      st.onGround = updated.onGround

      lagCompensator.recordPlayerState(player.id, st, tick, Date.now())
      networkState.updatePlayer(player.id, {
        position: st.position,
        rotation: st.rotation,
        velocity: st.velocity,
        onGround: st.onGround,
        inputSequence: player.inputSequence
      })
    }

    physics.step(dt)
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
    const snapMsg = pack({ t: 6, data: encoded })
    playerManager.broadcastBinary(snapMsg)
  }

  return {
    physics,
    runtime: appRuntime,
    loader: appLoader,
    binder,
    tickSystem,
    playerManager,
    networkState,
    lagCompensator,

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
      physics.destroy()
    },

    getPlayerCount() { return playerManager.getPlayerCount() },
    getEntityCount() { return binder.getEntityCount() },
    getSnapshot() { return appRuntime.getSnapshot() }
  }
}
