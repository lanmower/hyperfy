export default {
  setup(ctx) {
    ctx.physics.setStatic(true)
    ctx.physics.addMeshCollider(ctx.entity.model)
  }
}
