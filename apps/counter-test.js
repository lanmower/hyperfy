export default {
  server: {
    setup(ctx) {
      ctx.state.count = 0
      ctx.state.maxCount = 100
    },
    update(ctx, dt) {
      ctx.state.count++
    }
  },
  client: {
    render(ctx) {
      return {
        position: ctx.entity.position,
        custom: { counter: ctx.state.count }
      }
    }
  }
}
