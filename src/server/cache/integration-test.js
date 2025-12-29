import { getDB } from '../db.js'
import { WorldPersistence } from '../services/WorldPersistence.js'
import { FileStorage } from '../services/FileStorage.js'

async function test() {
  console.log('=== INTEGRATION TEST ===\n')

  const db = await getDB('./integration-test-world')
  const persistence = new WorldPersistence(db)
  const fileStorage = new FileStorage('./integration-test-assets', db)

  console.log('1. Testing WorldPersistence with caching\n')

  console.log('   - saveSettings()')
  await persistence.saveSettings({
    title: 'Test World',
    desc: 'Integration test',
    voice: 'spatial',
    playerLimit: 10
  })

  console.log('   - loadSettings() [first call - cache miss]')
  const settings1 = await persistence.loadSettings()
  console.log('     Settings:', settings1)

  console.log('   - loadSettings() [second call - cache hit]')
  const settings2 = await persistence.loadSettings()
  console.log('     Settings:', settings2)

  console.log('   - saveBlueprint()')
  await persistence.saveBlueprint('bp-1', { name: 'Test Blueprint', type: 'app' })

  console.log('   - loadBlueprints() [cache miss]')
  const blueprints1 = await persistence.loadBlueprints()
  console.log(`     Found ${blueprints1.length} blueprints`)

  console.log('   - loadBlueprints() [cache hit]')
  const blueprints2 = await persistence.loadBlueprints()
  console.log(`     Found ${blueprints2.length} blueprints`)

  console.log('\n2. Testing FileStorage with caching\n')

  const buffer = Buffer.from('test file content')

  console.log('   - store()')
  const record = await fileStorage.store('test-hash', 'test.txt', buffer, {
    mimeType: 'text/plain',
    uploader: 'user-1'
  })
  console.log('     File stored:', record.url)

  console.log('   - getRecord() [cache miss]')
  const record1 = await fileStorage.getRecord('test-hash')
  console.log('     Record:', record1 ? record1.filename : 'null')

  console.log('   - getRecord() [cache hit]')
  const record2 = await fileStorage.getRecord('test-hash')
  console.log('     Record:', record2 ? record2.filename : 'null')

  console.log('\n3. Cache Statistics\n')

  const stats = db.stats()
  console.log(`   Hit Rate: ${stats.hitRate}`)
  console.log(`   Hits: ${stats.hits}`)
  console.log(`   Misses: ${stats.misses}`)
  console.log(`   Cache Size: ${stats.size}/${stats.maxSize}`)
  console.log(`   Memory: ${stats.memoryUsage}`)

  console.log('\n4. Database Metrics\n')

  const metrics = db.metrics()
  console.log(`   Total Queries: ${metrics.lastMin.totalQueries}`)
  console.log(`   Avg Duration: ${metrics.lastMin.avgDuration}ms`)
  console.log(`   Slow Queries: ${metrics.lastMin.slowQueries}`)

  console.log('\n5. Cache Invalidation Test\n')

  console.log('   - Updating blueprint...')
  await persistence.saveBlueprint('bp-1', { name: 'Updated Blueprint', type: 'app' })

  console.log('   - Loading blueprints (should get fresh data)...')
  const blueprints3 = await persistence.loadBlueprints()
  const bp = JSON.parse(blueprints3.find(b => b.id === 'bp-1').data)
  console.log(`     Blueprint name: ${bp.name}`)
  console.log(`     Cache invalidation: ${bp.name === 'Updated Blueprint' ? 'PASS' : 'FAIL'}`)

  console.log('\n6. Query Performance\n')

  console.log('   Running 100 cached queries...')
  const start = Date.now()

  for (let i = 0; i < 100; i++) {
    await persistence.loadSettings()
    await persistence.loadBlueprints()
    await fileStorage.getRecord('test-hash')
  }

  const duration = Date.now() - start
  console.log(`   Completed in ${duration}ms (${(duration / 300).toFixed(3)}ms per query)`)

  const finalStats = db.stats()
  console.log(`   Final hit rate: ${finalStats.hitRate}`)

  console.log('\n7. Verification\n')

  const hitRate = parseFloat(finalStats.hitRate)
  const avgDuration = metrics.lastMin.avgDuration

  console.log(`   Cache working: ${hitRate > 80 ? 'YES' : 'NO'}`)
  console.log(`   Performance good: ${avgDuration < 10 ? 'YES' : 'NO'}`)
  console.log(`   Invalidation works: ${bp.name === 'Updated Blueprint' ? 'YES' : 'NO'}`)
  console.log(`   Overall status: ${hitRate > 80 && avgDuration < 10 ? 'PASS' : 'FAIL'}`)

  console.log('\n=== INTEGRATION TEST COMPLETE ===')
  process.exit(0)
}

test().catch(e => {
  console.error('Integration test failed:', e)
  process.exit(1)
})
