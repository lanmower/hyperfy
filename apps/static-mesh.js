export default {
  server: {
    setup(ctx) {
      ctx.physics.setStatic(true)
      ctx.physics.addMeshCollider(ctx.entity.model)
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
