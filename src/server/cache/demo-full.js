import { getDB } from '../db.js'

async function demo() {
  console.log('=== DATABASE OPTIMIZATION & CACHING DEMONSTRATION ===\n')

  const db = await getDB('./demo-world')

  console.log('1. CACHE LAYER (LRU with TTL)')
  console.log('   - Max 2000 items')
  console.log('   - Auto-expire based on query type')
  console.log('   - Memory tracking\n')

  console.log('2. CREATING TEST DATA')
  for (let i = 1; i <= 5; i++) {
    await db.insert('users', {
      id: `user-${i}`,
      name: `User ${i}`,
      avatar: null,
      rank: i,
    })
  }

  for (let i = 1; i <= 10; i++) {
    await db.insert('blueprints', {
      id: `bp-${i}`,
      data: JSON.stringify({ name: `Blueprint ${i}`, type: 'app' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  for (let i = 1; i <= 15; i++) {
    await db.insert('entities', {
      id: `entity-${i}`,
      data: JSON.stringify({ name: `Entity ${i}` }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  await db.insert('files', {
    hash: 'abc123',
    filename: 'test.glb',
    storedFilename: 'abc123.glb',
    size: 1024000,
    mimeType: 'model/gltf-binary',
    uploader: 'user-1',
    timestamp: Date.now(),
    stored: 1,
    url: '/assets/abc123.glb',
  })

  console.log('   Created 5 users, 10 blueprints, 15 entities, 1 file\n')

  console.log('3. QUERY CACHE PERFORMANCE TEST')
  console.log('   Running 100 cached queries...')

  const start = Date.now()
  for (let i = 0; i < 100; i++) {
    await db('users').where('id', 'user-1').cacheAs('getUserById').first()
    await db('blueprints').cacheAs('getBlueprints')
    await db('entities').cacheAs('getEntities')
    await db('config').where('key', 'settings').cacheAs('getConfigValue').first()
    await db('files').where('hash', 'abc123').cacheAs('getAssetMetadata').first()
  }
  const duration = Date.now() - start

  console.log(`   Executed 500 queries in ${duration}ms`)
  console.log(`   Average: ${(duration / 500).toFixed(3)}ms per query\n`)

  const stats = db.stats()
  console.log('4. CACHE STATISTICS')
  console.log(`   Hit Rate: ${stats.hitRate}`)
  console.log(`   Hits: ${stats.hits}`)
  console.log(`   Misses: ${stats.misses}`)
  console.log(`   Evictions: ${stats.evictions}`)
  console.log(`   Cache Size: ${stats.size}/${stats.maxSize}`)
  console.log(`   Memory Usage: ${stats.memoryUsage}\n`)

  const metrics = db.metrics()
  console.log('5. DATABASE METRICS')
  console.log(`   Total Queries (last min): ${metrics.lastMin.totalQueries}`)
  console.log(`   Average Duration: ${metrics.lastMin.avgDuration}ms`)
  console.log(`   Slow Queries (>1s): ${metrics.lastMin.slowQueries}`)
  console.log(`   By Type:`)
  for (const [type, count] of Object.entries(metrics.lastMin.byType)) {
    console.log(`     ${type}: ${count}`)
  }
  console.log(`   By Table:`)
  for (const [table, count] of Object.entries(metrics.lastMin.byTable)) {
    console.log(`     ${table}: ${count}`)
  }

  console.log('\n6. DATABASE INDEXES')
  const indexes = await db.query(`
    SELECT name, tbl_name
    FROM sqlite_master
    WHERE type='index'
    AND tbl_name IN ('users', 'blueprints', 'entities', 'config', 'files')
    ORDER BY tbl_name, name
  `)

  const indexesByTable = {}
  for (const idx of indexes) {
    if (!indexesByTable[idx.tbl_name]) {
      indexesByTable[idx.tbl_name] = []
    }
    indexesByTable[idx.tbl_name].push(idx.name.replace(/^(sqlite_autoindex|idx)_/, ''))
  }

  console.log(`   Total Indexes: ${indexes.length}`)
  for (const [table, idxs] of Object.entries(indexesByTable)) {
    console.log(`   ${table}: ${idxs.length} indexes`)
    idxs.forEach(idx => console.log(`     - ${idx}`))
  }

  console.log('\n7. CACHE INVALIDATION TEST')
  console.log('   Updating user-1...')
  await db('users').where('id', 'user-1').update({ name: 'User 1 Updated' })

  const updated = await db('users').where('id', 'user-1').cacheAs('getUserById').first()
  console.log(`   User name: ${updated.name}`)
  console.log(`   Cache invalidation: ${updated.name === 'User 1 Updated' ? 'PASS' : 'FAIL'}\n`)

  console.log('8. QUERY TTL CONFIGURATION')
  console.log('   getUserById: 10 minutes')
  console.log('   getBlueprints: 5 minutes')
  console.log('   getEntities: 1 minute')
  console.log('   getAssetMetadata: 60 minutes')
  console.log('   getConfigValue: 5 minutes\n')

  console.log('9. CONNECTION POOL SETTINGS')
  console.log(`   Pool Size: 20 (production) / 5 (dev)`)
  console.log(`   Query Timeout: 30 seconds`)
  console.log(`   Idle Timeout: 5 minutes`)
  console.log(`   Slow Query Threshold: 1 second`)
  console.log(`   Current Environment: ${process.env.NODE_ENV || 'development'}\n`)

  const hitRate = parseFloat(stats.hitRate)
  const avgDuration = metrics.lastMin.avgDuration

  console.log('10. PERFORMANCE SUMMARY')
  console.log(`   Cache Hit Rate: ${stats.hitRate}`)
  console.log(`   Cache Efficiency: ${hitRate > 90 ? 'EXCELLENT' : hitRate > 70 ? 'GOOD' : hitRate > 50 ? 'FAIR' : 'POOR'}`)
  console.log(`   Avg Query Time: ${avgDuration}ms`)
  console.log(`   Query Performance: ${avgDuration < 5 ? 'EXCELLENT' : avgDuration < 20 ? 'GOOD' : avgDuration < 50 ? 'FAIR' : 'POOR'}`)
  console.log(`   Memory Usage: ${stats.memoryUsage}`)
  console.log(`   Status: ${hitRate > 80 && avgDuration < 20 ? 'OPTIMAL' : 'NEEDS TUNING'}\n`)

  if (metrics.slowestQueries.length > 0) {
    console.log('11. SLOWEST QUERIES')
    metrics.slowestQueries.slice(0, 5).forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.name} (${q.duration}ms) - ${q.type} on ${q.tables.join(', ')}`)
    })
    console.log('')
  }

  console.log('12. OPTIMIZATION FEATURES')
  console.log('   ✓ LRU Cache with automatic eviction')
  console.log('   ✓ Per-query TTL configuration')
  console.log('   ✓ Automatic cache invalidation on writes')
  console.log('   ✓ Memory usage tracking and warnings')
  console.log('   ✓ Database indexes on all primary/foreign keys')
  console.log('   ✓ Query performance metrics and slow query logging')
  console.log('   ✓ Connection pool optimization')
  console.log('   ✓ Redis cache support (fallback to in-memory)')
  console.log('   ✓ Cache warmup API')
  console.log('   ✓ RESTful cache management endpoints\n')

  console.log('Cleaning up...')
  for (let i = 1; i <= 5; i++) {
    await db('users').where('id', `user-${i}`).delete()
  }
  for (let i = 1; i <= 10; i++) {
    await db('blueprints').where('id', `bp-${i}`).delete()
  }
  for (let i = 1; i <= 15; i++) {
    await db('entities').where('id', `entity-${i}`).delete()
  }
  await db('files').where('hash', 'abc123').delete()

  console.log('\n=== DEMONSTRATION COMPLETE ===')
  process.exit(0)
}

demo().catch(e => {
  console.error('Demo failed:', e)
  process.exit(1)
})
