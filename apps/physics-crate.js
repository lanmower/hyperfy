export default {
  setup(ctx) {
    ctx.physics.setDynamic(true)
    ctx.physics.setMass(10)
    ctx.physics.addBoxCollider([1, 1, 1])
  },
  onCollision(ctx, other) {
    if (other.velocity > 5) {
      ctx.entity.destroy()
      ctx.world.spawn('debris_' + ctx.entity.id, {
        model: 'debris.glb',
        position: ctx.entity.position
      })
    }
  },
  render(ctx) {
    return { animation: ctx.entity.velocity[1] < -1 ? 'falling' : 'idle' }
  }
}
