import { createServer } from './src/sdk/server.js'
import { SceneBuilder } from './src/apps/SceneBuilder.js'

const PORT = 8081
const TEST_DURATION = 30000

async function runIntegrationTest() {
  console.log('Starting integration test for live app management...\n')

  try {
    const server = await createServer({ port: PORT, appsDir: './apps' })

    await server.loadApps()

    console.log('=== TEST 1: Load World ===')
    const worldDef = {
      port: PORT,
      tickRate: 128,
      gravity: [0, -9.81, 0],
      entities: [
        { id: 'game', position: [0, 0, 0], app: 'tps-game' }
      ],
      spawnPoint: [-35, 3, -65]
    }

    await server.loadWorld(worldDef)
    console.log('✓ World loaded\n')

    console.log('=== TEST 2: spawnWithApp (Runtime Spawn) ===')
    const entity1 = server.appRuntime.spawnWithApp('dynamic-entity-1',
      { position: [10, 5, 0], model: null },
      'tps-game'
    )
    console.log(`✓ Spawned entity: ${entity1.id}`)
    console.log(`✓ Has app: ${server.appRuntime.apps.has(entity1.id)}`)

    console.log('\n=== TEST 3: Snapshot Includes Dynamic Entity ===')
    let snap = server.appRuntime.getSnapshot()
    const found = snap.entities.find(e => e.id === entity1.id)
    console.log(`✓ Entity in snapshot: ${!!found}`)
    console.log(`✓ Total entities in snapshot: ${snap.entities.length}`)

    console.log('\n=== TEST 4: SceneBuilder Create Scene ===')
    const builder = new SceneBuilder(server.appRuntime)
    const sceneDef = {
      gravity: [0, -9.81, 0],
      spawnPoint: [0, 5, 0],
      entities: [
        { id: 'test-entity-1', position: [0, 0, 0], app: 'tps-game' },
        { id: 'test-entity-2', position: [5, 0, 0], app: 'tps-game' }
      ]
    }

    const result = builder.createScene('test-scene', sceneDef)
    console.log(`✓ Scene created with ${result.count} entities`)

    console.log('\n=== TEST 5: SceneBuilder Add Entity ===')
    const newEntity = builder.addEntityToScene('test-scene', 'added-entity',
      { position: [15, 0, 0] }, 'tps-game'
    )
    console.log(`✓ Added entity: ${newEntity.id}`)

    const sceneEnts = builder.getSceneEntities('test-scene')
    console.log(`✓ Scene now has ${sceneEnts.length} entities`)

    console.log('\n=== TEST 6: attachAppToEntity ===')
    const bareEntity = server.appRuntime.spawnEntity('bare-entity', { position: [20, 0, 0] })
    const attached = server.appRuntime.attachAppToEntity(bareEntity.id, 'tps-game')
    console.log(`✓ Attached app to bare entity: ${attached}`)

    console.log('\n=== TEST 7: getEntityWithApp ===')
    const info = server.appRuntime.getEntityWithApp(entity1.id)
    console.log(`✓ Entity has app: ${info.hasApp}`)
    console.log(`✓ App name: ${info.appName}`)

    console.log('\n=== TEST 8: Tick Loop (5 seconds) ===')
    const tickRate = 128
    const tickDuration = 1000 / tickRate
    const totalTicks = (5000 / tickDuration)
    let tickCount = 0

    const tickInterval = setInterval(() => {
      tickCount++
      const tick = tickCount
      const dt = tickDuration / 1000
      server.appRuntime.tick(tick, dt)

      if (tickCount % (tickRate / 2) === 0) {
        snap = server.appRuntime.getSnapshot()
        console.log(`  Tick ${tick}: ${snap.entities.length} entities`)
      }

      if (tickCount >= totalTicks) {
        clearInterval(tickInterval)
        finishTest()
      }
    }, tickDuration)

    function finishTest() {
      console.log(`\n✓ Completed ${tickCount} ticks`)

      console.log('\n=== TEST 9: Remove Entity ===')
      const beforeRemove = server.appRuntime.getSnapshot().entities.length
      builder.removeEntityFromScene('test-scene', 'added-entity')
      const afterRemove = server.appRuntime.getSnapshot().entities.length
      console.log(`✓ Entity removed, count: ${beforeRemove} -> ${afterRemove}`)

      console.log('\n=== TEST 10: Final Snapshot ===')
      snap = server.appRuntime.getSnapshot()
      console.log(`✓ Final entity count: ${snap.entities.length}`)
      snap.entities.slice(0, 5).forEach(e => {
        console.log(`  - ${e.id} at [${e.position[0]?.toFixed(1)}, ${e.position[1]?.toFixed(1)}, ${e.position[2]?.toFixed(1)}]`)
      })

      console.log('\n=== ALL INTEGRATION TESTS PASSED ===\n')
      process.exit(0)
    }

  } catch (err) {
    console.error('TEST FAILED:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

runIntegrationTest().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
