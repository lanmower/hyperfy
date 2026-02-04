import { MSG } from '../protocol/MessageTypes.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'

export function createMessageRouter(deps) {
  const { emitter, quality, tracker, stateInspector, send, getState, setState } = deps

  function handleSnapshot(data) {
    try {
      const decoded = typeof data === 'object' && data.players
        ? data : SnapshotEncoder.decode(data)
      if (decoded.tick) {
        stateInspector.recordSnapshotDelay(Date.now() - (decoded.timestamp || 0))
        setState('tick', decoded.tick)
      }
      for (const p of decoded.players || []) getState('players').set(p.id, p)
      for (const e of decoded.entities || []) getState('entities').set(e.id, e)
      emitter.emit('snapshot', decoded)
    } catch (e) {
      emitter.emit('error', e)
    }
  }

  return function onMessage(raw) {
    const buf = raw instanceof ArrayBuffer ? Buffer.from(new Uint8Array(raw)) : raw
    const msg = deps.codec.decode(buf)
    if (!msg) return
    quality.recordBytesIn(buf.length || buf.byteLength || 0)
    tracker.track(msg.seq)

    if (msg.type === MSG.HEARTBEAT) {
      send(MSG.HEARTBEAT_ACK, { ts: msg.payload?.ts })
      return
    }
    if (msg.type === MSG.HEARTBEAT_ACK && msg.payload?.ts) {
      quality.recordRtt(Date.now() - msg.payload.ts)
      quality.recordHeartbeatReceived()
      return
    }
    if (msg.type === MSG.HANDSHAKE_ACK) {
      setState('playerId', msg.payload.playerId)
      setState('sessionToken', msg.payload.sessionToken)
      setState('tick', msg.payload.tick)
      emitter.emit('connect', { playerId: msg.payload.playerId, tick: msg.payload.tick })
      return
    }
    if (msg.type === MSG.SNAPSHOT) { handleSnapshot(msg.payload); return }
    if (msg.type === MSG.PLAYER_LEAVE) {
      getState('players').delete(msg.payload.playerId)
      emitter.emit('playerLeave', msg.payload.playerId)
      return
    }
    if (msg.type === MSG.RECONNECT_ACK) {
      setState('playerId', msg.payload.playerId)
      setState('sessionToken', msg.payload.sessionToken)
      setState('tick', msg.payload.tick)
      setState('reconnecting', false)
      setState('reconnectAttempts', 0)
      emitter.emit('reconnect', msg.payload)
      return
    }
    if (msg.type === MSG.STATE_RECOVERY) {
      const decoded = SnapshotEncoder.decode(msg.payload.snapshot)
      for (const p of decoded.players || []) getState('players').set(p.id, p)
      for (const e of decoded.entities || []) getState('entities').set(e.id, e)
      emitter.emit('stateRecovery', decoded)
      return
    }
    if (msg.type === MSG.STATE_CORRECTION) {
      stateInspector.recordCorrection(getState('playerId'), null, msg.payload, 0)
      emitter.emit('correction', msg.payload)
      return
    }
    if (msg.type === MSG.DISCONNECT_REASON) {
      emitter.emit('disconnectReason', msg.payload)
      return
    }
    emitter.emit('message', msg)
  }
}
