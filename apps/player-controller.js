export default {
  server: {
    setup(ctx) {
      ctx.state.velocity = [0, 0, 0]
      ctx.state.onGround = true
      ctx.state.moveSpeed = 6.0
      ctx.state.jumpImpulse = 7.0
      ctx.state.maxFallSpeed = 50
      ctx.state.groundDist = 0.1
      ctx.physics.setDynamic(true)
      ctx.physics.setMass(80)
      ctx.physics.addCapsuleCollider(0.4, 0.9)
    },

    update(ctx, dt) {
      const state = ctx.state
      const entity = ctx.entity
      const gravity = ctx.world.gravity || [0, -9.81, 0]

      const pos = entity.position
      const vel = state.velocity

      vel[0] = num(vel[0])
      vel[1] = num(vel[1])
      vel[2] = num(vel[2])

      vel[1] += gravity[1] * dt

      if (Math.abs(vel[1]) > state.maxFallSpeed) {
        vel[1] = vel[1] > 0 ? state.maxFallSpeed : -state.maxFallSpeed
      }

      pos[0] += vel[0] * dt
      pos[1] += vel[1] * dt
      pos[2] += vel[2] * dt

      if (pos[1] <= state.groundDist) {
        pos[1] = state.groundDist
        vel[1] = 0
        state.onGround = true
      } else {
        state.onGround = false
      }

      entity.position = pos
      entity.velocity = vel
    },

    onMessage(ctx, msg) {
      if (!msg || typeof msg !== 'object') return
      const state = ctx.state
      const vel = state.velocity

      let vx = 0, vz = 0

      if (msg.forward) vz += state.moveSpeed
      if (msg.backward) vz -= state.moveSpeed
      if (msg.left) vx -= state.moveSpeed
      if (msg.right) vx += state.moveSpeed

      if (msg.jump && state.onGround) {
        vel[1] = state.jumpImpulse
        state.onGround = false
      }

      vel[0] = vx
      vel[2] = vz
    }
  },

  client: {
    render(ctx) {
      return {
        model: ctx.entity.model,
        position: ctx.entity.position,
        rotation: ctx.entity.rotation,
        custom: {
          onGround: ctx.state.onGround,
          falling: ctx.state.velocity && ctx.state.velocity[1] < -1
        }
      }
    }
  }
}

function num(n) {
  return typeof n === 'number' && !isNaN(n) ? n : 0
}
