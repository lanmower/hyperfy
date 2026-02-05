export default {
  server: {
    setup(ctx) {
      ctx.state.velocity = [0, 0, 0]
      ctx.state.onGround = true
      ctx.state.moveSpeed = 6.0
      ctx.state.jumpImpulse = 7.0
      ctx.state.maxFallSpeed = 50
      ctx.state.groundDist = 0.1
      ctx.state.health = 100
      ctx.state.maxHealth = 100
      ctx.state.dead = false
      ctx.physics.setDynamic(true)
      ctx.physics.setMass(80)
      ctx.physics.addCapsuleCollider(0.4, 0.9)
      ctx.debug.spawn(ctx.entity.id, ctx.entity.position)
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

      if (msg.type === 'hit') {
        state.health -= msg.damage || 25
        ctx.debug.hit(msg.shooter, ctx.entity.id, msg.damage || 25)
        if (state.health <= 0 && !state.dead) {
          state.dead = true
          state.health = 0
          ctx.debug.death(ctx.entity.id, state.maxHealth)
          ctx.events.emit('death', { killer: msg.shooter, victim: ctx.entity.id })
        }
        return
      }

      if (state.dead) return

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
          health: ctx.state.health,
          dead: ctx.state.dead,
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
