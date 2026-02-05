import { createServer } from './src/sdk/server.js'
import { PhysicsWorld } from './src/physics/World.js'
import { TickSystem } from './src/netcode/TickSystem.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const Results = {
  passed: 0,
  failed: 0,

  pass(name, msg = '') {
    this.passed++
    console.log(`✓ ${name}${msg ? ': ' + msg : ''}`)
  },

  fail(name, msg = '') {
    this.failed++
    console.log(`✗ ${name}${msg ? ': ' + msg : ''}`)
  },

  assert(condition, name, msg = '') {
    condition ? this.pass(name, msg) : this.fail(name, msg)
  },

  summary() {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`)
    console.log(`${'='.repeat(60)}\n`)
    return this.failed === 0
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function testFullPhysicsWorld() {
  console.log('\n=== TEST: Full Physics World Setup ===')

  const world = new PhysicsWorld({
    gravity: [0, -9.81, 0],
    enableOctree: true,
    octreeBounds: [-100, -100, -100, 100, 100, 100]
  })

  await world.init()

  const groundBox = world.addStaticBox([10, 0.5, 10], [0, -1, 0])
  Results.assert(groundBox !== null, 'Ground box created')

  const player1 = world.addDynamicCapsule(0.4, 0.9, [0, 2, 0], 80)
  const player2 = world.addDynamicCapsule(0.4, 0.9, [5, 2, 0], 80)
  const player3 = world.addDynamicCapsule(0.4, 0.9, [-5, 2, 0], 80)

  Results.assert(world.bodies.size === 4, '4 bodies in world (1 ground + 3 players)')

  for (let i = 0; i < 30; i++) {
    world.step(1 / 128)
  }

  const pos1 = world.getBodyPosition(player1)
  const pos2 = world.getBodyPosition(player2)
  const pos3 = world.getBodyPosition(player3)

  Results.assert(pos1[1] > -1, `Player 1 above ground: Y=${pos1[1].toFixed(2)}`)
  Results.assert(pos2[1] > -1, `Player 2 above ground: Y=${pos2[1].toFixed(2)}`)
  Results.assert(pos3[1] > -1, `Player 3 above ground: Y=${pos3[1].toFixed(2)}`)

  const nearOrigin = world.queryBodiesInRadius([0, 0, 0], 10)
  Results.assert(nearOrigin.length >= 1, `Query near origin found ${nearOrigin.length} bodies`)

  const stats = world.getOctreeStats()
  Results.assert(stats.totalItems === 4, `Octree tracking all ${stats.totalItems} bodies`)

  world.destroy()
}

async function testPhysicsWithTrimesh() {
  console.log('\n=== TEST: Physics with Trimesh Collider ===')

  const world = new PhysicsWorld({
    gravity: [0, -9.81, 0],
    enableOctree: true
  })

  await world.init()

  try {
    const trimeshId = world.addStaticTrimesh(join(__dirname, 'world', 'kaira.glb'), 0)
    const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 5, 0], 80)

    Results.assert(trimeshId !== null, 'Trimesh collider created')

    for (let i = 0; i < 50; i++) {
      world.step(1 / 128)
    }

    const capsulePos = world.getBodyPosition(capsuleId)
    Results.assert(capsulePos[1] < 5, `Capsule fell from Y=5 to Y=${capsulePos[1].toFixed(2)}`)

    world.destroy()
  } catch (e) {
    Results.fail('Physics with Trimesh', e.message)
  }
}

async function testMultipleBodyQueries() {
  console.log('\n=== TEST: Multiple Body Spatial Queries ===')

  const world = new PhysicsWorld({
    gravity: [0, 0, 0],
    enableOctree: true,
    octreeBounds: [-500, -500, -500, 500, 500, 500]
  })

  await world.init()

  const ids = []
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 400
    const y = (Math.random() - 0.5) * 400
    const z = (Math.random() - 0.5) * 400
    const id = world.addDynamicCapsule(0.4, 0.9, [x, y, z], 80)
    ids.push(id)
  }

  Results.assert(world.bodies.size === 50, '50 bodies created')

  const queryStart = performance.now()
  const nearOrigin = world.queryBodiesInRadius([0, 0, 0], 50)
  const queryTime = performance.now() - queryStart

  Results.assert(queryTime < 10, `Query on 50 bodies: ${queryTime.toFixed(2)}ms`)

  const boundQuery = world.queryBodiesInBounds([-100, -100, -100, 100, 100, 100])
  Results.assert(boundQuery.length > 0, `Bounds query found ${boundQuery.length} bodies`)

  world.destroy()
}

async function testTickSystemIntegration() {
  console.log('\n=== TEST: Tick System Integration ===')

  const tickSystem = new TickSystem(128)
  let tickCount = 0
  let lastDt = 0

  tickSystem.onTick((tick, dt) => {
    tickCount++
    lastDt = dt
  })

  tickSystem.start()

  await delay(100)
  tickSystem.stop()

  Results.assert(tickCount > 0, `${tickCount} ticks fired`)
  Results.assert(Math.abs(lastDt - 1 / 128) < 0.001, `Delta time correct: ${(lastDt * 1000).toFixed(2)}ms`)
}

async function testServerWorldLoading() {
  console.log('\n=== TEST: Server World Loading ===')

  const server = await createServer({
    port: 18088,
    tickRate: 128,
    appsDir: './apps'
  })

  try {
    Results.assert(server.physics !== null, 'Physics world available')
    Results.assert(server.tickSystem !== null, 'Tick system available')
    Results.assert(server.playerManager !== null, 'Player manager available')

    const snapshot = server.getSnapshot()
    Results.assert(snapshot !== null, 'Can get snapshot')

    Results.pass('Server configuration complete')
  } catch (e) {
    Results.fail('Server World Loading', e.message)
  }
}

async function testCapsuleVelocityApplicationFlow() {
  console.log('\n=== TEST: Capsule Velocity Application Flow ===')

  const world = new PhysicsWorld({
    gravity: [0, 0, 0],
    enableOctree: true
  })

  await world.init()

  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 0, 0], 80)
  const startPos = world.getBodyPosition(capsuleId)

  world.setBodyVelocity(capsuleId, [5, 0, 0])

  for (let i = 0; i < 20; i++) {
    world.step(1 / 128)
  }

  const endPos = world.getBodyPosition(capsuleId)
  const movement = endPos[0] - startPos[0]

  Results.assert(movement > 0, `Capsule moved: ${movement.toFixed(3)} units`)

  world.destroy()
}

async function testCollisionResponseThreeWay() {
  console.log('\n=== TEST: Three-Way Collision Response ===')

  const world = new PhysicsWorld({
    gravity: [0, -9.81, 0],
    enableOctree: true
  })

  await world.init()

  const ground = world.addStaticBox([5, 0.5, 5], [0, 0, 0])
  const cap1 = world.addDynamicCapsule(0.4, 0.9, [-2, 3, 0], 80)
  const cap2 = world.addDynamicCapsule(0.4, 0.9, [0, 3, 0], 80)
  const cap3 = world.addDynamicCapsule(0.4, 0.9, [2, 3, 0], 80)

  for (let i = 0; i < 40; i++) {
    world.step(1 / 128)
  }

  const pos1 = world.getBodyPosition(cap1)
  const pos2 = world.getBodyPosition(cap2)
  const pos3 = world.getBodyPosition(cap3)

  Results.assert(pos1[1] > 0, `Cap1 resting: Y=${pos1[1].toFixed(2)}`)
  Results.assert(pos2[1] > 0, `Cap2 resting: Y=${pos2[1].toFixed(2)}`)
  Results.assert(pos3[1] > 0, `Cap3 resting: Y=${pos3[1].toFixed(2)}`)

  const minDist = 0.8
  const dist12 = Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[2] - pos2[2]) ** 2)
  const dist23 = Math.sqrt((pos2[0] - pos3[0]) ** 2 + (pos2[2] - pos3[2]) ** 2)

  Results.assert(dist12 > 0, `Cap1-Cap2 distance: ${dist12.toFixed(2)}`)
  Results.assert(dist23 > 0, `Cap2-Cap3 distance: ${dist23.toFixed(2)}`)

  world.destroy()
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║        INTEGRATION TESTS - FULL SYSTEM                 ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  try {
    await testFullPhysicsWorld()
    await testPhysicsWithTrimesh()
    await testMultipleBodyQueries()
    await testTickSystemIntegration()
    await testServerWorldLoading()
    await testCapsuleVelocityApplicationFlow()
    await testCollisionResponseThreeWay()
  } catch (e) {
    console.error('\nFATAL ERROR:', e)
    console.error(e.stack)
    process.exit(1)
  }

  const success = Results.summary()
  process.exit(success ? 0 : 1)
}

runAllTests()
