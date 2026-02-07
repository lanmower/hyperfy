export class PhysicsIntegration {
  constructor(config = {}) {
    this.physicsWorld = config.physicsWorld || null
    this.config = {
      gravity: config.gravity || [0, -9.81, 0],
      capsuleRadius: config.capsuleRadius || 0.4,
      capsuleHalfHeight: config.capsuleHalfHeight || 0.9,
      playerMass: config.playerMass || 80,
      groundCheckDist: config.groundCheckDist || 0.15,
      extraGravity: config.extraGravity || -20,
      ...config
    }
    this.playerBodies = new Map()
  }

  setPhysicsWorld(world) {
    this.physicsWorld = world
  }

  addPlayerCollider(playerId, radius = 0.4) {
    if (!this.physicsWorld) {
      this.playerBodies.set(playerId, { id: playerId, bodyId: null, onGround: true })
      return
    }
    const bodyId = this.physicsWorld.addPlayerCapsule(
      radius,
      this.config.capsuleHalfHeight,
      [0, 5, 0],
      this.config.playerMass
    )
    this.playerBodies.set(playerId, { id: playerId, bodyId, onGround: true })
  }

  removePlayerCollider(playerId) {
    const data = this.playerBodies.get(playerId)
    if (data?.bodyId && this.physicsWorld) {
      this.physicsWorld.removeBody(data.bodyId)
    }
    this.playerBodies.delete(playerId)
  }

  updatePlayerPhysics(playerId, state, deltaTime) {
    const data = this.playerBodies.get(playerId)
    if (!data || !data.bodyId || !this.physicsWorld) {
      return this._fallbackPhysics(playerId, state, deltaTime)
    }
    const bodyId = data.bodyId
    const currentPos = this.physicsWorld.getBodyPosition(bodyId)
    const currentVel = this.physicsWorld.getBodyVelocity(bodyId)
    const newVel = [state.velocity[0], currentVel[1], state.velocity[2]]
    if (state.velocity[1] > 0 && data.onGround) {
      newVel[1] = state.velocity[1]
    }
    this.physicsWorld.setBodyVelocity(bodyId, newVel)
    this.physicsWorld.addForce(bodyId, [0, this.config.extraGravity * this.config.playerMass, 0])
    const pos = this.physicsWorld.getBodyPosition(bodyId)
    const vel = this.physicsWorld.getBodyVelocity(bodyId)
    data.onGround = this._checkGround(bodyId, pos)
    state.position = pos
    state.velocity = vel
    state.onGround = data.onGround
    return state
  }

  _checkGround(bodyId, position) {
    if (!this.physicsWorld) return false
    const rayOrigin = [position[0], position[1] - this.config.capsuleHalfHeight, position[2]]
    const checkDist = this.config.capsuleRadius + this.config.groundCheckDist
    const rayResult = this.physicsWorld.raycast(rayOrigin, [0, -1, 0], checkDist, bodyId)
    return rayResult.hit && rayResult.distance < checkDist
  }

  _fallbackPhysics(playerId, state, deltaTime) {
    state.velocity[1] += this.config.gravity[1] * deltaTime
    state.position[0] += state.velocity[0] * deltaTime
    state.position[1] += state.velocity[1] * deltaTime
    state.position[2] += state.velocity[2] * deltaTime
    if (state.position[1] <= 0) {
      state.position[1] = 0
      state.velocity[1] = 0
      state.onGround = true
    } else {
      state.onGround = false
    }
    return state
  }

  setPlayerPosition(playerId, position) {
    const data = this.playerBodies.get(playerId)
    if (data?.bodyId && this.physicsWorld) {
      this.physicsWorld.setBodyPosition(data.bodyId, position)
    }
  }

  getPlayerPosition(playerId) {
    const data = this.playerBodies.get(playerId)
    if (data?.bodyId && this.physicsWorld) {
      return this.physicsWorld.getBodyPosition(data.bodyId)
    }
    return [0, 0, 0]
  }

  checkCollisionWithOthers(playerId, allPlayers) {
    const data = this.playerBodies.get(playerId)
    if (!data) return []
    const pos = data.bodyId && this.physicsWorld
      ? this.physicsWorld.getBodyPosition(data.bodyId)
      : [0, 0, 0]
    const collisions = []
    for (const other of allPlayers) {
      if (other.id === playerId) continue
      const otherPos = other.state?.position || other.position
      if (!otherPos) continue
      const dx = otherPos[0] - pos[0]
      const dy = otherPos[1] - pos[1]
      const dz = otherPos[2] - pos[2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const minDist = this.config.capsuleRadius * 2
      if (distance < minDist && distance > 0) {
        collisions.push({ playerId: other.id, distance, normal: [dx / distance, dy / distance, dz / distance] })
      }
    }
    return collisions
  }

  raycast(origin, direction, maxDistance) {
    if (!this.physicsWorld) return { hit: false, distance: maxDistance }
    return this.physicsWorld.raycast(origin, direction, maxDistance)
  }

  validateMovement(playerId, newPosition, oldPosition) {
    const distance = Math.hypot(
      newPosition[0] - oldPosition[0],
      newPosition[1] - oldPosition[1],
      newPosition[2] - oldPosition[2]
    )
    if (distance > 2.0) return { valid: false, reason: 'move_too_far', distance }
    return { valid: true }
  }

  isJump(newPos, oldPos) {
    return newPos[1] > oldPos[1] && Math.abs(oldPos[1]) < 0.1
  }

  getSlopeAngle(position) {
    const rayResult = this.raycast(position, [0, -1, 0], 2.0)
    if (!rayResult.hit) return 0
    return 0
  }
}
