import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Memoizer')

export class Memoizer {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 1000
    this.defaultTtl = options.defaultTtl || 300000
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      computations: 0
    }
  }

  memoize(fn, options = {}) {
    const ttl = options.ttl || this.defaultTtl
    const keyGenerator = options.keyGenerator || this.defaultKeyGenerator

    return async (...args) => {
      const key = keyGenerator(...args)
      const cached = this.get(key)

      if (cached !== undefined) {
        this.stats.hits++
        return cached
      }

      this.stats.misses++
      this.stats.computations++

      const result = await fn(...args)
      this.set(key, result, ttl)

      return result
    }
  }

  memoizeSync(fn, options = {}) {
    const ttl = options.ttl || this.defaultTtl
    const keyGenerator = options.keyGenerator || this.defaultKeyGenerator

    return (...args) => {
      const key = keyGenerator(...args)
      const cached = this.get(key)

      if (cached !== undefined) {
        this.stats.hits++
        return cached
      }

      this.stats.misses++
      this.stats.computations++

      const result = fn(...args)
      this.set(key, result, ttl)

      return result
    }
  }

  defaultKeyGenerator(...args) {
    return JSON.stringify(args)
  }

  set(key, value, ttl = this.defaultTtl) {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.stats.evictions++
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      ttl
    })
  }

  get(key) {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    const age = Date.now() - entry.createdAt
    if (age > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  invalidate(key) {
    this.cache.delete(key)
  }

  invalidatePattern(pattern) {
    let invalidated = 0

    for (const key of this.cache.keys()) {
      if (typeof pattern === 'function' ? pattern(key) : key.includes(pattern)) {
        this.cache.delete(key)
        invalidated++
      }
    }

    return invalidated
  }

  clear() {
    const size = this.cache.size
    this.cache.clear()
    logger.debug('Memoization cache cleared', { entries: size })
    return size
  }

  prune() {
    const now = Date.now()
    let pruned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        this.cache.delete(key)
        pruned++
      }
    }

    return pruned
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      cacheSize: this.cache.size,
      maxEntries: this.maxEntries
    }
  }
}

export class ComputedValue {
  constructor(computeFn, options = {}) {
    this.computeFn = computeFn
    this.ttl = options.ttl || 300000
    this.dependencies = options.dependencies || []
    this.value = null
    this.computedAt = null
    this.computing = false
    this.computeCount = 0
    this.lastError = null
  }

  async getValue() {
    if (this.isValid()) {
      return this.value
    }

    if (this.computing) {
      return this.value
    }

    return this.compute()
  }

  async compute() {
    if (this.computing) {
      return this.value
    }

    this.computing = true

    try {
      this.value = await this.computeFn()
      this.computedAt = Date.now()
      this.computeCount++
      this.lastError = null
      return this.value
    } catch (error) {
      this.lastError = error
      logger.error('Computed value computation failed', { error: error.message })
      throw error
    } finally {
      this.computing = false
    }
  }

  isValid() {
    if (!this.computedAt) {
      return false
    }

    const age = Date.now() - this.computedAt
    return age < this.ttl
  }

  invalidate() {
    this.computedAt = null
  }

  getStats() {
    return {
      valid: this.isValid(),
      computeCount: this.computeCount,
      age: this.computedAt ? Date.now() - this.computedAt : null,
      computing: this.computing,
      hasError: this.lastError !== null,
      lastError: this.lastError?.message || null
    }
  }
}

export class DependencyGraph {
  constructor() {
    this.nodes = new Map()
    this.dependencies = new Map()
    this.dependents = new Map()
  }

  register(key, computeFn, dependencies = []) {
    this.nodes.set(key, { computeFn, dependencies })
    this.dependencies.set(key, dependencies)
    this.dependents.set(key, [])

    for (const dep of dependencies) {
      if (!this.dependents.has(dep)) {
        this.dependents.set(dep, [])
      }
      this.dependents.get(dep).push(key)
    }
  }

  invalidate(key) {
    const invalidated = new Set()
    const queue = [key]

    while (queue.length > 0) {
      const current = queue.shift()

      if (invalidated.has(current)) continue
      invalidated.add(current)

      const deps = this.dependents.get(current) || []
      queue.push(...deps)
    }

    return Array.from(invalidated)
  }

  topologicalSort() {
    const visited = new Set()
    const visiting = new Set()
    const result = []

    const visit = (key) => {
      if (visited.has(key)) return
      if (visiting.has(key)) {
        logger.warn('Circular dependency detected', { key })
        return
      }

      visiting.add(key)

      const deps = this.dependencies.get(key) || []
      for (const dep of deps) {
        if (this.nodes.has(dep)) {
          visit(dep)
        }
      }

      visiting.delete(key)
      visited.add(key)
      result.push(key)
    }

    for (const key of this.nodes.keys()) {
      visit(key)
    }

    return result
  }

  getStats() {
    return {
      nodeCount: this.nodes.size,
      edges: Array.from(this.dependencies.values()).reduce((sum, deps) => sum + deps.length, 0),
      leafNodes: Array.from(this.nodes.keys()).filter(key => (this.dependents.get(key) || []).length === 0).length
    }
  }
}

export class CacheInvalidationManager {
  constructor() {
    this.strategies = new Map()
    this.rules = []
  }

  registerStrategy(name, fn) {
    this.strategies.set(name, fn)
  }

  addRule(pattern, strategy, options = {}) {
    this.rules.push({ pattern, strategy, options })
  }

  async invalidate(event, context = {}) {
    const invalidations = []

    for (const rule of this.rules) {
      if (typeof rule.pattern === 'function' ? rule.pattern(event) : event.includes(rule.pattern)) {
        const strategy = this.strategies.get(rule.strategy)

        if (strategy) {
          try {
            const result = await strategy(event, context)
            invalidations.push({ rule: rule.pattern, result })
          } catch (error) {
            logger.error('Invalidation strategy failed', {
              strategy: rule.strategy,
              error: error.message
            })
          }
        }
      }
    }

    return invalidations
  }
}
