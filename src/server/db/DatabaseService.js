import { DatabaseAdapter } from './DatabaseAdapter.js'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DatabaseService')

export class DatabaseService {
  constructor(database) {
    this.adapter = new DatabaseAdapter(database)
    this.connected = true
    this.connectionTime = Date.now()
    this.lastQuery = null
  }

  async query(sql) {
    this.lastQuery = Date.now()
    try {
      return await this.adapter.database.query(sql)
    } catch (err) {
      logger.error('Query failed', { sql: sql.substring(0, 100), error: err.message })
      throw err
    }
  }

  async find(tableName, conditions = {}) {
    return this.adapter.find(tableName, conditions)
  }

  async findOne(tableName, conditions = {}) {
    return this.adapter.findOne(tableName, conditions)
  }

  async findById(tableName, id) {
    return this.adapter.findById(tableName, id)
  }

  async insert(tableName, data) {
    return this.adapter.insert(tableName, data)
  }

  async insertMany(tableName, records) {
    return this.adapter.insertMany(tableName, records)
  }

  async update(tableName, data, conditions = {}) {
    return this.adapter.update(tableName, data, conditions)
  }

  async updateById(tableName, id, data) {
    return this.adapter.updateById(tableName, id, data)
  }

  async delete(tableName, conditions = {}) {
    return this.adapter.delete(tableName, conditions)
  }

  async deleteById(tableName, id) {
    return this.adapter.deleteById(tableName, id)
  }

  async deleteMany(tableName, ids) {
    return this.adapter.deleteMany(tableName, ids)
  }

  async count(tableName, conditions = {}) {
    return this.adapter.count(tableName, conditions)
  }

  async exists(tableName, conditions = {}) {
    return this.adapter.exists(tableName, conditions)
  }

  async transaction(callback) {
    return this.adapter.transaction(callback)
  }

  async batchInsert(tableName, records) {
    return this.adapter.batchInsert(tableName, records)
  }

  async clear(tableName) {
    return this.adapter.clear(tableName)
  }

  getSchema() {
    return this.adapter.getSchema()
  }

  getMetrics() {
    return this.adapter.getMetrics()
  }

  getCacheStats() {
    return this.adapter.getCacheStats()
  }

  getHealth() {
    const uptime = Date.now() - this.connectionTime
    return {
      connected: this.connected,
      uptime,
      lastQuery: this.lastQuery ? Date.now() - this.lastQuery : null,
      hasCache: !!this.adapter.getCache(),
      cacheStats: this.getCacheStats(),
      metrics: this.getMetrics()
    }
  }
}
