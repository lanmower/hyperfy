import { PhysicsWorld } from './src/physics/World.js'
import { AppContext } from './src/apps/AppContext.js'
import player_controller from './apps/player-controller.js'
import score_tracker from './apps/score-tracker.js'
import { join } from 'node:path'
import { getMap, getSpawnPoint } from './config/maps.js'

async function testMultiClient() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║    TEST: D4 MULTI-CLIENT GAME SESSION              ║')
  console.log('║         10-Player FFA Deathmatch (Simulated)       ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const schwust = getMap('schwust')
  const playerModel = join(process.cwd(), 'world/kaira.glb')
  const runtime = { _physics: world, currentTick: 0, deltaTime: 1/128, elapsed: 0 }

  const NUM_PLAYERS = 10
  const SIM_TICKS = 512
  const TICK_RATE = 128
  const DURATION_SEC = SIM_TICKS / TICK_RATE

  let players = []
  let contexts = []
  let bandwidth = 0
  let tickTimes = []
  let allPass = true

  console.log(`Spawning ${NUM_PLAYERS} players at schwust spawn points...`)
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const spawnPos = getSpawnPoint('schwust', i)
    const player = {
      id: `player_${i}`,
      model: playerModel,
      position: [...spawnPos],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      velocity: [0, 0, 0],
      custom: {},
      collider: null,
      bodyType: 'dynamic',
      mass: 80
    }
    const ctx = new AppContext(player, runtime)
    player_controller.server.setup(ctx)
    score_tracker.server.setup(ctx)

    players.push(player)
    contexts.push(ctx)
  }
  console.log(`✓ Spawned ${NUM_PLAYERS} players\n`)

  console.log(`Running ${SIM_TICKS} ticks (${DURATION_SEC.toFixed(2)}s) of game simulation...`)
  let killedPlayers = new Set()
  const scoreCtx = contexts[0]

  for (let tick = 0; tick < SIM_TICKS; tick++) {
    const tickStart = performance.now()
    runtime.currentTick = tick

    for (let i = 0; i < NUM_PLAYERS; i++) {
      const ctx = contexts[i]
      const player = players[i]

      if (ctx.state.dead) continue

      if (Math.random() < 0.02) {
        const actions = ['forward', 'backward', 'left', 'right', 'jump']
        const action = {}
        action[actions[Math.floor(Math.random() * actions.length)]] = true
        player_controller.server.onMessage(ctx, action)
      }

      if (Math.random() < 0.015 && !ctx.state.dead) {
        const victimIdx = Math.floor(Math.random() * NUM_PLAYERS)
        if (victimIdx !== i && !contexts[victimIdx].state.dead) {
          const victimCtx = contexts[victimIdx]
          const wasDead = victimCtx.state.dead
          player_controller.server.onMessage(victimCtx, {
            type: 'hit',
            shooter: ctx.entity.id,
            damage: 25
          })

          if (!wasDead && victimCtx.state.dead) {
            killedPlayers.add(victimIdx)
            score_tracker.server.onKill(scoreCtx, { playerId: ctx.entity.id })
            score_tracker.server.onDeath(scoreCtx, { playerId: victimCtx.entity.id })
          }
          bandwidth += 32
        }
      }

      player_controller.server.update(ctx, 1/TICK_RATE)
    }

    score_tracker.server.update(scoreCtx, 1/TICK_RATE)

    const tickEnd = performance.now()
    tickTimes.push(tickEnd - tickStart)
  }

  console.log(`✓ Simulation complete\n`)

  const avgTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length
  const maxTickTime = Math.max(...tickTimes)
  const tickRate = 1000 / (avgTickTime || 1)
  const bytesPerSecond = bandwidth / DURATION_SEC
  const bytesPerPlayer = bytesPerSecond / NUM_PLAYERS

  console.log('Test 1: All players spawned successfully')
  const allSpawned = players.length === NUM_PLAYERS
  console.log(allSpawned ? `✓ ${NUM_PLAYERS} players spawned` : `✗ Only ${players.length} players`)
  if (!allSpawned) allPass = false

  console.log('\nTest 2: Game loop ran at target TPS')
  const tpsOk = tickRate >= 120
  console.log(tpsOk ? `✓ Average tick rate: ${tickRate.toFixed(1)} TPS (target: ≥120)` : `✗ Tick rate too low: ${tickRate.toFixed(1)} TPS`)
  if (!tpsOk) allPass = false

  console.log('\nTest 3: Tick timing under 10ms average')
  const tickTimingOk = avgTickTime < 10
  console.log(tickTimingOk ? `✓ Avg tick time: ${avgTickTime.toFixed(2)}ms (max: ${maxTickTime.toFixed(2)}ms)` : `✗ Tick time too high: ${avgTickTime.toFixed(2)}ms`)
  if (!tickTimingOk) allPass = false

  console.log('\nTest 4: Bandwidth efficiency')
  const bandwidthOk = bytesPerPlayer < 20480
  console.log(bandwidthOk ? `✓ ${bytesPerPlayer.toFixed(0)} bytes/sec/player (target: <20KB/s)` : `✗ Bandwidth too high: ${bytesPerPlayer.toFixed(0)} bytes/sec/player`)
  if (!bandwidthOk) allPass = false

  console.log('\nTest 5: Combat engagement occurred')
  const combatOk = killedPlayers.size > 0
  console.log(combatOk ? `✓ ${killedPlayers.size} players killed in combat` : `✗ No combat occurred`)
  if (!combatOk) allPass = false

  console.log('\nTest 6: Score tracking working')
  const scoreTracker = scoreCtx.state.stats
  const hasStats = scoreTracker && Object.keys(scoreTracker).length > 0
  const totalKills = Object.values(scoreTracker || {}).reduce((sum, s) => sum + (s.kills || 0), 0)
  console.log(hasStats ? `✓ Score tracker recorded ${totalKills} kills from ${Object.keys(scoreTracker).length} players` : `✗ Score tracker inactive`)
  if (!hasStats) allPass = false

  console.log('\nTest 7: Health system stable')
  let healthOk = true
  for (const ctx of contexts) {
    if (ctx.state.health < 0 || ctx.state.health > ctx.state.maxHealth) {
      healthOk = false
      break
    }
  }
  console.log(healthOk ? '✓ All player health values in valid range' : '✗ Invalid health values detected')
  if (!healthOk) allPass = false

  console.log('\nTest 8: No crashes during simulation')
  let crashOk = true
  for (const player of players) {
    if (!Array.isArray(player.position) || player.position.some(n => !isFinite(n))) {
      crashOk = false
      break
    }
  }
  console.log(crashOk ? '✓ All positions valid (no NaN/Infinity)' : '✗ Invalid position data')
  if (!crashOk) allPass = false

  world.destroy()

  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log(`║  RESULT: ${allPass ? '✓ PASS' : '✗ FAIL'}${' '.repeat(41)}║`)
  console.log('╚════════════════════════════════════════════════════╝\n')
  console.log(`Simulation Summary:`)
  console.log(`  Duration: ${DURATION_SEC.toFixed(2)}s (${SIM_TICKS} ticks @ ${TICK_RATE} TPS)`)
  console.log(`  Players: ${NUM_PLAYERS}`)
  console.log(`  Avg Tick: ${avgTickTime.toFixed(3)}ms`)
  console.log(`  Bandwidth: ${bytesPerPlayer.toFixed(0)} bytes/player/sec`)
  console.log(`  Kills: ${killedPlayers.size}`)
  console.log()

  process.exit(allPass ? 0 : 1)
}

testMultiClient().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
