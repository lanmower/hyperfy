import { MSG } from '../protocol/MessageTypes.js'
import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'

export function createTickHandler(deps) {
  const {
    networkState, playerManager, physicsIntegration,
    lagCompensator, physics, appRuntime, connections,
    movement: m = {}
  } = deps
  const maxSpeed = m.maxSpeed || 8.0
  const groundAccel = m.groundAccel || 10.0
  const airAccel = m.airAccel || 1.0
  const friction = m.friction || 6.0
  const stopSpeed = m.stopSpeed || 2.0
  const jumpImpulse = m.jumpImpulse || 4.5
  const collisionRestitution = m.collisionRestitution || 0.2
  const collisionDamping = m.collisionDamping || 0.25
  let snapshotSeq = 0

  return function onTick(tick, dt) {
    networkState.setTick(tick, Date.now())
    for (const player of playerManager.getConnectedPlayers()) {
      const inputs = playerManager.getInputs(player.id)
      const st = player.state
      let vx = st.velocity[0], vz = st.velocity[2]
      let wishX = 0, wishZ = 0, wishSpeed = 0, jumped = false

      if (inputs.length > 0) {
        const inp = inputs[inputs.length - 1].data
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
          wishX = fz * sy - fx * cy
          wishZ = fx * sy + fz * cy
          wishSpeed = flen > 0 ? maxSpeed : 0
          st.rotation = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]
          if (inp.jump && st.onGround) {
            st.velocity[1] = jumpImpulse
            st.onGround = false
            jumped = true
          }
        }
        playerManager.clearInputs(player.id)
      }

      if (st.onGround && !jumped) {
        const speed = Math.sqrt(vx * vx + vz * vz)
        if (speed > 0.1) {
          const control = speed < stopSpeed ? stopSpeed : speed
          const drop = control * friction * dt
          let newSpeed = speed - drop
          if (newSpeed < 0) newSpeed = 0
          const scale = newSpeed / speed
          vx *= scale; vz *= scale
        } else { vx = 0; vz = 0 }
        if (wishSpeed > 0) {
          const cur = vx * wishX + vz * wishZ
          let add = wishSpeed - cur
          if (add > 0) {
            let as = groundAccel * wishSpeed * dt
            if (as > add) as = add
            vx += as * wishX; vz += as * wishZ
          }
        }
      } else {
        if (wishSpeed > 0) {
          const cur = vx * wishX + vz * wishZ
          let add = wishSpeed - cur
          if (add > 0) {
            let as = airAccel * wishSpeed * dt
            if (as > add) as = add
            vx += as * wishX; vz += as * wishZ
          }
        }
      }

      st.velocity[0] = vx; st.velocity[2] = vz
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
    const players = playerManager.getConnectedPlayers()
    for (const player of players) {
      const collisions = physicsIntegration.checkCollisionWithOthers(player.id, players)
      for (const collision of collisions) {
        const other = playerManager.getPlayer(collision.playerId)
        if (!other) continue
        const dx = collision.normal[0], dy = collision.normal[1], dz = collision.normal[2]
        const relVx = other.state.velocity[0] - player.state.velocity[0]
        const relVz = other.state.velocity[2] - player.state.velocity[2]
        const relDotNorm = relVx * dx + relVz * dz
        if (relDotNorm >= 0) continue
        const impulse = (1 + collisionRestitution) * relDotNorm * 0.5
        player.state.velocity[0] -= impulse * dx * collisionDamping
        player.state.velocity[2] -= impulse * dz * collisionDamping
        other.state.velocity[0] += impulse * dx * collisionDamping
        other.state.velocity[2] += impulse * dz * collisionDamping
      }
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
    try {
      appRuntime._drainReloadQueue()
    } catch (e) {
      console.error('[TickHandler] reload queue error:', e.message)
    }
  }
}
