export class PhysicsIntegration {
  constructor(config = {}) {
    this.physicsWorld = config.physicsWorld || null
    this.config = {
      gravity: config.gravity || [0, -9.81, 0],
      groundDist: config.groundDist || 0.1,
      teleportThreshold: config.teleportThreshold || 1.0,
      maxFallSpeed: config.maxFallSpeed || 50,
      ...config
    }
    this.playerColliders = new Map()
  }

  addPlayerCollider(playerId, radius = 0.5) {
    this.playerColliders.set(playerId, {
      id: playerId,
      radius,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      onGround: true
    })
  }

  removePlayerCollider(playerId) {
    this.playerColliders.delete(playerId)
  }

  updatePlayerPhysics(playerId, state, deltaTime) {
    const collider = this.playerColliders.get(playerId)
    if (!collider) return state

    const prevPos = [...collider.position]
    collider.position = [...state.position]
    collider.velocity = [...state.velocity]

    const distance = Math.hypot(
      prevPos[0] - collider.position[0],
      prevPos[1] - collider.position[1],
      prevPos[2] - collider.position[2]
    )

    if (distance > this.config.teleportThreshold) {
      collider.velocity = [0, 0, 0]
      state.velocity = [0, 0, 0]
    }

    collider.velocity[1] -= this.config.gravity[1] * deltaTime

    if (Math.abs(collider.velocity[1]) > this.config.maxFallSpeed) {
      collider.velocity[1] = -this.config.maxFallSpeed
    }

    collider.position[1] += collider.velocity[1] * deltaTime

    if (collider.position[1] <= this.config.groundDist) {
      collider.position[1] = 0
      collider.velocity[1] = 0
      collider.onGround = true
    } else {
      collider.onGround = false
    }

    state.position = [...collider.position]
    state.velocity = [...collider.velocity]
    state.onGround = collider.onGround

    return state
  }

  checkGroundCollision(position) {
    return position[1] <= this.config.groundDist
  }

  checkCollisionWithOthers(playerId, allPlayers) {
    const collider = this.playerColliders.get(playerId)
    if (!collider) return []

    const collisions = []

    for (const other of allPlayers) {
      if (other.id === playerId) continue

      const dx = other.position[0] - collider.position[0]
      const dy = other.position[1] - collider.position[1]
      const dz = other.position[2] - collider.position[2]

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const minDistance = collider.radius + 0.5

      if (distance < minDistance) {
        collisions.push({
          playerId: other.id,
          distance,
          normal: [dx / distance, dy / distance, dz / distance]
        })
      }
    }

    return collisions
  }

  raycast(origin, direction, maxDistance) {
    if (!this.physicsWorld) {
      return { hit: false, distance: maxDistance }
    }

    return this.physicsWorld.raycast(origin, direction, maxDistance)
  }

  validateMovement(playerId, newPosition, oldPosition) {
    const maxStepHeight = 0.5

    const heightDiff = newPosition[1] - oldPosition[1]
    if (heightDiff > maxStepHeight && !this.isJump(newPosition, oldPosition)) {
      return { valid: false, reason: 'step_too_high' }
    }

    const distance = Math.hypot(
      newPosition[0] - oldPosition[0],
      newPosition[1] - oldPosition[1],
      newPosition[2] - oldPosition[2]
    )

    const maxDistance = 2.0

    if (distance > maxDistance) {
      return { valid: false, reason: 'move_too_far', distance }
    }

    return { valid: true }
  }

  isJump(newPos, oldPos) {
    return newPos[1] > oldPos[1] && Math.abs(oldPos[1]) < 0.1
  }

  getSlopeAngle(position) {
    const rayResult = this.raycast(position, [0, -1, 0], 2.0)
    if (!rayResult.hit) return 0

    const normal = [0, 1, 0]
    return Math.acos(Math.max(0, Math.min(1, normal[1])))
  }
}
