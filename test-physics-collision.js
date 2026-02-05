import { PhysicsWorld } from './src/physics/World.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const Results = {
  passed: 0,
  failed: 0,
  tests: [],

  pass(name, msg = '') {
    this.passed++
    this.tests.push({ status: 'PASS', name, msg })
    console.log(`✓ ${name}${msg ? ': ' + msg : ''}`)
  },

  fail(name, msg = '') {
    this.failed++
    this.tests.push({ status: 'FAIL', name, msg })
    console.log(`✗ ${name}${msg ? ': ' + msg : ''}`)
  },

  assert(condition, name, msg = '') {
    condition ? this.pass(name, msg) : this.fail(name, msg)
  },

  assertClose(actual, expected, tolerance, name, msg = '') {
    const pass = Math.abs(actual - expected) <= tolerance
    this.assert(pass, name, `${actual.toFixed(3)} ≈ ${expected.toFixed(3)} (±${tolerance})`)
    return pass
  },

  summary() {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`)
    console.log(`${'='.repeat(50)}\n`)
    return this.failed === 0
  }
}

function vec3Len(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
}

function vec3Sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

async function testCapsuleGravity() {
  console.log('\n=== TEST: Capsule Gravity ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 5, 0], 80)
  const startPos = world.getBodyPosition(capsuleId)
  Results.assertClose(startPos[1], 5, 0.01, 'Capsule spawned at Y=5')

  for (let i = 0; i < 10; i++) {
    world.step(1 / 128)
  }

  const afterPos = world.getBodyPosition(capsuleId)
  Results.assert(afterPos[1] < startPos[1], `Capsule fell: Y ${startPos[1].toFixed(2)} → ${afterPos[1].toFixed(2)}`)

  world.destroy()
}

async function testCapsuleCollisionWithBox() {
  console.log('\n=== TEST: Capsule Collision with Static Box ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const boxId = world.addStaticBox([2, 0.5, 2], [0, 0, 0])
  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 2, 0], 80)

  const startPos = world.getBodyPosition(capsuleId)

  for (let i = 0; i < 30; i++) {
    world.step(1 / 128)
  }

  const endPos = world.getBodyPosition(capsuleId)
  Results.assert(endPos[1] > 0.5, `Capsule rests on box: Y=${endPos[1].toFixed(3)}`)

  world.destroy()
}

async function testCapsuleTrimeshCollision() {
  console.log('\n=== TEST: Capsule Collision with Trimesh ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  try {
    const trimeshId = world.addStaticTrimesh(join(__dirname, 'world', 'kaira.glb'), 0)
    const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 2, 0], 80)

    const startPos = world.getBodyPosition(capsuleId)

    for (let i = 0; i < 50; i++) {
      world.step(1 / 128)
    }

    const endPos = world.getBodyPosition(capsuleId)
    Results.assert(endPos[1] < startPos[1], 'Capsule moved down under gravity')
    Results.assert(vec3Len(vec3Sub(endPos, startPos)) > 0, 'Position changed due to gravity')

    world.destroy()
  } catch (e) {
    Results.fail('Capsule Trimesh Collision', e.message)
  }
}

async function testMultipleCapsules() {
  console.log('\n=== TEST: Multiple Capsules ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const capsule1 = world.addDynamicCapsule(0.4, 0.9, [0, 2, 0], 80)
  const capsule2 = world.addDynamicCapsule(0.4, 0.9, [2, 2, 0], 80)
  const capsule3 = world.addDynamicCapsule(0.4, 0.9, [-2, 2, 0], 80)

  Results.assert(world.bodies.size === 3, 'Three capsules created')

  for (let i = 0; i < 20; i++) {
    world.step(1 / 128)
  }

  const pos1 = world.getBodyPosition(capsule1)
  const pos2 = world.getBodyPosition(capsule2)
  const pos3 = world.getBodyPosition(capsule3)

  const dist12 = vec3Len(vec3Sub(pos1, pos2))
  const dist13 = vec3Len(vec3Sub(pos1, pos3))

  Results.assert(dist12 > 0, `Distance between capsule 1 and 2: ${dist12.toFixed(3)}`)
  Results.assert(dist13 > 0, `Distance between capsule 1 and 3: ${dist13.toFixed(3)}`)

  world.destroy()
}

async function testVelocityApplication() {
  console.log('\n=== TEST: Velocity Application ===')
  const world = new PhysicsWorld({ gravity: [0, 0, 0] })
  await world.init()

  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 0, 0], 80)
  world.setBodyVelocity(capsuleId, [5, 0, 0])

  const vel = world.getBodyVelocity(capsuleId)
  Results.assertClose(vel[0], 5, 0.1, 'Velocity set to [5, 0, 0]')

  for (let i = 0; i < 20; i++) {
    world.step(1 / 128)
  }

  const pos = world.getBodyPosition(capsuleId)
  Results.assertClose(pos[0], 0.78, 0.3, 'Capsule moved along X axis')

  world.destroy()
}

async function testForceApplication() {
  console.log('\n=== TEST: Force Application ===')
  const world = new PhysicsWorld({ gravity: [0, 0, 0] })
  await world.init()

  const capsuleId = world.addDynamicCapsule(0.4, 0.9, [0, 0, 0], 80)

  for (let i = 0; i < 10; i++) {
    world.addForce(capsuleId, [100, 0, 0])
    world.step(1 / 128)
  }

  const vel = world.getBodyVelocity(capsuleId)
  Results.assert(vec3Len(vel) > 0, `Capsule accelerated, velocity: ${vec3Len(vel).toFixed(3)}`)

  world.destroy()
}

async function testCollisionLayerFiltering() {
  console.log('\n=== TEST: Collision Layer Filtering ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const staticBox = world.addStaticBox([1, 0.5, 1], [0, 0, 0])
  const dynamicCapsule = world.addDynamicCapsule(0.4, 0.9, [0, 5, 0], 80)

  Results.assert(staticBox !== null, 'Static box created')
  Results.assert(dynamicCapsule !== null, 'Dynamic capsule created')

  let collision = false
  for (let i = 0; i < 50; i++) {
    world.step(1 / 128)
    const pos = world.getBodyPosition(dynamicCapsule)
    if (pos[1] <= 1.0) {
      collision = true
      break
    }
  }

  Results.assert(collision, 'Capsule collided with static box')

  world.destroy()
}

async function testPhysicsPerfBaseline() {
  console.log('\n=== TEST: Physics Performance Baseline (10 bodies) ===')
  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  const ids = []
  for (let i = 0; i < 10; i++) {
    const id = world.addDynamicCapsule(0.4, 0.9, [i * 0.5, 2 + i * 0.1, 0], 80)
    ids.push(id)
  }

  const start = performance.now()
  for (let i = 0; i < 100; i++) {
    world.step(1 / 128)
  }
  const elapsed = performance.now() - start

  Results.assert(elapsed < 1000, `100 ticks with 10 bodies: ${elapsed.toFixed(1)}ms`)

  world.destroy()
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗')
  console.log('║      PHYSICS & COLLISION TESTS                    ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  try {
    await testCapsuleGravity()
    await testCapsuleCollisionWithBox()
    await testCapsuleTrimeshCollision()
    await testMultipleCapsules()
    await testVelocityApplication()
    await testForceApplication()
    await testCollisionLayerFiltering()
    await testPhysicsPerfBaseline()
  } catch (e) {
    console.error('\nFATAL ERROR:', e)
    console.error(e.stack)
    process.exit(1)
  }

  const success = Results.summary()
  process.exit(success ? 0 : 1)
}

runAllTests()
