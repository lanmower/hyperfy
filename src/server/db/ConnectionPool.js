import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ConnectionPool')

export class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 10
    this.minConnections = options.minConnections || 2
    this.connectionTimeout = options.connectionTimeout || 30000
    this.idleTimeout = options.idleTimeout || 60000
    this.maxRetries = options.maxRetries || 3

    this.connections = []
    this.available = []
    this.inUse = new Set()
    this.waiting = []
    this.stats = {
      created: 0,
      destroyed: 0,
      acquired: 0,
      released: 0,
      errors: 0,
      timeouts: 0
    }

    this.initialized = false
  }

  async init(connectionFactory) {
    this.connectionFactory = connectionFactory

    for (let i = 0; i < this.minConnections; i++) {
      try {
        const conn = await this.createConnection()
        this.available.push(conn)
      } catch (error) {
        logger.error('Failed to create initial connection', { error: error.message })
      }
    }

    this.initialized = true
    logger.info('Pool initialized', {
      minConnections: this.minConnections,
      maxConnections: this.maxConnections
    })
  }

  async createConnection() {
    const conn = await this.connectionFactory()
    conn.createdAt = Date.now()
    conn.lastUsed = Date.now()
    conn.queryCount = 0

    this.connections.push(conn)
    this.stats.created++

    return conn
  }

  async acquire(timeout = this.connectionTimeout) {
    if (!this.initialized) {
      throw new Error('Pool not initialized')
    }

    const startTime = Date.now()

    while (true) {
      if (this.available.length > 0) {
        const conn = this.available.pop()
        conn.lastUsed = Date.now()
        this.inUse.add(conn)
        this.stats.acquired++
        return conn
      }

      if (this.connections.length < this.maxConnections) {
        try {
          const conn = await this.createConnection()
          this.inUse.add(conn)
          this.stats.acquired++
          return conn
        } catch (error) {
          this.stats.errors++
          logger.error('Failed to create connection', { error: error.message })
        }
      }

      const elapsed = Date.now() - startTime
      if (elapsed > timeout) {
        this.stats.timeouts++
        throw new Error(`Connection acquire timeout after ${elapsed}ms`)
      }

      await new Promise(resolve => {
        this.waiting.push({ resolve, timeout: timeout - elapsed })
        setTimeout(() => resolve(), Math.min(100, timeout - elapsed))
      })
    }
  }

  release(conn) {
    if (!this.inUse.has(conn)) {
      logger.warn('Released connection not in use')
      return
    }

    this.inUse.delete(conn)
    conn.lastUsed = Date.now()

    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()
      this.inUse.add(conn)
      waiter.resolve()
    } else {
      this.available.push(conn)
    }

    this.stats.released++
  }

  async withConnection(fn) {
    const conn = await this.acquire()
    try {
      return await fn(conn)
    } finally {
      this.release(conn)
    }
  }

  async drain() {
    for (const conn of this.connections) {
      try {
        if (conn.close) await conn.close()
      } catch (error) {
        logger.error('Error closing connection', { error: error.message })
      }
      this.stats.destroyed++
    }

    this.connections = []
    this.available = []
    this.inUse.clear()
    this.waiting = []

    logger.info('Pool drained', { connections: this.stats.destroyed })
  }

  getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.connections.length,
      waiting: this.waiting.length,
      utilizationRate: this.inUse.size / this.connections.length || 0
    }
  }

  getConnectionStats(conn) {
    return {
      createdAt: conn.createdAt,
      lastUsed: conn.lastUsed,
      queryCount: conn.queryCount,
      idleTime: Date.now() - conn.lastUsed
    }
  }
}

export class QueryCache {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 1000
    this.ttl = options.ttl || 300000 // 5 minutes default
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }

  createKey(sql, params) {
    return `${sql}:${JSON.stringify(params || [])}`
  }

  set(sql, params, result, ttl = this.ttl) {
    const key = this.createKey(sql, params)

    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.stats.evictions++
    }

    this.cache.set(key, {
      result,
      createdAt: Date.now(),
      ttl
    })
  }

  get(sql, params) {
    const key = this.createKey(sql, params)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    const age = Date.now() - entry.createdAt
    if (age > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.result
  }

  clear() {
    const size = this.cache.size
    this.cache.clear()
    logger.debug('Query cache cleared', { entries: size })
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : 'N/A',
      cacheSize: this.cache.size,
      maxEntries: this.maxEntries
    }
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

    if (pruned > 0) {
      logger.debug('Query cache pruned', { entries: pruned })
    }

    return pruned
  }
}

export class PreparedStatementCache {
  constructor(options = {}) {
    this.maxStatements = options.maxStatements || 100
    this.statements = new Map()
    this.stats = {
      created: 0,
      hits: 0,
      misses: 0
    }
  }

  getOrCreate(conn, sql) {
    const key = sql

    if (this.statements.has(key)) {
      this.stats.hits++
      return this.statements.get(key)
    }

    try {
      const stmt = conn.prepare(sql)

      if (this.statements.size >= this.maxStatements) {
        const firstKey = this.statements.keys().next().value
        const oldStmt = this.statements.get(firstKey)
        if (oldStmt && oldStmt.free) oldStmt.free()
        this.statements.delete(firstKey)
      }

      this.statements.set(key, stmt)
      this.stats.created++
      this.stats.misses++

      return stmt
    } catch (error) {
      logger.error('Prepared statement creation failed', { sql, error: error.message })
      throw error
    }
  }

  clear() {
    for (const stmt of this.statements.values()) {
      try {
        if (stmt.free) stmt.free()
      } catch (error) {
        logger.error('Error freeing statement', { error: error.message })
      }
    }

    this.statements.clear()
    logger.debug('Prepared statement cache cleared')
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : 'N/A',
      cachedStatements: this.statements.size,
      maxStatements: this.maxStatements
    }
  }
}
