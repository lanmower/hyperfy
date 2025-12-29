import { CacheManager } from './CacheManager.js'
import { QueryCache } from './QueryCache.js'
import { RedisCache } from './RedisCache.js'

async function demoCacheManager() {
  console.log('\n=== CacheManager Demo ===')
  const cache = new CacheManager(100)

  cache.set('user:1', { id: 1, name: 'Alice' })
  cache.set('user:2', { id: 2, name: 'Bob' }, 30000)
  cache.set('user:3', { id: 3, name: 'Charlie' }, 60000)

  console.log('Get user:1:', cache.get('user:1'))
  console.log('Get user:2:', cache.get('user:2'))
  console.log('Cache stats:', cache.getStats())

  cache.invalidate('user:')
  console.log('After invalidate user:*:', cache.get('user:1'))
  console.log('Cache size:', cache.cache.size)
}

async function demoQueryCache() {
  console.log('\n=== QueryCache Demo ===')
  const cacheManager = new CacheManager(500)
  const queryCache = new QueryCache(cacheManager)

  const result1 = { id: 'bp1', name: 'Blueprint 1' }
  queryCache.set('getBlueprintsForUser', { userId: 'user1' }, result1)

  const cached = queryCache.get('getBlueprintsForUser', { userId: 'user1' })
  console.log('Cached result:', cached)

  queryCache.invalidateTable('blueprints')
  const afterInvalidate = queryCache.get('getBlueprintsForUser', { userId: 'user1' })
  console.log('After table invalidate:', afterInvalidate)

  console.log('Query cache stats:', queryCache.getStats())
}

async function demoRedisCache() {
  console.log('\n=== RedisCache Demo ===')
  try {
    const redisCache = await RedisCache.create()

    await redisCache.set('key1', { value: 'data1' }, 30000)
    const result = await redisCache.get('key1')
    console.log('Redis get result:', result)

    const stats = redisCache.getStats()
    console.log('Redis cache mode:', stats.mode)
    console.log('Connected:', stats.connected)

    if (stats.connected) {
      console.log('Using Redis cache')
    } else {
      console.log('Using fallback in-memory cache')
    }

    const fallbackStats = stats.fallbackStats
    console.log('Fallback cache stats:', fallbackStats)

    await redisCache.close()
  } catch (e) {
    console.log('Redis not available, using fallback:', e.message)
  }
}

async function demoMemoryMonitoring() {
  console.log('\n=== Memory Monitoring Demo ===')
  const cache = new CacheManager(1000)

  for (let i = 0; i < 500; i++) {
    cache.set(`key:${i}`, {
      data: 'x'.repeat(1000),
      id: i,
      timestamp: Date.now(),
    })
  }

  const stats = cache.getStats()
  console.log('Memory usage:', stats.memoryUsage)
  console.log('Cache size:', stats.size)
  console.log('Hit rate:', stats.hitRate)
}

async function demoLRUEviction() {
  console.log('\n=== LRU Eviction Demo ===')
  const cache = new CacheManager(5)

  for (let i = 1; i <= 7; i++) {
    cache.set(`item:${i}`, { id: i })
    console.log(`Added item:${i}, cache size: ${cache.cache.size}`)
  }

  console.log('Accessing item:3 (moves to front)...')
  cache.get('item:3')

  console.log('Cache contents:', Array.from(cache.cache.keys()))
  console.log('Evictions:', cache.stats.evictions)
}

async function demoTTLExpiry() {
  console.log('\n=== TTL Expiry Demo ===')
  const cache = new CacheManager(100, 100)

  cache.set('temp:1', { value: 'expires in 100ms' }, 100)
  cache.set('persistent:1', { value: 'never expires' }, null)

  console.log('Before expiry:')
  console.log('temp:1:', cache.get('temp:1'))
  console.log('persistent:1:', cache.get('persistent:1'))

  console.log('Waiting 150ms...')
  await new Promise(r => setTimeout(r, 150))

  console.log('After expiry:')
  console.log('temp:1:', cache.get('temp:1'))
  console.log('persistent:1:', cache.get('persistent:1'))
}

async function main() {
  console.log('Database Optimization Demo')
  console.log('==========================\n')

  await demoCacheManager()
  await demoQueryCache()
  await demoLRUEviction()
  await demoTTLExpiry()
  await demoMemoryMonitoring()
  await demoRedisCache()

  console.log('\n=== All demos complete ===')
}

main().catch(console.error)
