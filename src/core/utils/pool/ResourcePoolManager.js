import { ObjectPool, VectorPool, QuaternionPool, Matrix4Pool } from './ObjectPool.js'
import { StructuredLogger } from '../logging/index.js'

const logger = new StructuredLogger('ResourcePoolManager')

export class ResourcePoolManager {
  constructor() {
    this.pools = new Map()
    this.stats = new Map()
  }

  createObjectPool(name, Factory, initialSize = 10) {
    if (this.pools.has(name)) {
      logger.warn('Pool already exists', { name })
      return this.pools.get(name)
    }
    const pool = new ObjectPool(Factory, initialSize, name)
    this.pools.set(name, pool)
    logger.debug('Object pool created', { name, initialSize })
    return pool
  }

  createVectorPool(name, Vector3Factory, initialSize = 50) {
    if (this.pools.has(name)) {
      logger.warn('Pool already exists', { name })
      return this.pools.get(name)
    }
    const pool = new VectorPool(Vector3Factory, initialSize)
    this.pools.set(name, pool)
    logger.debug('Vector pool created', { name, initialSize })
    return pool
  }

  createQuaternionPool(name, QuatFactory, initialSize = 50) {
    if (this.pools.has(name)) {
      logger.warn('Pool already exists', { name })
      return this.pools.get(name)
    }
    const pool = new QuaternionPool(QuatFactory, initialSize)
    this.pools.set(name, pool)
    logger.debug('Quaternion pool created', { name, initialSize })
    return pool
  }

  createMatrix4Pool(name, Matrix4Factory, initialSize = 20) {
    if (this.pools.has(name)) {
      logger.warn('Pool already exists', { name })
      return this.pools.get(name)
    }
    const pool = new Matrix4Pool(Matrix4Factory, initialSize)
    this.pools.set(name, pool)
    logger.debug('Matrix4 pool created', { name, initialSize })
    return pool
  }

  getPool(name) {
    return this.pools.get(name)
  }

  hasPool(name) {
    return this.pools.has(name)
  }

  removePool(name) {
    const pool = this.pools.get(name)
    if (pool) {
      pool.destroy()
      this.pools.delete(name)
      logger.debug('Pool destroyed', { name })
      return true
    }
    return false
  }

  getAllPoolNames() {
    return Array.from(this.pools.keys())
  }

  getStats(name) {
    if (name) {
      const pool = this.pools.get(name)
      return pool ? pool.getStats() : null
    }

    const stats = {}
    for (const [poolName, pool] of this.pools) {
      stats[poolName] = pool.getStats()
    }
    return stats
  }

  getSummary() {
    const summary = {
      totalPools: this.pools.size,
      pools: {}
    }

    let totalAvailable = 0
    let totalInUse = 0
    let totalCreated = 0
    let totalReused = 0

    for (const [name, pool] of this.pools) {
      const stats = pool.getStats()
      summary.pools[name] = stats
      totalAvailable += stats.available
      totalInUse += stats.inUse
      totalCreated += stats.created
      totalReused += stats.reused
    }

    summary.summary = {
      totalAvailable,
      totalInUse,
      totalCreated,
      totalReused,
      overallReuseRate: totalReused / (totalCreated + totalReused) || 0
    }

    return summary
  }

  clearAll() {
    for (const pool of this.pools.values()) {
      pool.clear()
    }
    logger.debug('All pools cleared')
  }

  destroyAll() {
    for (const [name, pool] of this.pools) {
      pool.destroy()
    }
    this.pools.clear()
    logger.debug('All pools destroyed')
  }
}

let globalManager = null

export function getGlobalResourcePoolManager() {
  if (!globalManager) {
    globalManager = new ResourcePoolManager()
    logger.debug('Global ResourcePoolManager created')
  }
  return globalManager
}

export function resetGlobalResourcePoolManager() {
  if (globalManager) {
    globalManager.destroyAll()
    globalManager = null
    logger.debug('Global ResourcePoolManager reset')
  }
}
