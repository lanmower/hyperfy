import { Octree } from './src/physics/Octree.js'
import { PhysicsWorld } from './src/physics/World.js'

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

  assertClose(actual, expected, tolerance, name, msg = '') {
    const pass = Math.abs(actual - expected) <= tolerance
    this.assert(pass, name, `${actual.toFixed(1)} ≈ ${expected.toFixed(1)} (±${tolerance})`)
    return pass
  },

  summary() {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`)
    console.log(`${'='.repeat(50)}\n`)
    return this.failed === 0
  }
}

async function testOctreeBasics() {
  console.log('\n=== TEST: Octree Basics ===')
  const octree = new Octree([-10, -10, -10, 10, 10, 10])

  octree.insert('body1', 0, 0, 0)
  octree.insert('body2', 5, 5, 5)
  octree.insert('body3', -5, -5, -5)

  Results.assert(octree.items.size === 3, 'Three items inserted')
  Results.assert(octree.getStats().itemsInMap === 3, 'Stats show 3 items')
}

async function testOctreeQuery() {
  console.log('\n=== TEST: Octree Query ===')
  const octree = new Octree([-100, -100, -100, 100, 100, 100])

  octree.insert('body1', 0, 0, 0)
  octree.insert('body2', 5, 0, 0)
  octree.insert('body3', 50, 50, 50)

  const near = octree.queryRadius([0, 0, 0], 10)
  Results.assert(near.length === 2, `Query at [0,0,0] radius 10: ${near.length} items`)

  const far = octree.queryRadius([0, 0, 0], 5)
  Results.assert(far.length === 1, `Query at [0,0,0] radius 5: ${far.length} items`)
}

async function testOctreeRemove() {
  console.log('\n=== TEST: Octree Remove ===')
  const octree = new Octree([-100, -100, -100, 100, 100, 100])

  octree.insert('body1', 0, 0, 0)
  octree.insert('body2', 5, 0, 0)

  Results.assert(octree.items.size === 2, 'Two items')

  octree.remove('body1')
  Results.assert(octree.items.size === 1, 'One item after remove')

  const query = octree.queryRadius([0, 0, 0], 10)
  Results.assert(query.length === 1, 'Query returns remaining item only')
}

async function testOctreeUpdate() {
  console.log('\n=== TEST: Octree Update ===')
  const octree = new Octree([-100, -100, -100, 100, 100, 100])

  octree.insert('body1', 0, 0, 0)
  let near = octree.queryRadius([0, 0, 0], 10)
  Results.assert(near.length === 1, 'Item near origin')

  octree.update('body1', 50, 50, 50)
  near = octree.queryRadius([0, 0, 0], 10)
  Results.assert(near.length === 0, 'Item no longer near origin after update')

  const far = octree.queryRadius([50, 50, 50], 10)
  Results.assert(far.length === 1, 'Item now near new position')
}

async function testOctreePerformance() {
  console.log('\n=== TEST: Octree Performance (100 items) ===')
  const octree = new Octree([-500, -500, -500, 500, 500, 500], 8, 4)

  const insertStart = performance.now()
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 400
    const y = (Math.random() - 0.5) * 400
    const z = (Math.random() - 0.5) * 400
    octree.insert(`body${i}`, x, y, z)
  }
  const insertElapsed = performance.now() - insertStart

  Results.assert(insertElapsed < 100, `100 inserts: ${insertElapsed.toFixed(1)}ms`)

  const queryStart = performance.now()
  for (let i = 0; i < 100; i++) {
    octree.queryRadius([0, 0, 0], 100)
  }
  const queryElapsed = performance.now() - queryStart

  Results.assert(queryElapsed < 50, `100 queries: ${queryElapsed.toFixed(1)}ms`)

  const stats = octree.getStats()
  console.log(`  Octree structure: ${stats.totalNodes} nodes, ${stats.totalItems} items`)
}

async function testPhysicsWorldOctree() {
  console.log('\n=== TEST: Physics World Octree Integration ===')
  const world = new PhysicsWorld({
    gravity: [0, -9.81, 0],
    enableOctree: true
  })
  await world.init()

  const capsuleIds = []
  for (let i = 0; i < 20; i++) {
    const id = world.addDynamicCapsule(0.4, 0.9, [i * 2 - 20, 0, 0], 80)
    capsuleIds.push(id)
  }

  Results.assert(world.bodies.size === 20, '20 capsules created')
  const stats = world.getOctreeStats()
  Results.assert(stats.totalItems === 20, `Octree has ${stats.totalItems} items`)

  const queryStart = performance.now()
  const nearOrigin = world.queryBodiesInRadius([0, 0, 0], 10)
  const queryElapsed = performance.now() - queryStart

  Results.assert(nearOrigin.length > 0, `Query found ${nearOrigin.length} bodies near origin`)
  Results.assert(queryElapsed < 10, `Query completed in ${queryElapsed.toFixed(2)}ms`)

  world.destroy()
}

async function testOctreeScaling() {
  console.log('\n=== TEST: Octree Scaling (1000 items) ===')
  const octree = new Octree([-1000, -1000, -1000, 1000, 1000, 1000], 8, 8)

  const insertStart = performance.now()
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 1800
    const y = (Math.random() - 0.5) * 1800
    const z = (Math.random() - 0.5) * 1800
    octree.insert(`body${i}`, x, y, z)
  }
  const insertElapsed = performance.now() - insertStart

  Results.assert(insertElapsed < 1000, `1000 inserts: ${insertElapsed.toFixed(1)}ms`)

  const queryStart = performance.now()
  const results = octree.queryRadius([0, 0, 0], 200)
  const queryElapsed = performance.now() - queryStart

  const stats = octree.getStats()
  console.log(`  Found ${results.length} items, structure: ${stats.totalNodes} nodes`)
  Results.assert(queryElapsed < 50, `Query on 1000 items: ${queryElapsed.toFixed(1)}ms`)
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗')
  console.log('║         OCTREE SPATIAL OPTIMIZATION TESTS         ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  try {
    await testOctreeBasics()
    await testOctreeQuery()
    await testOctreeRemove()
    await testOctreeUpdate()
    await testOctreePerformance()
    await testPhysicsWorldOctree()
    await testOctreeScaling()
  } catch (e) {
    console.error('\nFATAL ERROR:', e)
    console.error(e.stack)
    process.exit(1)
  }

  const success = Results.summary()
  process.exit(success ? 0 : 1)
}

runAllTests()
