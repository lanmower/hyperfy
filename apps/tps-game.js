import { getMap, getSpawnPoint } from '../config/maps.js'
import { getGameMode } from '../config/game-modes.js'

export default {
  server: {
    setup(ctx) {
      const mapName = 'schwust'
      const modeName = 'ffa'
      const map = getMap(mapName)
      const mode = getGameMode(modeName)

      ctx.state.map = mapName
      ctx.state.mode = modeName
      ctx.state.config = mode
      ctx.state.spawnPoints = map.spawnPoints
      ctx.state.playerHealth = new Map()
      ctx.state.playerStats = new Map()
      ctx.state.respawning = new Map()
      ctx.state.started = Date.now()
      ctx.state.gameTime = 0

      ctx.world.spawn('map', { app: 'environment', model: map.model, position: [0, 0, 0] })
    },

    update(ctx, dt) {
      ctx.state.gameTime = (Date.now() - ctx.state.started) / 1000
      const now = Date.now()
      for (const [pid, data] of ctx.state.respawning) {
        if (now >= data.respawnAt) {
          const sp = ctx.state.spawnPoints[Math.floor(Math.random() * ctx.state.spawnPoints.length)]
          const player = ctx.players.getAll().find(p => p.id === pid)
          if (player && player.state) {
            player.state.health = ctx.state.config.health
            player.state.position = [...sp]
          }
          ctx.players.send(pid, { type: 'respawn', position: sp, health: ctx.state.config.health })
          ctx.state.respawning.delete(pid)
        }
      }
    },

    onMessage(ctx, msg) {
      if (!msg) return
      if (msg.type === 'player_join') {
        ctx.state.playerHealth.set(msg.playerId, ctx.state.config.health)
        ctx.state.playerStats.set(msg.playerId, { kills: 0, deaths: 0, damage: 0 })
      }
      if (msg.type === 'fire') {
        handleFire(ctx, msg)
      }
    }
  },

  client: {
    render(ctx) {
      return {
        position: ctx.entity.position,
        custom: { game: ctx.state.map, mode: ctx.state.mode, time: ctx.state.gameTime.toFixed(1) }
      }
    }
  }
}

function handleFire(ctx, msg) {
  const shooterId = msg.shooterId
  const origin = msg.origin
  const direction = msg.direction
  if (!origin || !direction) return

  const players = ctx.players.getAll()
  const range = 1000
  const damage = ctx.state.config.damagePerHit

  for (const target of players) {
    if (!target.state || target.id === shooterId) continue
    const tp = target.state.position
    const toTarget = [tp[0] - origin[0], tp[1] + 0.9 - origin[1], tp[2] - origin[2]]
    const dot = toTarget[0] * direction[0] + toTarget[1] * direction[1] + toTarget[2] * direction[2]
    if (dot < 0 || dot > range) continue
    const proj = [origin[0] + direction[0] * dot, origin[1] + direction[1] * dot, origin[2] + direction[2] * dot]
    const dist = Math.hypot(proj[0] - tp[0], proj[1] - (tp[1] + 0.9), proj[2] - tp[2])
    if (dist > 0.6) continue

    const hp = target.state.health || ctx.state.config.health
    const newHp = Math.max(0, hp - damage)
    target.state.health = newHp

    ctx.network.broadcast({ type: 'hit', shooter: shooterId, target: target.id, damage, health: newHp })

    if (newHp <= 0) {
      const shooterStats = ctx.state.playerStats.get(shooterId) || { kills: 0, deaths: 0, damage: 0 }
      shooterStats.kills++
      ctx.state.playerStats.set(shooterId, shooterStats)
      const targetStats = ctx.state.playerStats.get(target.id) || { kills: 0, deaths: 0, damage: 0 }
      targetStats.deaths++
      ctx.state.playerStats.set(target.id, targetStats)
      ctx.state.respawning.set(target.id, { respawnAt: Date.now() + ctx.state.config.respawnTime * 1000, killer: shooterId })
      ctx.network.broadcast({ type: 'death', victim: target.id, killer: shooterId })
    }
    break
  }
}
