import { TableBuilder, AlterTableBuilder } from './TableBuilder.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('DatabaseSchema')

export class DatabaseSchema {
  constructor(dbInstance) {
    this.db = dbInstance
  }

  async hasTable(tableName) {
    try {
      const stmt = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      stmt.bind([tableName])
      const result = stmt.step()
      stmt.free()
      return result
    } catch (e) {
      return false
    }
  }

  async createTable(tableName, fn) {
    const table = new TableBuilder(tableName)
    fn(table)
    const sql = table.build()
    try {
      this.db.run(sql)
    } catch (e) {
      logger.error('Failed to create table', { tableName, error: e.message })
    }
  }

  async alterTable(tableName, fn) {
    const table = new AlterTableBuilder(tableName, this.db)
    fn(table)
  }

  async initializeTables() {
    const configExists = await this.hasTable('config')
    if (!configExists) {
      await this.createTable('config', table => {
        table.string('key').primary()
        table.string('value')
      })
    }

    const tables = ['users', 'blueprints', 'entities', 'files']
    for (const tableName of tables) {
      const exists = await this.hasTable(tableName)
      if (!exists) {
        if (tableName === 'users') {
          await this.createTable('users', table => {
            table.string('id').primary()
            table.string('name').notNullable()
            table.string('avatar').nullable()
            table.integer('rank').notNullable()
            table.unique('id')
          })
        } else if (tableName === 'files') {
          await this.createTable('files', table => {
            table.string('hash').primary()
            table.string('filename').notNullable()
            table.string('storedFilename').notNullable()
            table.integer('size').notNullable()
            table.string('mimeType').notNullable()
            table.string('uploader').nullable()
            table.integer('timestamp').notNullable()
            table.integer('stored').notNullable()
            table.string('url').notNullable()
            table.unique('hash')
          })
        } else {
          await this.createTable(tableName, table => {
            table.string('id').primary()
            table.text('data').notNullable()
            table.timestamp('createdAt').notNullable()
            table.timestamp('updatedAt').notNullable()
            table.unique('id')
          })
        }
      }
    }

    await this.createIndexes()
  }

  async createIndexes() {
    const indexes = [
      { table: 'blueprints', column: 'id', name: 'idx_blueprints_id' },
      { table: 'blueprints', column: 'createdAt', name: 'idx_blueprints_created' },
      { table: 'entities', column: 'id', name: 'idx_entities_id' },
      { table: 'entities', column: 'createdAt', name: 'idx_entities_created' },
      { table: 'users', column: 'id', name: 'idx_users_id' },
      { table: 'users', column: 'name', name: 'idx_users_name' },
      { table: 'files', column: 'hash', name: 'idx_files_hash' },
      { table: 'files', column: 'uploader', name: 'idx_files_uploader' },
      { table: 'files', column: 'timestamp', name: 'idx_files_timestamp' },
      { table: 'config', column: 'key', name: 'idx_config_key' },
    ]

    for (const idx of indexes) {
      try {
        this.db.run(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table}(${idx.column})`)
      } catch (e) {
      }
    }

    try {
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_id_unique ON users(id)`)
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_files_hash_unique ON files(hash)`)
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_blueprints_id_unique ON blueprints(id)`)
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_id_unique ON entities(id)`)
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key_unique ON config(key)`)
    } catch (e) {
    }
  }
}
