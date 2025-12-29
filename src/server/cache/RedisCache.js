import { CacheManager } from './CacheManager.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('RedisCache')

let redis = null

async function initRedis() {
  try {
    const module = await import('redis')
    return module.createClient()
  } catch (e) {
    return null
  }
}

export class RedisCache {
  constructor(redisClient = null) {
    this.client = redisClient
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    }
    this.fallback = new CacheManager(1000)
    this.isConnected = false

    if (this.client) {
      this.client.on('error', () => {
        this.isConnected = false
      })
      this.client.on('connect', () => {
        this.isConnected = true
      })
    }
  }

  static async create() {
    const client = await initRedis()
    const cache = new RedisCache(client)
    if (client) {
      try {
        await client.connect()
        cache.isConnected = true
      } catch (e) {
        logger.warn('Failed to connect to Redis', { error: e.message })
      }
    }
    return cache
  }

  async get(key) {
    if (this.isConnected) {
      try {
        const value = await this.client.get(key)
        if (value) {
          this.stats.hits++
          return JSON.parse(value)
        }
        this.stats.misses++
        return undefined
      } catch (e) {
        logger.warn('Get operation failed, using fallback', { key, error: e.message })
        return this.fallback.get(key)
      }
    }
    return this.fallback.get(key)
  }

  async set(key, value, ttl = null) {
    if (this.isConnected) {
      try {
        const serialized = JSON.stringify(value)
        if (ttl) {
          await this.client.setEx(key, Math.floor(ttl / 1000), serialized)
        } else {
          await this.client.set(key, serialized)
        }
        this.stats.sets++
      } catch (e) {
        logger.warn('Set operation failed, using fallback', { key, error: e.message })
        this.fallback.set(key, value, ttl)
      }
    } else {
      this.fallback.set(key, value, ttl)
    }
    return value
  }

  async delete(key) {
    if (this.isConnected) {
      try {
        await this.client.del(key)
        this.stats.deletes++
      } catch (e) {
        logger.warn('Delete operation failed', { key, error: e.message })
        this.fallback.delete(key)
      }
    } else {
      this.fallback.delete(key)
    }
  }

  async invalidate(pattern) {
    if (this.isConnected) {
      try {
        const keys = await this.client.keys(pattern)
        if (keys.length > 0) {
          await this.client.del(...keys)
        }
      } catch (e) {
        logger.warn('Invalidate operation failed', { pattern, error: e.message })
      }
    }
    this.fallback.invalidate(pattern)
  }

  async clear() {
    if (this.isConnected) {
      try {
        await this.client.flushDb()
      } catch (e) {
        logger.warn('Clear operation failed', { error: e.message })
      }
    }
    this.fallback.clear()
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0
    return {
      mode: this.isConnected ? 'redis' : 'fallback',
      connected: this.isConnected,
      ...this.stats,
      hitRate: `${hitRate}%`,
      fallbackStats: this.fallback.getStats(),
    }
  }

  async close() {
    if (this.isConnected) {
      try {
        await this.client.quit()
      } catch (e) {
        logger.warn('Close operation failed', { error: e.message })
      }
    }
  }
}

export default RedisCache
