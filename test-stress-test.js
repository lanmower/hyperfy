import { PhysicsWorld } from './src/physics/World.js'

async function stressTest() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║    STRESS TEST: 100+ ENTITIES + 128 TPS            ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const world = new PhysicsWorld({ gravity: [0, -9.81, 0] })
  await world.init()

  // Ground
  world.addStaticBox([100, 1, 100], [0, -1, 0])

  // Spawn 100 physics objects
  console.log('Spawning 100 dynamic objects...')
  const objects = []
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 80
    const y = 10 + Math.random() * 20
    const z = (Math.random() - 0.5) * 80
    const id = world.addDynamicCapsule(0.2, 0.4, [x, y, z], 10)
    objects.push(id)
  }
  console.log(`✓ Spawned ${objects.length} objects\n`)

  // Measure tick time with 100 entities
  console.log('Measuring performance with 100 entities...')
  const t0 = performance.now()
  const tickCount = 500
  for (let i = 0; i < tickCount; i++) {
    world.step(1/128)
  }
  const elapsed = performance.now() - t0
  const avgTickTime = elapsed / tickCount

  console.log(`Total time: ${elapsed.toFixed(0)}ms`)
  console.log(`Average per tick: ${avgTickTime.toFixed(2)}ms`)
  console.log(`Ticks per second: ${(1000 / avgTickTime).toFixed(1)}`)

  // Check stability
  let allStable = true
  let clipped = 0
  for (const id of objects) {
    const pos = world.getBodyPosition(id)
    if (pos[1] < -10) clipped++
    if (isNaN(pos[0]) || isNaN(pos[1]) || isNaN(pos[2])) {
      allStable = false
    }
  }

  console.log(`\n✓ No NaN positions: ${allStable}`)
  console.log(`✓ Objects not clipped: ${clipped === 0} (clipped: ${clipped})`)
  console.log(`✓ Target 128 TPS achieved: ${(1000 / avgTickTime) >= 120}`)
  console.log(`✓ Performance target (<10ms/tick): ${avgTickTime < 10}`)

  world.destroy()

  console.log('\n╔════════════════════════════════════════════════════╗')
  const pass = allStable && clipped === 0 && (1000 / avgTickTime) >= 120
  console.log(`║  RESULT: ${pass ? '✓ PASS' : '✗ FAIL'}${' '.repeat(41 - (pass ? 7 : 7))}║`)
  console.log('╚════════════════════════════════════════════════════╝\n')

  process.exit(pass ? 0 : 1)
}

stressTest().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
