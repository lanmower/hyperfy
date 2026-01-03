import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('DatabaseSecurityWrapper')

const SQL_INJECTION_PATTERNS = [
  /(\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
  /(\bunion\b|\bselect\b)/gi,
]

export class DatabaseSecurityWrapper {
  constructor(db) {
    this.db = db
    this.queryCount = 0
    this.violationCount = 0
  }

  static validateSQL(sql) {
    if (typeof sql !== 'string') {
      throw new Error('SQL must be a string')
    }

    if (sql.length > 50000) {
      throw new Error('SQL query exceeds maximum length')
    }

    return true
  }

  static validateParameters(params, paramCount) {
    if (!Array.isArray(params)) {
      throw new Error('Parameters must be an array')
    }

    if (params.length !== paramCount) {
      throw new Error(`Parameter count mismatch: expected ${paramCount}, got ${params.length}`)
    }

    for (let i = 0; i < params.length; i++) {
      const param = params[i]
      if (param !== null && typeof param === 'object') {
        throw new Error(`Parameter ${i} must be a scalar value, not an object`)
      }
    }

    return true
  }

  static countPlaceholders(sql) {
    const matches = sql.match(/\?/g)
    return matches ? matches.length : 0
  }

  executeSafe(sql, params = []) {
    try {
      DatabaseSecurityWrapper.validateSQL(sql)
      const expectedParams = DatabaseSecurityWrapper.countPlaceholders(sql)
      DatabaseSecurityWrapper.validateParameters(params, expectedParams)

      const stmt = this.db.prepare(sql)
      stmt.bind(params)

      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.free()

      this.queryCount++
      logger.debug('Safe query executed', {
        queryId: this.queryCount,
        paramCount: params.length,
        rowCount: rows.length,
      })

      return rows
    } catch (err) {
      this.violationCount++
      logger.error('Database security violation', {
        error: err.message,
        violationCount: this.violationCount,
        code: 'DB_SECURITY_VIOLATION',
      })
      throw err
    }
  }

  queryWithValidation(sql, params = []) {
    return this.executeSafe(sql, params)
  }

  insertWithValidation(table, data) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`)
    }

    const keys = Object.keys(data)
    const values = keys.map(k => data[k])
    const placeholders = keys.map(() => '?').join(',')

    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`

    return this.executeSafe(sql, values)
  }

  updateWithValidation(table, data, where, whereParams = []) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`)
    }

    const keys = Object.keys(data)
    const setClause = keys.map(k => `${k} = ?`).join(',')
    const values = keys.map(k => data[k])

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`

    return this.executeSafe(sql, [...values, ...whereParams])
  }

  deleteWithValidation(table, where, params = []) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`)
    }

    const sql = `DELETE FROM ${table} WHERE ${where}`

    return this.executeSafe(sql, params)
  }

  getMetrics() {
    return {
      totalQueries: this.queryCount,
      securityViolations: this.violationCount,
      violationRate: this.queryCount > 0 ? (this.violationCount / this.queryCount) * 100 : 0,
    }
  }
}

export function createDatabaseSecurityWrapper(db) {
  return new DatabaseSecurityWrapper(db)
}
