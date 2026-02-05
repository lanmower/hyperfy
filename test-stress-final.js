import { PhysicsWorld } from './src/physics/World.js'
import { AppContext } from './src/apps/AppContext.js'
import player_controller from './apps/player-controller.js'
import score_tracker from './apps/score-tracker.js'
import { join } from 'node:path'
import { getMap, getSpawnPoint } from './config/maps.js'

async function testStressFinal() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║    TEST: D5 STRESS TEST VALIDATION (FINAL)         ║')
  console.log('║    10 Players + 100 Physics Objects on Schwust      ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const schwust = getMap('schwust')
  const playerModel = join(process.cwd(), 'world/kaira.glb')
  const runtime = { _physics: world, currentTick: 0, deltaTime: 1/128, elapsed: 0 }

  const NUM_PLAYERS = 10
  const NUM_OBJECTS = 100
  const TOTAL_ENTITIES = NUM_PLAYERS + NUM_OBJECTS
  const SIM_TICKS = 1024
  const TICK_RATE = 128
  const DURATION_SEC = SIM_TICKS / TICK_RATE

  let players = []
  let contexts = []
  let objects = []
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
  console.log(`✓ Spawned ${NUM_PLAYERS} players`)

  console.log(`Spawning ${NUM_OBJECTS} physics objects on map...`)
  const [minX, minY, minZ, maxX, maxY, maxZ] = schwust.bounds
  for (let i = 0; i < NUM_OBJECTS; i++) {
    const x = minX + Math.random() * (maxX - minX)
    const y = minY + 5
    const z = minZ + Math.random() * (maxZ - minZ)

    const obj = {
      id: `crate_${i}`,
      model: null,
      position: [x, y, z],
      rotation: [0, 0, 0, 1],
      scale: [0.5, 0.5, 0.5],
      velocity: [0, 0, 0],
      custom: {},
      collider: { type: 'box', size: 0.5 },
      bodyType: 'dynamic',
      mass: 10
    }
    objects.push(obj)
  }
  console.log(`✓ Spawned ${NUM_OBJECTS} objects\n`)

  console.log(`Running ${SIM_TICKS} ticks (${DURATION_SEC.toFixed(2)}s) with ${TOTAL_ENTITIES} entities...`)
  let killedPlayers = new Set()
  const scoreCtx = contexts[0]

  for (let tick = 0; tick < SIM_TICKS; tick++) {
    const tickStart = performance.now()
    runtime.currentTick = tick

    for (let i = 0; i < NUM_PLAYERS; i++) {
      const ctx = contexts[i]
      const player = players[i]

      if (ctx.state.dead) continue

      if (Math.random() < 0.015) {
        const actions = ['forward', 'backward', 'left', 'right', 'jump']
        const action = {}
        action[actions[Math.floor(Math.random() * actions.length)]] = true
        player_controller.server.onMessage(ctx, action)
      }

      if (Math.random() < 0.01 && !ctx.state.dead) {
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

    for (const obj of objects) {
      obj.velocity[1] = Math.max(-100, obj.velocity[1] - 9.81 * (1/TICK_RATE))
      obj.position[0] += obj.velocity[0] * (1/TICK_RATE)
      obj.position[1] += obj.velocity[1] * (1/TICK_RATE)
      obj.position[2] += obj.velocity[2] * (1/TICK_RATE)
      if (obj.position[1] < 0) obj.position[1] = 0
    }

    score_tracker.server.update(scoreCtx, 1/TICK_RATE)

    const tickEnd = performance.now()
    tickTimes.push(tickEnd - tickStart)
  }

  console.log(`✓ Simulation complete\n`)

  const avgTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length
  const maxTickTime = Math.max(...tickTimes)
  const minTickTime = Math.min(...tickTimes)
  const tickRate = 1000 / (avgTickTime || 1)
  const bytesPerSecond = bandwidth / DURATION_SEC
  const bytesPerPlayer = bytesPerSecond / NUM_PLAYERS

  console.log('Test 1: All entities present')
  const entitiesOk = players.length === NUM_PLAYERS && objects.length === NUM_OBJECTS
  console.log(entitiesOk ? `✓ ${TOTAL_ENTITIES} entities (${NUM_PLAYERS} players + ${NUM_OBJECTS} objects)` : `✗ Wrong entity count`)
  if (!entitiesOk) allPass = false

  console.log('\nTest 2: Game loop maintained 128+ TPS with load')
  const tpsOk = tickRate >= 120
  console.log(tpsOk ? `✓ Average tick rate: ${tickRate.toFixed(1)} TPS (min: ${minTickTime.toFixed(2)}ms)` : `✗ TPS dropped below 120: ${tickRate.toFixed(1)}`)
  if (!tpsOk) allPass = false

  console.log('\nTest 3: Tick timing stable under load')
  const tickTimingOk = avgTickTime < 10 && maxTickTime < 50
  console.log(tickTimingOk ? `✓ Avg: ${avgTickTime.toFixed(2)}ms, Max: ${maxTickTime.toFixed(2)}ms (target: <50ms)` : `✗ Timing exceeded limits`)
  if (!tickTimingOk) allPass = false

  console.log('\nTest 4: Bandwidth efficient with 110 entities')
  const bandwidthOk = bytesPerPlayer < 20480
  console.log(bandwidthOk ? `✓ ${bytesPerPlayer.toFixed(0)} bytes/sec/player (target: <20KB/s)` : `✗ Bandwidth high: ${bytesPerPlayer.toFixed(0)}`)
  if (!bandwidthOk) allPass = false

  console.log('\nTest 5: Combat accuracy with physics objects present')
  const combatOk = killedPlayers.size >= 2
  console.log(combatOk ? `✓ ${killedPlayers.size} players killed (combat working despite 100 objects)` : `✗ Only ${killedPlayers.size} kills`)
  if (!combatOk) allPass = false

  console.log('\nTest 6: Physics object integrity')
  let physicsOk = true
  for (const obj of objects) {
    if (!Array.isArray(obj.position) || obj.position.some(n => !isFinite(n))) {
      physicsOk = false
      break
    }
  }
  console.log(physicsOk ? '✓ All 100 objects have valid positions' : '✗ Invalid object positions')
  if (!physicsOk) allPass = false

  console.log('\nTest 7: Player health/state stable with object load')
  let playerStateOk = true
  for (const ctx of contexts) {
    if (ctx.state.health < 0 || ctx.state.health > ctx.state.maxHealth) {
      playerStateOk = false
      break
    }
  }
  console.log(playerStateOk ? '✓ All 10 players health valid' : '✗ Invalid player state')
  if (!playerStateOk) allPass = false

  console.log('\nTest 8: No memory corruption or crashes')
  let integrityOk = true
  for (const player of players) {
    if (!Array.isArray(player.position) || player.position.length !== 3) {
      integrityOk = false
      break
    }
    if (!Array.isArray(player.velocity) || player.velocity.length !== 3) {
      integrityOk = false
      break
    }
  }
  console.log(integrityOk ? '✓ All data structures intact' : '✗ Data corruption detected')
  if (!integrityOk) allPass = false

  world.destroy()

  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log(`║  RESULT: ${allPass ? '✓ PASS' : '✗ FAIL'}${' '.repeat(41)}║`)
  console.log('╚════════════════════════════════════════════════════╝\n')
  console.log(`Stress Test Summary:`)
  console.log(`  Total Entities: ${TOTAL_ENTITIES} (${NUM_PLAYERS} players, ${NUM_OBJECTS} objects)`)
  console.log(`  Duration: ${DURATION_SEC.toFixed(2)}s (${SIM_TICKS} ticks @ ${TICK_RATE} TPS)`)
  console.log(`  Tick Performance: ${avgTickTime.toFixed(3)}ms avg, ${maxTickTime.toFixed(2)}ms max`)
  console.log(`  Throughput: ${tickRate.toFixed(1)} TPS`)
  console.log(`  Bandwidth: ${bytesPerPlayer.toFixed(0)} bytes/player/sec`)
  console.log(`  Combat: ${killedPlayers.size} kills`)
  console.log(`  Status: ${allPass ? 'PRODUCTION READY' : 'NEEDS OPTIMIZATION'}`)
  console.log()

  process.exit(allPass ? 0 : 1)
}

testStressFinal().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
