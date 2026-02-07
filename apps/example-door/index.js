export default {
  server: {
    setup(ctx) {
      ctx.state.isOpen = false
      ctx.state.lastInteract = 0
      ctx.state.interactCooldown = 0.5
    },
    update(ctx, dt) {
      ctx.state.lastInteract += dt
    },
    onInteract(ctx, player) {
      if (ctx.state.lastInteract < ctx.state.interactCooldown) return
      ctx.state.isOpen = !ctx.state.isOpen
      ctx.state.lastInteract = 0
      ctx.entity.custom = { open: ctx.state.isOpen }
      ctx.players.broadcast({ type: 'door_toggle', entity: ctx.entity.id, open: ctx.state.isOpen })
    }
  },
  client: {
    render(ctx) {
      return {
        position: ctx.entity.position,
        rotation: ctx.entity.rotation,
        custom: { doorState: ctx.state.isOpen ? 'open' : 'closed' }
      }
    }
  }
}
