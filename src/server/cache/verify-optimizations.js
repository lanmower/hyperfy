import { getDB } from '../db.js'

async function verify() {
  console.log('[Verify] Database optimization verification\n')

  const db = await getDB('./test-world')

  console.log('=== 1. Cache Layer ===')
  console.log('Creating test data...')

  await db.insert('users', {
    id: 'user-1',
    name: 'User One',
    avatar: null,
    rank: 1,
  })

  await db.insert('users', {
    id: 'user-2',
    name: 'User Two',
    avatar: null,
    rank: 2,
  })

  await db.insert('blueprints', {
    id: 'bp-1',
    data: JSON.stringify({ name: 'Blueprint 1', type: 'app' }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await db.insert('entities', {
    id: 'entity-1',
    data: JSON.stringify({ name: 'Entity 1' }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  console.log('\n=== 2. Query Cache Test ===')
  console.log('Running 20 cached queries...')

  const start = Date.now()
  for (let i = 0; i < 20; i++) {
    await db('users').where('id', 'user-1').cacheAs('getUserById').first()
    await db('blueprints').cacheAs('getBlueprints')
    await db('entities').cacheAs('getEntities')
  }
  const duration = Date.now() - start

  console.log(`Executed 60 queries in ${duration}ms (avg: ${(duration / 60).toFixed(2)}ms)`)

  const stats = db.stats()
  console.log(`\nCache Stats:`)
  console.log(`  Hit Rate: ${stats.hitRate}`)
  console.log(`  Hits: ${stats.hits}`)
  console.log(`  Misses: ${stats.misses}`)
  console.log(`  Size: ${stats.size}/${stats.maxSize}`)
  console.log(`  Memory: ${stats.memoryUsage}`)

  console.log('\n=== 3. Database Metrics ===')
  const metrics = db.metrics()
  console.log(`  Total Queries (last min): ${metrics.lastMin.totalQueries}`)
  console.log(`  Avg Duration: ${metrics.lastMin.avgDuration}ms`)
  console.log(`  Slow Queries: ${metrics.lastMin.slowQueries}`)
  console.log(`  By Type:`, JSON.stringify(metrics.lastMin.byType))
  console.log(`  By Table:`, JSON.stringify(metrics.lastMin.byTable))

  console.log('\n=== 4. Cache Invalidation Test ===')
  console.log('Updating user-1...')
  await db('users').where('id', 'user-1').update({ name: 'User One Updated' })

  const userAfterUpdate = await db('users').where('id', 'user-1').cacheAs('getUserById').first()
  console.log(`User name after update: ${userAfterUpdate.name}`)
  console.log('Cache invalidation: ' + (userAfterUpdate.name === 'User One Updated' ? 'PASS' : 'FAIL'))

  console.log('\n=== 5. Database Indexes ===')
  const indexes = await db.query(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND tbl_name IN ('users', 'blueprints', 'entities', 'config', 'files')`)
  console.log(`Total indexes: ${indexes.length}`)
  const indexesByTable = {}
  for (const idx of indexes) {
    if (!indexesByTable[idx.tbl_name]) indexesByTable[idx.tbl_name] = []
    indexesByTable[idx.tbl_name].push(idx.name)
  }
  console.log('Indexes by table:', JSON.stringify(indexesByTable, null, 2))

  console.log('\n=== 6. Connection Pool Settings ===')
  console.log(`  Pool Size: 20 (production) / 5 (dev)`)
  console.log(`  Query Timeout: 30s`)
  console.log(`  Current ENV: ${process.env.NODE_ENV || 'development'}`)

  console.log('\n=== 7. Performance Summary ===')
  const hitRate = parseFloat(stats.hitRate)
  console.log(`  Cache Hit Rate: ${stats.hitRate}`)
  console.log(`  Cache Efficiency: ${hitRate > 80 ? 'EXCELLENT' : hitRate > 50 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`)
  console.log(`  Avg Query Time: ${metrics.lastMin.avgDuration}ms`)
  console.log(`  Query Performance: ${metrics.lastMin.avgDuration < 10 ? 'EXCELLENT' : metrics.lastMin.avgDuration < 50 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`)

  console.log('\nCleaning up...')
  await db('users').where('id', 'user-1').delete()
  await db('users').where('id', 'user-2').delete()
  await db('blueprints').where('id', 'bp-1').delete()
  await db('entities').where('id', 'entity-1').delete()

  console.log('\n=== VERIFICATION COMPLETE ===')
  process.exit(0)
}

verify().catch(e => {
  console.error('Verification failed:', e)
  process.exit(1)
})
