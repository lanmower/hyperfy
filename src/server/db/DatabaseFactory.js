import initSqlJs from 'sql.js'
import { DatabaseAdapter } from './DatabaseAdapter.js'
import { DatabaseService } from './DatabaseService.js'
import { DatabaseSchema } from './DatabaseSchema.js'
import { QueryCache } from '../cache/QueryCache.js'
import { RedisCache } from '../cache/RedisCache.js'
import { DatabaseMetrics } from '../services/DatabaseMetrics.js'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DatabaseFactory')

let sharedDatabase = null
let sharedService = null
let SQL = null

export class DatabaseFactory {
  static async createDatabase(options = {}) {
    if (!SQL) {
      SQL = await initSqlJs()
    }

    const dbInstance = new SQL.Database()
    const queryCache = await this.createCache(options.cacheType)
    const metrics = new DatabaseMetrics()

    return {
      instance: dbInstance,
      SQL,
      cache: queryCache,
      metrics
    }
  }

  static async createService(database) {
    const adapter = new DatabaseAdapter(database)

    const wrapper = database
    wrapper.adapter = adapter

    const service = new DatabaseService(database)

    return service
  }

  static async createCache(cacheType = 'auto') {
    try {
      if (cacheType === 'redis' || (cacheType === 'auto' && process.env.REDIS_URL)) {
        const redisCache = await RedisCache.create()
        logger.info('Redis cache initialized')
        return new QueryCache(redisCache)
      }
    } catch (err) {
      logger.warn('Redis cache failed, falling back to in-memory', { error: err.message })
    }

    logger.info('In-memory cache initialized')
    return new QueryCache()
  }

  static async initialize(database) {
    const schemaManager = new DatabaseSchema(database.instance)
    await schemaManager.initializeTables()

    const configExists = await schemaManager.hasTable('config')
    if (!configExists) {
      await schemaManager.createTable('config', table => {
        table.string('key').primary()
        table.string('value')
      })

      const adapter = new DatabaseAdapter(database)
      await adapter.insert('config', { key: 'version', value: '1' })

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
      await adapter.insert('config', {
        key: 'settings',
        value: JSON.stringify(defaultSettings)
      })
    }

    logger.info('Database initialized')
  }

  static async getSharedService() {
    if (!sharedService) {
      const database = await this.createDatabase()
      await this.initialize(database)
      sharedService = await this.createService(database)
      sharedDatabase = database
    }
    return sharedService
  }

  static getDatabase() {
    return sharedDatabase
  }

  static resetShared() {
    sharedDatabase = null
    sharedService = null
    SQL = null
  }
}
