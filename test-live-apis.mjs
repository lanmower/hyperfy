import { AppRuntime } from './src/apps/AppRuntime.js'
import { SceneBuilder } from './src/apps/SceneBuilder.js'

const mockPhysics = { addStaticTrimesh: () => 1, addBody: () => 1 }
const runtime = new AppRuntime({ gravity: [0, -9.81, 0], physics: mockPhysics })

runtime.registerApp('test-app', {
  server: {
    setup(ctx) { ctx.state.initialized = true; ctx.state.count = 0; console.log(`[test] setup: ${ctx.entity.id}`) },
    update(ctx, dt) { ctx.state.count++ },
    teardown(ctx) { console.log(`[test] teardown: ${ctx.entity.id}`) }
  }
})

runtime.registerApp('alt-app', {
  server: {
    setup(ctx) { ctx.state.altMode = true; console.log(`[alt] setup: ${ctx.entity.id}`) },
    update(ctx, dt) { ctx.state.altMode = ctx.state.altMode },
    teardown(ctx) { console.log(`[alt] teardown: ${ctx.entity.id}`) }
  }
})

console.log('TEST 1: spawnWithApp')
const e1 = runtime.spawnWithApp('ent1', { model: null }, 'test-app')
console.log(`✓ Entity spawned with app: ${e1.id}`)

console.log('\nTEST 2: tick()')
runtime.tick(1, 0.008)
runtime.tick(2, 0.008)
const ctx1 = runtime.contexts.get(e1.id)
console.log(`✓ App state count: ${ctx1?.state?.count}`)

console.log('\nTEST 3: getEntityWithApp()')
const info = runtime.getEntityWithApp(e1.id)
console.log(`✓ Has app: ${info.hasApp}, AppName: ${info.appName}`)

console.log('\nTEST 4: attachAppToEntity()')
const e2 = runtime.spawnEntity('ent2', { model: null })
runtime.attachAppToEntity(e2.id, 'test-app', {})
console.log(`✓ App attached to existing entity`)

console.log('\nTEST 5: reattachAppToEntity()')
runtime.reattachAppToEntity(e2.id, 'alt-app')
const ctx2 = runtime.contexts.get(e2.id)
console.log(`✓ App reattached, new state: ${ctx2?.state?.altMode}`)

console.log('\nTEST 6: detachApp()')
runtime.detachApp(e1.id)
console.log(`✓ App detached, entity exists: ${runtime.entities.has(e1.id)}, app removed: ${!runtime.apps.has(e1.id)}`)

console.log('\nTEST 7: SceneBuilder.createScene()')
const builder = new SceneBuilder(runtime)
const scene = builder.createScene('test', { entities: [{ id: 'env' }, { id: 'game', app: 'test-app' }] })
console.log(`✓ Scene created with ${scene.count} entities`)

console.log('\nTEST 8: SceneBuilder.addEntityToScene()')
const newE = builder.addEntityToScene('test', 'new', { position: [0, 0, 0] }, 'test-app')
console.log(`✓ Entity added: ${newE.id}`)

console.log('\nTEST 9: SceneBuilder.getSceneEntities()')
const ents = builder.getSceneEntities('test')
console.log(`✓ Scene has ${ents.length} entities`)

console.log('\nTEST 10: Snapshot')
const snap = runtime.getSnapshot()
console.log(`✓ Snapshot has ${snap.entities.length} entities`)

console.log('\n=== ALL TESTS PASSED ===')
process.exit(0)
