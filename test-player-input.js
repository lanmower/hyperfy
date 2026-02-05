import { PhysicsWorld } from './src/physics/World.js'
import { AppContext } from './src/apps/AppContext.js'
import player_controller from './apps/player-controller.js'
import { join } from 'node:path'

async function testPlayerInput() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║    TEST: D2 PLAYER INPUT INTEGRATION              ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const runtime = {
    _physics: world,
    currentTick: 0,
    deltaTime: 1/128,
    elapsed: 0
  }

  const player = {
    id: 'player_1',
    model: join(process.cwd(), 'world/kaira.glb'),
    position: [0, 5, 0],
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

  let allPass = true
  const threshold = 0.1

  console.log('Test 1: Forward movement input')
  player.position = [0, 5, 0]
  player.velocity = [0, 0, 0]
  player_controller.server.onMessage(ctx, { forward: true })
  for (let i = 0; i < 50; i++) {
    player_controller.server.update(ctx, 1/128)
  }
  const moved = Math.abs(player.position[2]) > threshold
  console.log(moved ? '✓ Player moved forward' : '✗ Player did not move')
  if (!moved) allPass = false

  console.log('\nTest 2: Strafe (right) input')
  player.position = [0, 5, 0]
  player.velocity = [0, 0, 0]
  player_controller.server.onMessage(ctx, { right: true })
  for (let i = 0; i < 50; i++) {
    player_controller.server.update(ctx, 1/128)
  }
  const strafed = Math.abs(player.position[0]) > threshold
  console.log(strafed ? '✓ Player strafed right' : '✗ Player did not strafe')
  if (!strafed) allPass = false

  console.log('\nTest 3: Jump input')
  player.position = [0, 5, 0]
  player.velocity = [0, 0, 0]
  ctx.state.onGround = true
  player_controller.server.onMessage(ctx, { jump: true })
  for (let i = 0; i < 50; i++) {
    player_controller.server.update(ctx, 1/128)
  }
  const jumped = player.position[1] > 5.5
  console.log(jumped ? '✓ Player jumped' : '✗ Player did not jump')
  if (!jumped) allPass = false

  console.log('\nTest 4: Simultaneous inputs (forward + strafe + jump)')
  player.position = [0, 5, 0]
  player.velocity = [0, 0, 0]
  ctx.state.onGround = true
  const posStart = [...player.position]
  player_controller.server.onMessage(ctx, { forward: true, right: true, jump: true })
  for (let i = 0; i < 50; i++) {
    player_controller.server.update(ctx, 1/128)
  }
  const movedX = Math.abs(player.position[0] - posStart[0]) > threshold
  const movedZ = Math.abs(player.position[2] - posStart[2]) > threshold
  const movedY = Math.abs(player.position[1] - posStart[1]) > threshold
  const simultaneousOk = movedX && movedZ && movedY
  console.log(simultaneousOk ? '✓ All inputs processed simultaneously' : '✗ Some inputs failed')
  if (!simultaneousOk) allPass = false

  world.destroy()

  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log(`║  RESULT: ${allPass ? '✓ PASS' : '✗ FAIL'}${' '.repeat(41)}║`)
  console.log('╚════════════════════════════════════════════════════╝\n')

  process.exit(allPass ? 0 : 1)
}

testPlayerInput().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
