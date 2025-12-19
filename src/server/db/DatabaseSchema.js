import { TableBuilder, AlterTableBuilder } from './TableBuilder.js'

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
      console.error('Create table error:', e.message)
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
          })
        } else {
          await this.createTable(tableName, table => {
            table.string('id').primary()
            table.text('data').notNullable()
            table.timestamp('createdAt').notNullable()
            table.timestamp('updatedAt').notNullable()
          })
        }
      }
    }
  }
}
