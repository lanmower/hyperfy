import { MSG } from '../protocol/MessageTypes.js'
import { Codec } from '../protocol/Codec.js'
import { SequenceTracker } from '../protocol/SequenceTracker.js'
import { QualityMonitor } from '../connection/QualityMonitor.js'
import { ClientReporter } from '../debug/ClientReporter.js'
import { StateInspector } from '../debug/StateInspector.js'
import { createMessageRouter } from './ClientMessageHandler.js'
import { Emitter } from '../utils/Emitter.js'

export function createClient(config = {}) {
  const serverUrl = config.serverUrl || 'ws://localhost:8080'
  const emitter = new Emitter()
  const codec = new Codec()
  const tracker = new SequenceTracker()
  const quality = new QualityMonitor()
  const stateInspector = new StateInspector()

  const state = {
    ws: null, playerId: null, sessionToken: null, tick: 0,
    entities: new Map(), players: new Map(),
    connected: false, reconnecting: false, reconnectAttempts: 0,
    reconnectTimer: null, heartbeatTimer: null
  }

  function send(type, payload) {
    if (!state.ws || state.ws.readyState !== 1) return false
    const frame = codec.encode(type, payload)
    quality.recordBytesOut(frame.length)
    state.ws.send(frame)
    return true
  }

  const onMessage = createMessageRouter({
    emitter, quality, tracker, stateInspector, codec, send,
    getState: (k) => state[k],
    setState: (k, v) => { state[k] = v }
  })

  function _startHeartbeats() {
    state.heartbeatTimer = setInterval(() => {
      quality.recordHeartbeatSent()
      send(MSG.HEARTBEAT, { ts: Date.now() })
    }, 1000)
  }

  function _attemptReconnect() {
    if (state.reconnectAttempts >= 10) { emitter.emit('reconnectFailed'); return }
    state.reconnecting = true
    const delay = Math.min(100 * Math.pow(2, state.reconnectAttempts), 5000)
    state.reconnectAttempts++
    state.reconnectTimer = setTimeout(() => {
      _connect().then(() => {
        if (state.sessionToken) send(MSG.RECONNECT, { sessionToken: state.sessionToken })
      }).catch(() => _attemptReconnect())
    }, delay)
  }

  function _connect() {
    return new Promise((resolve, reject) => {
      try {
        const WS = config.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null)
        if (!WS) return reject(new Error('No WebSocket available'))
        state.ws = new WS(serverUrl)
        if (state.ws.binaryType !== undefined) state.ws.binaryType = 'arraybuffer'
        const onOpen = () => { state.connected = true; _startHeartbeats(); resolve() }
        const onClose = () => {
          state.connected = false
          if (state.heartbeatTimer) clearInterval(state.heartbeatTimer)
          emitter.emit('disconnect')
          if (!state.reconnecting && state.sessionToken) _attemptReconnect()
        }
        const onErr = (e) => reject(e)
        if (state.ws.on) {
          state.ws.on('open', onOpen); state.ws.on('message', onMessage)
          state.ws.on('close', onClose); state.ws.on('error', onErr)
        } else {
          state.ws.onopen = onOpen; state.ws.onmessage = (e) => onMessage(e.data)
          state.ws.onclose = onClose; state.ws.onerror = onErr
        }
      } catch (e) { reject(e) }
    })
  }

  const reporter = new ClientReporter((type, payload) => send(type, payload))

  const api = {
    get playerId() { return state.playerId },
    get tick() { return state.tick },
    get entities() { return state.entities },
    get players() { return state.players },
    get isConnected() { return state.connected },
    get sessionToken() { return state.sessionToken },
    codec, tracker, quality, stateInspector, reporter,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    connect() { return _connect() },
    connectNode(WS) { config.WebSocket = WS; return _connect() },
    sendInput(input) { send(MSG.INPUT, { input }) },
    interact(entityId) { send(MSG.APP_EVENT, { entityId }) },
    reportState(s) { reporter.reportState(s) },
    startReporting() { reporter.start() },
    disconnect() {
      state.reconnecting = true
      if (state.reconnectTimer) clearTimeout(state.reconnectTimer)
      if (state.heartbeatTimer) clearInterval(state.heartbeatTimer)
      reporter.stop(); state.connected = false
      if (state.ws) state.ws.close()
    },
    getStats() {
      return {
        quality: quality.getStats(), codec: codec.getStats(),
        sequence: tracker.getStats(), stateSync: stateInspector.getStats()
      }
    },
    getEntity(id) { return state.entities.get(id) || null },
    getPlayer(id) { return state.players.get(id) || null }
  }

  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__DEBUG__) globalThis.__DEBUG__ = {}
    globalThis.__DEBUG__.client = api
  }
  return api
}
