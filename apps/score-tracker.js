export default {
  server: {
    setup(ctx) {
      if (!ctx.state.stats) ctx.state.stats = {}
      if (!ctx.state.broadcastInterval) {
        ctx.state.broadcastInterval = setInterval(() => {
          const stats = {}
          
          for (const playerId in ctx.state.stats) {
            const playerStats = ctx.state.stats[playerId]
            stats[playerId] = {
              kills: playerStats.kills,
              deaths: playerStats.deaths,
              damage: playerStats.damage,
              shots: playerStats.shots,
              kd: playerStats.deaths > 0 ? playerStats.kills / playerStats.deaths : playerStats.kills,
              accuracy: playerStats.shots > 0 ? playerStats.damage / playerStats.shots : 0
            }
          }
          
          const leaderboard = Object.entries(ctx.state.stats)
            .sort((a, b) => b[1].kills - a[1].kills)
            .slice(0, 5)
            .map(([pid, s]) => ({
              playerId: pid,
              kills: s.kills,
              deaths: s.deaths,
              kd: s.deaths > 0 ? s.kills / s.deaths : s.kills
            }))
          
          ctx.network.broadcast({
            type: 'stats',
            players: stats,
            leaderboard: leaderboard
          })
        }, 1000)
      }
    },
    
    update(ctx, dt) {},
    
    teardown(ctx) {
      if (ctx.state.broadcastInterval) {
        clearInterval(ctx.state.broadcastInterval)
        ctx.state.broadcastInterval = null
      }
    },
    
    onHit(ctx, data) {
      const playerId = data.playerId
      if (!ctx.state.stats[playerId]) {
        ctx.state.stats[playerId] = { kills: 0, deaths: 0, damage: 0, shots: 0 }
      }
      ctx.state.stats[playerId].damage += data.damage || 0
    },
    
    onKill(ctx, data) {
      const playerId = data.playerId
      if (!ctx.state.stats[playerId]) {
        ctx.state.stats[playerId] = { kills: 0, deaths: 0, damage: 0, shots: 0 }
      }
      ctx.state.stats[playerId].kills += 1
    },
    
    onDeath(ctx, data) {
      const playerId = data.playerId
      if (!ctx.state.stats[playerId]) {
        ctx.state.stats[playerId] = { kills: 0, deaths: 0, damage: 0, shots: 0 }
      }
      ctx.state.stats[playerId].deaths += 1
    },
    
    onShot(ctx, data) {
      const playerId = data.playerId
      if (!ctx.state.stats[playerId]) {
        ctx.state.stats[playerId] = { kills: 0, deaths: 0, damage: 0, shots: 0 }
      }
      ctx.state.stats[playerId].shots += 1
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
