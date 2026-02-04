import { WebSocketServer } from 'ws'
import EventEmitter from 'node:events'
import { MSG, DISCONNECT_REASONS } from '../protocol/MessageTypes.js'
import { Codec } from '../protocol/Codec.js'
import { ConnectionManager } from '../connection/ConnectionManager.js'
import { SessionStore } from '../connection/SessionStore.js'
import { Inspector } from '../debug/Inspector.js'
import { TickSystem } from '../netcode/TickSystem.js'
import { PlayerManager } from '../netcode/PlayerManager.js'
import { NetworkState } from '../netcode/NetworkState.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'

export function hyperfyMiddleware(httpServer, config = {}) {
  const tickRate = config.tickRate || 128
  const debug = config.debug !== false
  const wsPath = config.wsPath || '/ws'
  const sessionTTL = config.sessionTTL || 30000

  const emitter = new EventEmitter()
  const connections = new ConnectionManager({
    heartbeatInterval: config.heartbeatInterval || 1000,
    heartbeatTimeout: config.heartbeatTimeout || 3000
  })
  const sessions = new SessionStore({ ttl: sessionTTL })
  const inspector = new Inspector()
  const tickSystem = new TickSystem(tickRate)
  const playerManager = new PlayerManager()
  const networkState = new NetworkState()
  let snapshotSeq = 0

  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname !== wsPath) return
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws) => {
    const playerId = playerManager.addPlayer(ws)
    networkState.addPlayer(playerId)
    const client = connections.addClient(playerId, ws)
    const token = sessions.create(playerId, playerManager.getPlayer(playerId).state)
    client.sessionToken = token

    connections.send(playerId, MSG.HANDSHAKE_ACK, {
      playerId,
      tick: tickSystem.currentTick,
      sessionToken: token,
      tickRate
    })

    emitter.emit('playerJoin', {
      id: playerId,
      state: playerManager.getPlayer(playerId).state
    })
  })

  connections.on('message', (clientId, msg) => {
    if (inspector.handleMessage(clientId, msg)) return

    if (msg.type === MSG.INPUT || msg.type === MSG.PLAYER_INPUT) {
      playerManager.addInput(clientId, msg.payload?.input || msg.payload)
      return
    }
    if (msg.type === MSG.APP_EVENT) {
      emitter.emit('appEvent', clientId, msg.payload)
      return
    }
    if (msg.type === MSG.RECONNECT) {
      _handleReconnect(clientId, msg.payload)
      return
    }
    if (msg.type === MSG.INSPECT_ENTITY) {
      emitter.emit('inspectEntity', clientId, msg.payload)
      return
    }
    emitter.emit('message', clientId, msg)
  })

  connections.on('disconnect', (clientId, reason) => {
    const client = connections.getClient(clientId)
    if (client?.sessionToken) {
      const player = playerManager.getPlayer(clientId)
      if (player) {
        sessions.update(client.sessionToken, { state: player.state })
      }
    }
    inspector.removeClient(clientId)
    playerManager.removePlayer(clientId)
    networkState.removePlayer(clientId)
    emitter.emit('playerLeave', { id: clientId, reason })
    connections.broadcast(MSG.PLAYER_LEAVE, { playerId: clientId })
  })

  function _handleReconnect(clientId, payload) {
    const session = sessions.get(payload?.sessionToken)
    if (!session) {
      connections.send(clientId, MSG.DISCONNECT_REASON, {
        code: DISCONNECT_REASONS.INVALID_SESSION
      })
      return
    }
    const snap = networkState.getSnapshot()
    connections.send(clientId, MSG.RECONNECT_ACK, {
      playerId: session.playerId,
      tick: tickSystem.currentTick,
      sessionToken: payload.sessionToken
    })
    connections.send(clientId, MSG.STATE_RECOVERY, {
      snapshot: SnapshotEncoder.encode(snap),
      tick: tickSystem.currentTick
    })
  }

  tickSystem.onTick((tick, dt) => {
    networkState.setTick(tick, Date.now())
    emitter.emit('tick', tick, dt)

    const snap = networkState.getSnapshot()
    snapshotSeq++
    connections.broadcast(MSG.SNAPSHOT, {
      seq: snapshotSeq,
      ...SnapshotEncoder.encode(snap)
    })
  })

  const api = Object.assign(emitter, {
    connections,
    sessions,
    inspector,
    tickSystem,
    playerManager,
    networkState,

    start() {
      tickSystem.start()
    },

    stop() {
      tickSystem.stop()
      connections.destroy()
      sessions.destroy()
    },

    send(clientId, type, payload) {
      return connections.send(clientId, type, payload)
    },

    broadcast(type, payload) {
      connections.broadcast(type, payload)
    },

    getClientStats(clientId) {
      return connections.getClientStats(clientId)
    },

    getAllStats() {
      return {
        connections: connections.getAllStats(),
        clients: inspector.getAllClients(connections),
        sessions: sessions.getActiveCount(),
        tick: tickSystem.currentTick,
        players: playerManager.getPlayerCount()
      }
    }
  })

  if (typeof globalThis.__DEBUG__ === 'undefined') {
    globalThis.__DEBUG__ = {}
  }
  globalThis.__DEBUG__.hyperfy = api

  return api
}
