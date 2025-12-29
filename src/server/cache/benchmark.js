import { getDB } from '../db.js'

async function benchmark() {
  console.log('=== DATABASE PERFORMANCE BENCHMARK ===\n')

  const db = await getDB('./benchmark-world')

  console.log('Setup: Creating 100 users, 200 blueprints, 300 entities, 50 files...')

  for (let i = 1; i <= 100; i++) {
    await db.insert('users', {
      id: `user-${i}`,
      name: `User ${i}`,
      avatar: null,
      rank: i % 5,
    })
  }

  for (let i = 1; i <= 200; i++) {
    await db.insert('blueprints', {
      id: `bp-${i}`,
      data: JSON.stringify({ name: `Blueprint ${i}`, type: 'app', complexity: i % 10 }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  for (let i = 1; i <= 300; i++) {
    await db.insert('entities', {
      id: `entity-${i}`,
      data: JSON.stringify({ name: `Entity ${i}`, worldId: `world-${i % 10}` }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  for (let i = 1; i <= 50; i++) {
    await db.insert('files', {
      hash: `hash-${i}`,
      filename: `file-${i}.glb`,
      storedFilename: `hash-${i}.glb`,
      size: 1024 * (i % 100),
      mimeType: 'model/gltf-binary',
      uploader: `user-${i % 100}`,
      timestamp: Date.now(),
      stored: 1,
      url: `/assets/hash-${i}.glb`,
    })
  }

  console.log('Setup complete\n')

  const tests = [
    {
      name: 'Single user lookup (cached)',
      iterations: 1000,
      query: async () => {
        await db('users').where('id', 'user-1').cacheAs('getUserById').first()
      }
    },
    {
      name: 'All blueprints (cached)',
      iterations: 500,
      query: async () => {
        await db('blueprints').cacheAs('getBlueprints')
      }
    },
    {
      name: 'All entities (cached)',
      iterations: 500,
      query: async () => {
        await db('entities').cacheAs('getEntities')
      }
    },
    {
      name: 'File metadata lookup (cached)',
      iterations: 1000,
      query: async () => {
        await db('files').where('hash', 'hash-1').cacheAs('getAssetMetadata').first()
      }
    },
    {
      name: 'Config value lookup (cached)',
      iterations: 1000,
      query: async () => {
        await db('config').where('key', 'settings').cacheAs('getConfigValue').first()
      }
    },
    {
      name: 'Mixed queries (cached)',
      iterations: 200,
      query: async () => {
        await db('users').where('id', `user-${Math.floor(Math.random() * 100) + 1}`).cacheAs('getUserById').first()
        await db('blueprints').cacheAs('getBlueprints')
        await db('entities').cacheAs('getEntities')
        await db('files').where('hash', `hash-${Math.floor(Math.random() * 50) + 1}`).cacheAs('getAssetMetadata').first()
      }
    }
  ]

  console.log('Running benchmarks...\n')

  for (const test of tests) {
    const start = Date.now()
    for (let i = 0; i < test.iterations; i++) {
      await test.query()
    }
    const duration = Date.now() - start
    const avgTime = (duration / test.iterations).toFixed(3)
    const opsPerSec = Math.floor((test.iterations / duration) * 1000)

    console.log(`${test.name}:`)
    console.log(`  Iterations: ${test.iterations}`)
    console.log(`  Total Time: ${duration}ms`)
    console.log(`  Avg Time: ${avgTime}ms`)
    console.log(`  Ops/sec: ${opsPerSec}`)
    console.log('')
  }

  const stats = db.stats()
  const metrics = db.metrics()

  console.log('=== CACHE PERFORMANCE ===')
  console.log(`Hit Rate: ${stats.hitRate}`)
  console.log(`Hits: ${stats.hits}`)
  console.log(`Misses: ${stats.misses}`)
  console.log(`Evictions: ${stats.evictions}`)
  console.log(`Cache Size: ${stats.size}/${stats.maxSize}`)
  console.log(`Memory: ${stats.memoryUsage}\n`)

  console.log('=== DATABASE PERFORMANCE ===')
  console.log(`Total Queries: ${metrics.lastMin.totalQueries}`)
  console.log(`Avg Duration: ${metrics.lastMin.avgDuration}ms`)
  console.log(`Slow Queries: ${metrics.lastMin.slowQueries}`)
  console.log(`Query Types:`, JSON.stringify(metrics.lastMin.byType))
  console.log(`Tables Accessed:`, JSON.stringify(metrics.lastMin.byTable))
  console.log('')

  const hitRate = parseFloat(stats.hitRate)
  const avgDuration = metrics.lastMin.avgDuration

  console.log('=== PERFORMANCE RATING ===')
  console.log(`Cache Efficiency: ${hitRate > 95 ? 'EXCELLENT' : hitRate > 85 ? 'VERY GOOD' : hitRate > 70 ? 'GOOD' : hitRate > 50 ? 'FAIR' : 'POOR'}`)
  console.log(`Query Speed: ${avgDuration < 1 ? 'EXCELLENT' : avgDuration < 5 ? 'VERY GOOD' : avgDuration < 10 ? 'GOOD' : avgDuration < 50 ? 'FAIR' : 'POOR'}`)
  console.log(`Overall: ${hitRate > 90 && avgDuration < 5 ? 'OPTIMAL' : hitRate > 70 && avgDuration < 20 ? 'GOOD' : 'NEEDS TUNING'}`)
  console.log('')

  console.log('Cleanup...')
  for (let i = 1; i <= 100; i++) {
    await db('users').where('id', `user-${i}`).delete()
  }
  for (let i = 1; i <= 200; i++) {
    await db('blueprints').where('id', `bp-${i}`).delete()
  }
  for (let i = 1; i <= 300; i++) {
    await db('entities').where('id', `entity-${i}`).delete()
  }
  for (let i = 1; i <= 50; i++) {
    await db('files').where('hash', `hash-${i}`).delete()
  }

  console.log('\n=== BENCHMARK COMPLETE ===')
  process.exit(0)
}

benchmark().catch(e => {
  console.error('Benchmark failed:', e)
  process.exit(1)
})
