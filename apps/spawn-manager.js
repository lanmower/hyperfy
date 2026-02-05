export default {
  server: {
    setup(ctx) {
      ctx.state.spawnPoints = [
        [0, 5, 0],
        [20, 5, -20],
        [-20, 5, 20],
        [0, 5, -30]
      ]
      ctx.state.respawnTime = 3
      ctx.state.respawning = new Map()
      ctx.state.activeEntities = []
      ctx.debug.state('spawn-manager', 'active_spawns', ctx.state.spawnPoints.length)
    },

    update(ctx, dt) {
      const state = ctx.state
      const now = Date.now()
      for (const [id, respawnData] of state.respawning) {
        if (now >= respawnData.respawnAt) {
          const spawnPt = state.spawnPoints[Math.floor(Math.random() * state.spawnPoints.length)]
          ctx.world.getEntity(id).position = [...spawnPt]
          ctx.players.send(id, { type: 'respawn', position: spawnPt })
          ctx.debug.respawn(id, spawnPt)
          state.respawning.delete(id)
        }
      }
    },

    onMessage(ctx, msg) {
      if (msg && msg.type === 'register_entity') {
        ctx.state.activeEntities.push(msg.id)
      }
      if (msg && msg.type === 'death') {
        const respawnAt = Date.now() + (ctx.state.respawnTime * 1000)
        ctx.state.respawning.set(msg.victim, { respawnAt, killer: msg.killer })
      }
    }
  },

  client: {
    render(ctx) {
      return {
        position: ctx.entity.position,
        custom: { spawner: true }
      }
    }
  }
}
