import { getDB } from '../db.js'

async function testOptimizations() {
  console.log('[Test] Starting database optimization tests...\n')

  const db = await getDB('./test-world')

  console.log('[Test] Creating test data...')
  await db.insert('users', {
    id: 'test-user-1',
    name: 'Test User',
    avatar: null,
    rank: 1,
  })

  await db.insert('blueprints', {
    id: 'test-blueprint-1',
    data: JSON.stringify({ name: 'Test Blueprint' }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  console.log('[Test] Running queries...\n')

  const queries = 10
  const startTime = Date.now()

  for (let i = 0; i < queries; i++) {
    await db('users').where('id', 'test-user-1').cacheAs('getUserById').first()
    await db('blueprints').cacheAs('getBlueprints')
  }

  const duration = Date.now() - startTime
  console.log(`[Test] Executed ${queries * 2} queries in ${duration}ms`)
  console.log(`[Test] Average: ${(duration / (queries * 2)).toFixed(2)}ms per query\n`)

  console.log('[Test] Cache Stats:')
  const cacheStats = db.stats()
  console.log(`  Hit Rate: ${cacheStats.hitRate}`)
  console.log(`  Hits: ${cacheStats.hits}`)
  console.log(`  Misses: ${cacheStats.misses}`)
  console.log(`  Cache Size: ${cacheStats.size}/${cacheStats.maxSize}`)
  console.log(`  Memory Usage: ${cacheStats.memoryUsage}\n`)

  console.log('[Test] Database Metrics:')
  const dbMetrics = db.metrics()
  console.log(`  Last Minute Queries: ${dbMetrics.lastMin.totalQueries}`)
  console.log(`  Average Duration: ${dbMetrics.lastMin.avgDuration}ms`)
  console.log(`  Slow Queries: ${dbMetrics.lastMin.slowQueries}`)
  console.log(`  By Type:`, dbMetrics.lastMin.byType)
  console.log(`  By Table:`, dbMetrics.lastMin.byTable)

  if (dbMetrics.slowestQueries.length > 0) {
    console.log('\n[Test] Slowest Queries:')
    dbMetrics.slowestQueries.slice(0, 5).forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.name} (${q.duration}ms) - ${q.type} on ${q.tables.join(', ')}`)
    })
  }

  console.log('\n[Test] Cleanup...')
  await db('users').where('id', 'test-user-1').delete()
  await db('blueprints').where('id', 'test-blueprint-1').delete()

  console.log('[Test] Tests complete!')
}

testOptimizations().catch(console.error)
