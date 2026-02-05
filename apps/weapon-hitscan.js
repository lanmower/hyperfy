export default {
  server: {
    setup(ctx) {
      ctx.state.fireRate = 10
      ctx.state.range = 1000
      ctx.state.damage = 25
      ctx.state.headshotMultiplier = 2
      ctx.state.lastFireTime = {}
    },
    onMessage(ctx, msg) {
      if (msg.type !== 'fire') return

      const now = ctx.time.tick
      const shooterId = msg.shooterId
      if (ctx.state.lastFireTime[shooterId] === now) return

      const shooter = ctx.players.getAll().find(p => p.id === shooterId)
      if (!shooter || !shooter.state) return

      const origin = [
        shooter.state.position[0],
        shooter.state.position[1] + 0.8,
        shooter.state.position[2]
      ]

      const result = ctx.raycast(origin, msg.direction, ctx.state.range)

      if (!result.hit) {
        ctx.state.lastFireTime[shooterId] = now
        return
      }

      const targets = ctx.players.getAll()
      for (const target of targets) {
        if (!target.state || target.id === shooterId) continue

        const headPos = [
          target.state.position[0],
          target.state.position[1] + 0.8,
          target.state.position[2]
        ]

        const dist = Math.hypot(
          headPos[0] - result.position[0],
          headPos[1] - result.position[1],
          headPos[2] - result.position[2]
        )

        if (dist <= 0.6) {
          const isHeadshot = result.position[1] > target.state.position[1] + 1.2
          const baseDamage = ctx.state.damage
          const dmg = isHeadshot ? Math.floor(baseDamage * ctx.state.headshotMultiplier) : baseDamage

          ctx.network.broadcast({
            type: 'hit',
            shooter: shooterId,
            target: target.id,
            position: result.position,
            damage: dmg,
            isHeadshot,
            tick: now
          })

          ctx.state.lastFireTime[shooterId] = now
          break
        }
      }
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
