import { StructuredLogger } from '../logging/index.js'

const logger = new StructuredLogger('ObjectPool')

// Simple fallback pool that works on client and server without generic-pool
class SimplePool {
  constructor(factory, maxSize) {
    this.factory = factory
    this.maxSize = maxSize
    this.available = []
    this.inUse = 0
  }

  async acquire() {
    if (this.available.length > 0) {
      this.inUse++
      return this.available.pop()
    }
    if (this.inUse < this.maxSize) {
      this.inUse++
      return this.factory()
    }
    await new Promise(r => setTimeout(r, 10))
    return this.acquire()
  }

  async release(item) {
    this.inUse--
    if (item && typeof item === 'object') {
      this.available.push(item)
    }
  }

  async drain() {}
  async clear() {
    this.available = []
  }

  availableObjectsCount() {
    return this.available.length
  }

  waitingClientsCount() {
    return this.inUse
  }
}

export class ObjectPool {
  constructor(Factory, initialSize = 10, name = 'ObjectPool') {
    this.Factory = Factory
    this.name = name
    this.created = 0
    this.reused = 0
    this.returned = 0

    this.pool = new SimplePool(() => {
      this.created++
      return new Factory()
    }, initialSize * 2)

    logger.debug(`${name} created`, { initialSize, factoryName: Factory.name })
  }

  acquire() {
    return this.pool.acquire().then(item => {
      this.reused++
      return item
    })
  }

  release(item) {
    if (item) {
      this.returned++
      return this.pool.release(item).then(() => true).catch(() => false)
    }
    return Promise.resolve(false)
  }

  async clear() {
    await this.pool.drain()
    await this.pool.clear()
    logger.debug(`${this.name} cleared`)
  }

  getStats() {
    return {
      name: this.name,
      available: this.pool.availableObjectsCount(),
      inUse: this.pool.waitingClientsCount(),
      created: this.created,
      reused: this.reused,
      returned: this.returned,
      reuseRate: this.reused / (this.created + this.reused) || 0
    }
  }

  async destroy() {
    await this.clear()
    this.Factory = null
  }
}

export class VectorPool {
  constructor(Vector3Factory = () => ({ x: 0, y: 0, z: 0 }), initialSize = 50) {
    this.pool = new ObjectPool(Vector3Factory, initialSize, 'VectorPool')
  }

  acquire() {
    return this.pool.acquire()
  }

  release(vec) {
    if (vec && typeof vec === 'object') {
      vec.x = 0
      vec.y = 0
      vec.z = 0
    }
    return this.pool.release(vec)
  }

  getStats() {
    return this.pool.getStats()
  }

  async clear() {
    return this.pool.clear()
  }

  async destroy() {
    return this.pool.destroy()
  }
}

export class QuaternionPool {
  constructor(QuatFactory = () => ({ x: 0, y: 0, z: 0, w: 1 }), initialSize = 50) {
    this.pool = new ObjectPool(QuatFactory, initialSize, 'QuaternionPool')
  }

  acquire() {
    return this.pool.acquire()
  }

  release(quat) {
    if (quat && typeof quat === 'object') {
      quat.x = 0
      quat.y = 0
      quat.z = 0
      quat.w = 1
    }
    return this.pool.release(quat)
  }

  getStats() {
    return this.pool.getStats()
  }

  async clear() {
    return this.pool.clear()
  }

  async destroy() {
    return this.pool.destroy()
  }
}

export class Matrix4Pool {
  constructor(Matrix4Factory = () => ({}), initialSize = 20) {
    this.pool = new ObjectPool(Matrix4Factory, initialSize, 'Matrix4Pool')
  }

  acquire() {
    return this.pool.acquire()
  }

  release(mat) {
    return this.pool.release(mat)
  }

  getStats() {
    return this.pool.getStats()
  }

  async clear() {
    return this.pool.clear()
  }

  async destroy() {
    return this.pool.destroy()
  }
}
