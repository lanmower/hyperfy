import initSqlJs from 'sql.js'
import { QueryBuilder } from './db/QueryBuilder.js'
import { CachedQueryBuilder } from './db/CachedQueryBuilder.js'
import { DatabaseSchema } from './db/DatabaseSchema.js'
import { QueryCache } from './cache/QueryCache.js'
import { RedisCache } from './cache/RedisCache.js'
import { DatabaseMetrics } from './services/DatabaseMetrics.js'
import { ComponentLogger } from '../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Database')

let db
let SQL
let queryCache
let redisCache
let dbMetrics

class Database {
  constructor(dbInstance, SQL, queryCache = null, metrics = null, timeoutManager = null, circuitBreakerManager = null) {
    this.dbInstance = dbInstance
    this.SQL = SQL
    this.queryCache = queryCache
    this.metrics = metrics
    this.timeoutManager = timeoutManager
    this.circuitBreakerManager = circuitBreakerManager
    this.schemaManager = new DatabaseSchema(dbInstance)
    this.schema = {
      hasTable: this.schemaManager.hasTable.bind(this.schemaManager),
      createTable: this.schemaManager.createTable.bind(this.schemaManager),
      alterTable: this.schemaManager.alterTable.bind(this.schemaManager),
    }
    this.queryTimeout = timeoutManager ? timeoutManager.getTimeout('database') : 30000
    this.poolSize = process.env.NODE_ENV === 'production' ? 20 : 5
  }

  async insert(tableName, data) {
    const startTime = Date.now()
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(',')
    const values = keys.map(k => data[k])
    const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`

    const executeQuery = async () => {
      try {
        const stmt = this.dbInstance.prepare(sql)
        stmt.bind(values)
        stmt.step()
        stmt.free()
        if (this.queryCache) {
          this.queryCache.invalidateTable(tableName)
        }
        if (this.metrics) {
          this.metrics.recordQuery(tableName, Date.now() - startTime, 'INSERT', [tableName])
        }
      } catch (e) {
        logger.error('Insert error', { table: tableName, error: e.message })
        throw e
      }
    }

    const wrappedQuery = async () => {
      if (this.timeoutManager) {
        try {
          await this.timeoutManager.wrapPromise(executeQuery(), this.queryTimeout, 'database', `INSERT ${tableName}`)
        } catch (e) {
          if (e.code === 'TIMEOUT') {
            logger.error('Database insert timeout', { table: tableName })
          }
          throw e
        }
      } else {
        await executeQuery()
      }
    }

    if (this.circuitBreakerManager && this.circuitBreakerManager.has('database')) {
      return this.circuitBreakerManager.execute('database', wrappedQuery)
    } else {
      return wrappedQuery()
    }
  }

  async query(sql) {
    const startTime = Date.now()
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    const tableName = tableMatch ? tableMatch[1] : 'unknown'

    const executeQuery = async () => {
      try {
        const stmt = this.dbInstance.prepare(sql)
        const rows = []
        while (stmt.step()) {
          rows.push(stmt.getAsObject())
        }
        stmt.free()
        const duration = Date.now() - startTime
        if (this.metrics) {
          this.metrics.recordQuery(tableName, duration, 'SELECT', [tableName])
        }
        return rows
      } catch (e) {
        logger.error('Query error', { table: tableName, error: e.message })
        throw e
      }
    }

    const wrappedQuery = async () => {
      if (this.timeoutManager) {
        try {
          return await this.timeoutManager.wrapPromise(executeQuery(), this.queryTimeout, 'database', `SELECT ${tableName}`)
        } catch (e) {
          if (e.code === 'TIMEOUT') {
            logger.error('Database query timeout', { table: tableName })
          }
          return []
        }
      } else {
        try {
          return await executeQuery()
        } catch (e) {
          return []
        }
      }
    }

    if (this.circuitBreakerManager && this.circuitBreakerManager.has('database')) {
      try {
        return await this.circuitBreakerManager.execute('database', wrappedQuery)
      } catch (e) {
        if (e.code === 'CIRCUIT_OPEN') {
          logger.error('Database circuit open, returning empty result')
          return []
        }
        return []
      }
    } else {
      return wrappedQuery()
    }
  }
}

let dbInstance
let dbTimeoutManager
let dbCircuitBreakerManager

export async function getDB(worldDir, timeoutManager = null, circuitBreakerManager = null) {
  if (!db) {
    if (!SQL) {
      SQL = await initSqlJs()
    }
    dbInstance = new SQL.Database()

    if (timeoutManager) {
      dbTimeoutManager = timeoutManager
    }

    if (circuitBreakerManager) {
      dbCircuitBreakerManager = circuitBreakerManager
    }

    if (!dbMetrics) {
      dbMetrics = new DatabaseMetrics()
    }

    if (!queryCache) {
      if (process.env.REDIS_URL) {
        try {
          redisCache = await RedisCache.create()
          queryCache = new QueryCache(redisCache)
          logger.info('Redis cache enabled')
        } catch (e) {
          logger.warn('Redis cache failed, using fallback', { error: e.message })
          queryCache = new QueryCache()
        }
      } else {
        queryCache = new QueryCache()
        logger.info('In-memory cache enabled')
      }
    }

    const database = new Database(dbInstance, SQL, queryCache, dbMetrics, dbTimeoutManager, dbCircuitBreakerManager)

    const dbFunc = (tableName) => new CachedQueryBuilder(dbInstance, SQL, tableName, {}, queryCache, dbMetrics)
    dbFunc.schema = database.schema
    dbFunc.insert = database.insert.bind(database)
    dbFunc.query = database.query.bind(database)
    dbFunc.cache = queryCache
    dbFunc.stats = () => queryCache.getStats()
    dbFunc.metrics = () => dbMetrics.getMetrics()

    db = dbFunc
  }

  try {
    const configExists = await db.schema.hasTable('config')
    if (!configExists) {
      await db.schema.createTable('config', table => {
        table.string('key').primary()
        table.string('value')
      })
      await db.insert('config', { key: 'version', value: '0' })
    }

    const schemaManager = new DatabaseSchema(dbInstance)
    await schemaManager.initializeTables()

    const result = await db.query(`SELECT * FROM config WHERE key = 'settings'`)
    if (!result.length || !result[0].values?.length) {
      const defaultSettings = {
        title: null,
        desc: null,
        image: null,
        avatar: null,
        voice: 'spatial',
        playerLimit: 0,
        ao: true,
        customAvatars: false,
        rank: 0
      }
      await db.insert('config', { key: 'settings', value: JSON.stringify(defaultSettings) })
    }
  } catch (e) {
    logger.error('Database initialization error', { error: e.message })
  }

  return db
}
