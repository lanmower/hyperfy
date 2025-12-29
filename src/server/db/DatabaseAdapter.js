import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DatabaseAdapter')

export class DatabaseAdapter {
  constructor(database) {
    this.database = database
    this.batchQueue = []
    this.batchSize = 100
    this.batchFlushInterval = null
  }

  async find(tableName, conditions = {}) {
    const where = this.buildWhere(conditions)
    const sql = `SELECT * FROM ${tableName} ${where ? 'WHERE ' + where : ''}`
    return this.database.query(sql)
  }

  async findOne(tableName, conditions = {}) {
    const results = await this.find(tableName, conditions)
    return results.length > 0 ? results[0] : null
  }

  async findById(tableName, id) {
    return this.findOne(tableName, { id })
  }

  async insert(tableName, data) {
    return this.database.insert(tableName, data)
  }

  async insertMany(tableName, records) {
    for (const record of records) {
      await this.database.insert(tableName, record)
    }
    return records.length
  }

  async update(tableName, data, conditions = {}) {
    const whereClause = this.buildWhere(conditions)
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)
    const conditionValues = Object.values(conditions)

    const sql = `UPDATE ${tableName} SET ${updates} ${whereClause ? 'WHERE ' + whereClause : ''}`

    return this.database.query(sql, [...values, ...conditionValues])
  }

  async updateById(tableName, id, data) {
    return this.update(tableName, data, { id })
  }

  async delete(tableName, conditions = {}) {
    const whereClause = this.buildWhere(conditions)
    const conditionValues = Object.values(conditions)

    const sql = `DELETE FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`

    return this.database.query(sql, conditionValues)
  }

  async deleteById(tableName, id) {
    return this.delete(tableName, { id })
  }

  async deleteMany(tableName, ids) {
    const placeholders = ids.map(() => '?').join(',')
    const sql = `DELETE FROM ${tableName} WHERE id IN (${placeholders})`
    return this.database.query(sql, ids)
  }

  async count(tableName, conditions = {}) {
    const where = this.buildWhere(conditions)
    const sql = `SELECT COUNT(*) as count FROM ${tableName} ${where ? 'WHERE ' + where : ''}`
    const result = await this.database.query(sql)
    return result.length > 0 ? result[0].count : 0
  }

  async exists(tableName, conditions = {}) {
    const count = await this.count(tableName, conditions)
    return count > 0
  }

  async transaction(callback) {
    try {
      await this.database.query('BEGIN TRANSACTION')
      const result = await callback(this)
      await this.database.query('COMMIT')
      return result
    } catch (err) {
      await this.database.query('ROLLBACK')
      logger.error('Transaction failed', { error: err.message })
      throw err
    }
  }

  async batchInsert(tableName, records) {
    return this.transaction(async (adapter) => {
      let inserted = 0
      for (const record of records) {
        await adapter.insert(tableName, record)
        inserted++
      }
      return inserted
    })
  }

  async clear(tableName) {
    const sql = `DELETE FROM ${tableName}`
    return this.database.query(sql)
  }

  buildWhere(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return ''
    }

    return Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ')
  }

  getSchema() {
    return this.database.schema
  }

  getCache() {
    return this.database.cache
  }

  getMetrics() {
    return this.database.metrics?.getMetrics?.() || null
  }

  getCacheStats() {
    return this.database.cache?.getStats?.() || null
  }
}
