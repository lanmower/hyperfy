import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('QueryBuilder')

export class QueryBuilder {
  constructor(db, SQL, tableName, where) {
    this.db = db
    this.SQL = SQL
    this.tableName = tableName
    this._where = where
  }

  where(key, value) {
    if (typeof key === 'object') {
      this._where = { ...this._where, ...key }
    } else {
      this._where = { [key]: value }
    }
    return this
  }

  async insert(data) {
    if (!this.tableName) return
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(',')
    const values = keys.map(k => data[k])
    const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`
    try {
      const stmt = this.db.prepare(sql)
      stmt.bind(values)
      stmt.step()
      stmt.free()
    } catch (e) {
      logger.error('Insert error', { table: this.tableName, error: e.message })
    }
  }

  async first() {
    if (!this.tableName) return null
    const whereKeys = Object.keys(this._where)
    try {
      if (whereKeys.length === 0) {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} LIMIT 1`)
        const hasRow = stmt.step()
        if (hasRow) {
          const row = stmt.getAsObject()
          stmt.free()
          return row
        }
        stmt.free()
        return null
      }
      const key = whereKeys[0]
      const value = this._where[key]
      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${key} = ?`)
      stmt.bind([value])
      const hasRow = stmt.step()
      if (hasRow) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return null
    } catch (e) {
      logger.error('First error', { table: this.tableName, error: e.message })
      return null
    }
  }

  async update(data) {
    if (!this.tableName) return
    const whereKeys = Object.keys(this._where)
    if (whereKeys.length === 0) return
    try {
      const keys = Object.keys(data)
      const values = keys.map(k => data[k])
      const whereKey = whereKeys[0]
      const whereValue = this._where[whereKey]
      const sets = keys.map(() => '? = ?').join(', ')
      const placeholders = keys.flatMap((k, i) => [k, values[i]])
      const sql = `UPDATE ${this.tableName} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE ${whereKey} = ?`
      const stmt = this.db.prepare(sql)
      stmt.bind([...values, whereValue])
      stmt.step()
      stmt.free()
    } catch (e) {
      logger.error('Update error', { table: this.tableName, error: e.message })
    }
  }

  async delete() {
    if (!this.tableName) return
    const whereKeys = Object.keys(this._where)
    if (whereKeys.length === 0) return
    try {
      const key = whereKeys[0]
      const value = this._where[key]
      const sql = `DELETE FROM ${this.tableName} WHERE ${key} = ?`
      const stmt = this.db.prepare(sql)
      stmt.bind([value])
      stmt.step()
      stmt.free()
    } catch (e) {
      logger.error('Delete error', { table: this.tableName, error: e.message })
    }
  }

  then(onFulfilled, onRejected) {
    const promise = this._getAllRows()
    return promise.then(onFulfilled, onRejected)
  }

  async _getAllRows() {
    if (!this.tableName) return []
    const whereKeys = Object.keys(this._where)
    try {
      let stmt
      if (whereKeys.length > 0) {
        const key = whereKeys[0]
        const value = this._where[key]
        stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${key} = ?`)
        stmt.bind([value])
      } else {
        stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`)
      }
      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.free()
      return rows
    } catch (e) {
      logger.error('Get all rows error', { table: this.tableName, error: e.message })
      return []
    }
  }
}
