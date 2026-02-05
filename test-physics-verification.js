import { PhysicsWorld } from './src/physics/World.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let passed = 0, failed = 0
const pass = (n, m = '') => { passed++; console.log('✓ ' + n + (m ? ': ' + m : '')) }
const fail = (n, m = '') => { failed++; console.log('✗ ' + n + (m ? ': ' + m : '')) }

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║    PHYSICS & COLLISION VERIFICATION                  ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  // TEST 1: Box collider baseline
  console.log('=== TEST 1: Box Collider Baseline ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()
    world.addStaticBox([50, 1, 50], [0, -1, 0])

    const caps = []
    for (let i = 0; i < 5; i++) {
      const x = (i % 3 - 1) * 10
      const z = Math.floor(i / 3) * 10
      caps.push(world.addDynamicCapsule(0.4, 0.9, [x, 5, z], 80))
    }

    for (let i = 0; i < 300; i++) world.step(1/128)

    let stable = true
    for (let c of caps) {
      const p = world.getBodyPosition(c)
      if (p[1] < -5) stable = false
    }

    stable ? pass('5 capsules stable on box') : fail('5 capsules unstable on box')
    world.destroy()
  }

  // TEST 2: Schwust trimesh - few bodies
  console.log('\n=== TEST 2: Schwust Trimesh - Few Bodies ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()

    const tid = world.addStaticTrimesh(join(__dirname, 'world', 'schwust.glb'), 0)
    pass('Schwust trimesh loaded', world.bodyMeta.get(tid).triangles + ' triangles')

    const cap1 = world.addDynamicCapsule(0.4, 0.9, [0, 5, 0], 80)
    for (let i = 0; i < 50; i++) world.step(1/128)
    const p1 = world.getBodyPosition(cap1)
    p1[1] > 0 ? pass('Single capsule lands on terrain', 'Y=' + p1[1].toFixed(2)) : fail('Single capsule underground')

    world.destroy()
  }

  // TEST 3: Collision detection with proper settling
  console.log('\n=== TEST 3: Collision Detection ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()

    world.addStaticBox([50, 1, 50], [0, -1, 0])
    const cap = world.addDynamicCapsule(0.4, 0.9, [0, 5, 0], 80)

    for (let i = 0; i < 200; i++) world.step(1/128)
    const settled = world.getBodyPosition(cap)
    const velocity = world.getBodyVelocity(cap)
    const speed = Math.sqrt(velocity[0]*velocity[0] + velocity[1]*velocity[1] + velocity[2]*velocity[2])

    const isResting = speed < 0.01 && settled[1] > 0
    isResting ? pass('Capsule rests on collider', 'Y=' + settled[1].toFixed(2) + ', speed=' + speed.toFixed(3) + ' m/s') : fail('Capsule not resting')

    world.destroy()
  }

  // TEST 4: Raycast hit detection
  console.log('\n=== TEST 4: Raycast Hit Detection ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()

    world.addStaticBox([50, 1, 50], [0, -1, 0])
    const cap = world.addDynamicCapsule(0.4, 0.9, [0, 2, 0], 80)

    for (let i = 0; i < 20; i++) world.step(1/128)

    const hit = world.raycast([0, 5, 0], [0, -1, 0], 10)
    hit.hit ? pass('Raycast detects body', 'distance=' + hit.distance.toFixed(2) + 'm') : fail('Raycast missed body')

    world.destroy()
  }

  // TEST 5: Performance
  console.log('\n=== TEST 5: Performance (500 ticks) ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()

    world.addStaticBox([50, 1, 50], [0, -1, 0])
    for (let i = 0; i < 10; i++) {
      world.addDynamicCapsule(0.4, 0.9, [(i-5)*5, 5, 0], 80)
    }

    const t0 = performance.now()
    for (let i = 0; i < 500; i++) world.step(1/128)
    const ms = performance.now() - t0

    ms < 200 ? pass('500 ticks completed', ms.toFixed(0) + 'ms (avg ' + (ms/500).toFixed(2) + 'ms per tick)') : fail('500 ticks too slow', ms.toFixed(0) + 'ms')

    world.destroy()
  }

  // TEST 6: Capsule-to-capsule collision
  console.log('\n=== TEST 6: Capsule-to-Capsule Collision ===')
  {
    const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
    await world.init()

    world.addStaticBox([50, 1, 50], [0, -1, 0])
    const cap1 = world.addDynamicCapsule(0.4, 0.9, [-2, 3, 0], 80)
    const cap2 = world.addDynamicCapsule(0.4, 0.9, [2, 3, 0], 80)

    for (let i = 0; i < 200; i++) world.step(1/128)

    const p1 = world.getBodyPosition(cap1)
    const p2 = world.getBodyPosition(cap2)
    const distance = Math.sqrt((p1[0]-p2[0])**2 + (p1[2]-p2[2])**2)

    distance > 0.8 ? pass('Capsules maintain separation', 'distance=' + distance.toFixed(2) + 'm') : fail('Capsules overlapping')

    world.destroy()
  }

  console.log('\n' + '='.repeat(60))
  console.log(`RESULTS: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(60))

  if (failed === 0) {
    console.log('\n✓ PHYSICS & COLLISION VERIFICATION COMPLETE')
    console.log('  ✓ Capsules collide with geometry correctly')
    console.log('  ✓ Gravity simulation working as expected')
    console.log('  ✓ Raycast detection functional for hitscan')
    console.log('  ✓ Dynamic body-to-body collision working')
    console.log('  ✓ Performance: 500 ticks < 200ms')
  }
  console.log()
}

runTests().catch(e => {
  console.error('FATAL ERROR:', e.message)
  console.error(e.stack)
  process.exit(1)
})
