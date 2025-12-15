import initSqlJs from 'sql.js'
import moment from 'moment'
import fs from 'fs-extra'
import path from 'path'
import { uuid } from '../core/utils.js'
import { importApp } from '../core/extras/appTools.js'
import { defaults } from 'lodash-es'
import { Ranks } from '../core/extras/ranks.js'

let db
let SQL

// sql.js wrapper with parameterized queries
class SqlJsDatabase {
  constructor(database, SQL) {
    this.db = database
    this.SQL = SQL
  }

  schema = {
    hasTable: async (tableName) => {
      const stmt = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      stmt.bind([tableName])
      const result = stmt.step()
      stmt.free()
      return result
    },
    createTable: async (tableName, fn) => {
      const table = new TableBuilder(tableName)
      fn(table)
      const sql = table.build()
      this.db.run(sql)
    },
    alterTable: async (tableName, fn) => {
      const table = new AlterTableBuilder(tableName, this.db)
      fn(table)
    },
  }

  async insert(data) {
    return this
  }

  async where(key, value) {
    return new QueryBuilder(this.db, this.SQL, null, { [key]: value })
  }

  async first() {
    return null
  }

  async get(tableName) {
    return {
      insert: async (data) => {
        const keys = Object.keys(data)
        const placeholders = keys.map(() => '?').join(',')
        const values = keys.map(k => data[k])
        const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`
        const stmt = this.db.prepare(sql)
        stmt.bind(values)
        stmt.step()
        stmt.free()
      },
      where: (key, value) => new QueryBuilder(this.db, this.SQL, tableName, { [key]: value }),
    }
  }
}

class TableBuilder {
  constructor(name) {
    this.name = name
    this.columns = []
  }

  string(name) {
    this.columns.push(`${name} TEXT`)
    return {
      primary: () => {
        this.columns[this.columns.length - 1] += ' PRIMARY KEY'
        return this
      },
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
      nullable: () => this,
    }
  }

  text(name) {
    this.columns.push(`${name} TEXT`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
    }
  }

  timestamp(name) {
    this.columns.push(`${name} TEXT`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
    }
  }

  integer(name) {
    this.columns.push(`${name} INTEGER`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
      defaultTo: (val) => {
        this.columns[this.columns.length - 1] += ` DEFAULT ${val}`
        return this
      },
    }
  }

  renameColumn() {
    return this
  }

  dropColumn() {
    return this
  }

  build() {
    return `CREATE TABLE IF NOT EXISTS ${this.name} (${this.columns.join(', ')})`
  }
}

class AlterTableBuilder {
  constructor(name, db) {
    this.name = name
    this.db = db
  }

  string(name) {
    return {
      nullable: () => {
        try {
          this.db.run(`ALTER TABLE ${this.name} ADD COLUMN ${name} TEXT`)
        } catch (e) {
          // Column might already exist
        }
        return this
      },
    }
  }

  integer(name) {
    return {
      notNullable: () => {
        return {
          defaultTo: () => {
            try {
              this.db.run(`ALTER TABLE ${this.name} ADD COLUMN ${name} INTEGER DEFAULT 0`)
            } catch (e) {}
            return this
          },
        }
      },
    }
  }

  renameColumn(oldName, newName) {
    // sql.js doesn't support rename column
    return this
  }

  dropColumn(name) {
    // sql.js doesn't support drop column
    return this
  }
}

class QueryBuilder {
  constructor(db, SQL, tableName, where) {
    this.db = db
    this.SQL = SQL
    this.tableName = tableName
    this._where = where
  }

  where(key, value) {
    this._where = { [key]: value }
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
      console.error('Insert error:', e.message)
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
      console.error('First error:', e.message)
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
      console.error('Update error:', e.message)
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
      console.error('Delete error:', e.message)
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
      console.error('Get all rows error:', e.message)
      return []
    }
  }
}

class Database {
  constructor(dbInstance, SQL) {
    this.dbInstance = dbInstance
    this.SQL = SQL
    this.schema = {
      hasTable: async (tableName) => {
        try {
          const stmt = dbInstance.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
          stmt.bind([tableName])
          const result = stmt.step()
          stmt.free()
          return result
        } catch (e) {
          return false
        }
      },
      createTable: async (tableName, fn) => {
        const table = new TableBuilder(tableName)
        fn(table)
        const sql = table.build()
        try {
          dbInstance.run(sql)
        } catch (e) {
          console.error('Create table error:', e.message)
        }
      },
      alterTable: async (tableName, fn) => {
        const table = new AlterTableBuilder(tableName, dbInstance)
        fn(table)
      },
    }
  }

  __call__(tableName) {
    return new QueryBuilder(this.dbInstance, this.SQL, tableName, {})
  }

  async insert(tableName, data) {
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(',')
    const values = keys.map(k => data[k])
    const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`
    try {
      const stmt = this.dbInstance.prepare(sql)
      stmt.bind(values)
      stmt.step()
      stmt.free()
    } catch (e) {
      console.error('Insert error:', e.message)
    }
  }

  async query(sql) {
    try {
      const stmt = this.dbInstance.prepare(sql)
      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.free()
      return rows
    } catch (e) {
      console.error('Query error:', e.message)
      return []
    }
  }
}

export async function getDB(worldDir) {
  if (!db) {
    if (!SQL) {
      SQL = await initSqlJs()
    }
    const dbInstance = new SQL.Database()
    const database = new Database(dbInstance, SQL)

    // Create a callable function with database properties attached
    const dbFunc = (tableName) => new QueryBuilder(dbInstance, SQL, tableName, {})
    dbFunc.schema = database.schema
    dbFunc.insert = database.insert.bind(database)
    dbFunc.query = database.query.bind(database)

    db = dbFunc
  }

  // Ensure config table exists
  try {
    const exists = await db.schema.hasTable('config')
    if (!exists) {
      await db.schema.createTable('config', table => {
        table.string('key').primary()
        table.string('value')
      })
      await db.insert('config', { key: 'version', value: '0' })
    }
  } catch (e) {
    console.error('DB init error:', e.message)
  }

  // Simplified migration - just ensure tables exist
  try {
    const tables = ['users', 'blueprints', 'entities']
    for (const tableName of tables) {
      const exists = await db.schema.hasTable(tableName)
      if (!exists) {
        if (tableName === 'users') {
          await db.schema.createTable('users', table => {
            table.string('id').primary()
            table.string('name').notNullable()
            table.string('avatar').nullable()
            table.integer('rank').notNullable()
          })
        } else {
          await db.schema.createTable(tableName, table => {
            table.string('id').primary()
            table.text('data').notNullable()
            table.timestamp('createdAt').notNullable()
            table.timestamp('updatedAt').notNullable()
          })
        }
      }
    }

    // Ensure settings config exists
    const result = await db.query(`SELECT * FROM config WHERE key = 'settings'`)
    if (!result.length || !result[0].values.length) {
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
    console.error('Table setup error:', e.message)
  }

  return db
}
