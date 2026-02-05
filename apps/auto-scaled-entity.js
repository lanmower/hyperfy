export default {
  server: {
    setup(ctx) {
      ctx.debug.spawn(ctx.entity.id, ctx.entity.position)
      ctx.physics.setDynamic(true)
      ctx.physics.setMass(80)
      const collider = ctx.collider.fitToModel()
      ctx.debug.state(ctx.entity.id, 'collider', collider.type)
    },

    update(ctx, dt) {
      const pos = ctx.entity.position
      const vel = ctx.entity.velocity
      const speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2])
      if (speed > 0.5) {
        ctx.debug.physics(ctx.entity.id, pos, vel, ctx.state.health || 100)
      }
    },

    teardown(ctx) {
      ctx.debug.log('Entity destroyed: ' + ctx.entity.id)
    }
  },

  client: {
    render(ctx) {
      return {
        model: ctx.entity.model,
        position: ctx.entity.position,
        rotation: ctx.entity.rotation
      }
    }
  }
}
