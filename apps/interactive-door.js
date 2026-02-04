export default {
  setup(ctx) {
    ctx.state.open = false
    ctx.state.openAngle = Math.PI / 2
    ctx.physics.setKinematic(true)
    ctx.physics.addBoxCollider([2, 3, 0.2])
  },
  update(ctx, dt) {
    const nearest = ctx.players.getNearest(ctx.entity.position, 3)
    if (nearest && !ctx.state.open) {
      ctx.state.open = true
      const rot = ctx.entity.rotation
      rot.y = ctx.state.openAngle
      ctx.entity.rotation = rot
    } else if (!nearest && ctx.state.open) {
      ctx.state.open = false
      const rot = ctx.entity.rotation
      rot.y = 0
      ctx.entity.rotation = rot
    }
  },
  render(ctx) {
    return { animation: ctx.state.open ? 'open' : 'closed' }
  }
}
