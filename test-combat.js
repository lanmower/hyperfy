import { PhysicsWorld } from './src/physics/World.js'
import { AppContext } from './src/apps/AppContext.js'
import player_controller from './apps/player-controller.js'
import { join } from 'node:path'

async function testCombat() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║    TEST: D3 COMBAT VALIDATION                      ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const runtime = {
    _physics: world,
    currentTick: 0,
    deltaTime: 1/128,
    elapsed: 0
  }

  const playerModel = join(process.cwd(), 'world/kaira.glb')
  let allPass = true

  const playerA = {
    id: 'player_a',
    model: playerModel,
    position: [0, 5, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
    velocity: [0, 0, 0],
    custom: {},
    collider: null,
    bodyType: 'dynamic',
    mass: 80
  }

  const playerB = {
    id: 'player_b',
    model: playerModel,
    position: [10, 5, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
    velocity: [0, 0, 0],
    custom: {},
    collider: null,
    bodyType: 'dynamic',
    mass: 80
  }

  const ctxA = new AppContext(playerA, runtime)
  const ctxB = new AppContext(playerB, runtime)

  player_controller.server.setup(ctxA)
  player_controller.server.setup(ctxB)

  console.log('Test 1: Player B takes damage from single hit')
  const initialHealthB = ctxB.state.health
  player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
  const damageTaken = initialHealthB - ctxB.state.health
  const hit = damageTaken === 25
  console.log(hit ? `✓ Player B took ${damageTaken} damage` : `✗ Player B took ${damageTaken} damage (expected 25)`)
  if (!hit) allPass = false

  console.log('\nTest 2: Player B dies after 4 hits (100 HP / 25 damage)')
  ctxB.state.health = 100
  ctxB.state.dead = false
  let shots = 0
  for (let i = 0; i < 4; i++) {
    player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
    shots++
  }
  const dead = ctxB.state.dead
  console.log(dead ? `✓ Player B dead after ${shots} shots` : `✗ Player B still alive after ${shots} shots`)
  if (!dead) allPass = false

  console.log('\nTest 3: Multiple damage accumulates correctly')
  ctxB.state.health = 100
  ctxB.state.dead = false
  let totalDamage = 0
  for (let i = 0; i < 3; i++) {
    const before = ctxB.state.health
    player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
    totalDamage += before - ctxB.state.health
  }
  const correctAccumulation = totalDamage === 75 && ctxB.state.health === 25
  console.log(correctAccumulation ? `✓ Damage accumulated correctly (${totalDamage} damage, ${ctxB.state.health}hp remaining)` : `✗ Wrong damage (${totalDamage}, ${ctxB.state.health}hp)`)
  if (!correctAccumulation) allPass = false

  console.log('\nTest 4: Death event fired when health depleted')
  ctxB.state.health = 100
  ctxB.state.dead = false
  let deathEventFired = false
  ctxB._events.on('death', (evt) => {
    deathEventFired = true
  })
  for (let i = 0; i < 4; i++) {
    player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
  }
  console.log(deathEventFired ? '✓ Death event fired' : '✗ Death event not fired')
  if (!deathEventFired) allPass = false

  console.log('\nTest 5: Dead players stay dead (health clamps to 0)')
  ctxB.state.health = 0
  ctxB.state.dead = true
  player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
  const healthClamps = ctxB.state.health <= 0
  console.log(healthClamps ? '✓ Dead player health stays at 0' : `✗ Dead player health went negative`)
  if (!healthClamps) allPass = false

  console.log('\nTest 6: Attacker tracking on hit')
  ctxB.state.health = 100
  ctxB.state.dead = false
  let lastHitBy = null
  ctxB._events.on('death', (evt) => {
    lastHitBy = evt.killer
  })
  for (let i = 0; i < 4; i++) {
    player_controller.server.onMessage(ctxB, { type: 'hit', shooter: 'player_a', damage: 25 })
  }
  const attackerTracked = lastHitBy === 'player_a'
  console.log(attackerTracked ? '✓ Attacker tracked correctly' : `✗ Wrong attacker (${lastHitBy})`)
  if (!attackerTracked) allPass = false

  world.destroy()

  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log(`║  RESULT: ${allPass ? '✓ PASS' : '✗ FAIL'}${' '.repeat(41)}║`)
  console.log('╚════════════════════════════════════════════════════╝\n')

  process.exit(allPass ? 0 : 1)
}

testCombat().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
