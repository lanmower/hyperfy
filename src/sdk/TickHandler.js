import { MSG } from '../protocol/MessageTypes.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'

export function createTickHandler(deps) {
  const {
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections
  } = deps
  const moveSpeed = 12.0
  const jumpImpulse = 7
  let snapshotSeq = 0

  return function onTick(tick, dt) {
    networkState.setTick(tick, Date.now())
    for (const player of playerManager.getConnectedPlayers()) {
      const inputs = playerManager.getInputs(player.id)
      const st = player.state
      let vx = 0, vz = 0
      if (inputs.length > 0) {
        const last = inputs[inputs.length - 1]
        const inp = last.data
        if (inp) {
          let fx = 0, fz = 0
          if (inp.forward) fz += 1
          if (inp.backward) fz -= 1
          if (inp.left) fx -= 1
          if (inp.right) fx += 1
          const flen = Math.sqrt(fx * fx + fz * fz)
          if (flen > 0) { fx /= flen; fz /= flen }
          const yaw = inp.yaw || 0
          const cy = Math.cos(yaw), sy = Math.sin(yaw)
          vx = (fz * sy - fx * cy) * moveSpeed
          vz = (fx * sy + fz * cy) * moveSpeed
          st.rotation = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]
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
      lagCompensator.recordPlayerPosition(player.id, st.position, st.rotation, st.velocity, tick)
      networkState.updatePlayer(player.id, {
        position: st.position, rotation: st.rotation,
        velocity: st.velocity, onGround: st.onGround,
        health: st.health, inputSequence: player.inputSequence
      })
    }
    physics.step(dt)
    appRuntime.tick(tick, dt)
    const playerSnap = networkState.getSnapshot()
    const entitySnap = appRuntime.getSnapshot()
    const combined = {
      tick: playerSnap.tick, timestamp: playerSnap.timestamp,
      players: playerSnap.players, entities: entitySnap.entities
    }
    snapshotSeq++
    connections.broadcast(MSG.SNAPSHOT, {
      seq: snapshotSeq, ...SnapshotEncoder.encode(combined)
    })
  }
}
