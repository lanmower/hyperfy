import initSqlJs from 'sql.js'
import { QueryBuilder } from './db/QueryBuilder.js'
import { DatabaseSchema } from './db/DatabaseSchema.js'

let db
let SQL

class Database {
  constructor(dbInstance, SQL) {
    this.dbInstance = dbInstance
    this.SQL = SQL
    this.schemaManager = new DatabaseSchema(dbInstance)
    this.schema = {
      hasTable: this.schemaManager.hasTable.bind(this.schemaManager),
      createTable: this.schemaManager.createTable.bind(this.schemaManager),
      alterTable: this.schemaManager.alterTable.bind(this.schemaManager),
    }
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

    const dbFunc = (tableName) => new QueryBuilder(dbInstance, SQL, tableName, {})
    dbFunc.schema = database.schema
    dbFunc.insert = database.insert.bind(database)
    dbFunc.query = database.query.bind(database)

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

    const schemaManager = new DatabaseSchema(database.dbInstance)
    await schemaManager.initializeTables()

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
    console.error('Database initialization error:', e.message)
  }

  return db
}
