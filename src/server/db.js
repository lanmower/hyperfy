import path from 'path'
import fs from 'fs-extra'

let dbInstance = null
let dbType = 'sqlite'
let pgPool = null

async function initSqlite(dbPath) {
  const initSqlJs = await import('sql.js')
  const SQL = await initSqlJs.default()

  let db
  const dir = path.dirname(dbPath)
  await fs.ensureDir(dir)

  const loadDb = () => {
    try {
      if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath)
        db = new SQL.Database(buffer)
      } else {
        db = new SQL.Database()
      }
    } catch {
      db = new SQL.Database()
    }
  }

  const saveDb = () => {
    try {
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(dbPath, buffer)
    } catch (e) {
      console.error('DB save error:', e)
    }
  }

  loadDb()

  return {
    query: async (sql, params = []) => {
      try {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        const rows = []
        while (stmt.step()) rows.push(stmt.getAsObject())
        stmt.free()
        return rows
      } catch (e) {
        console.error('Query error:', e, sql)
        return []
      }
    },
    queryOne: async (sql, params = []) => {
      try {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        if (stmt.step()) {
          const row = stmt.getAsObject()
          stmt.free()
          return row
        }
        stmt.free()
        return null
      } catch (e) {
        console.error('QueryOne error:', e, sql)
        return null
      }
    },
    exec: async (sql, params = []) => {
      try {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        stmt.step()
        stmt.free()
        saveDb()
      } catch (e) {
        console.error('Exec error:', e, sql)
      }
    },
    run: async (sql, params = []) => {
      try {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        stmt.step()
        stmt.free()
        saveDb()
        return null
      } catch (e) {
        console.error('Run error:', e, sql)
        return null
      }
    },
    close: async () => {
      try {
        saveDb()
        db.close()
      } catch (e) {
        console.error('Close error:', e)
      }
    }
  }
}

async function initPostgres(connectionString) {
  const pg = await import('pg')
  const { Pool } = pg
  pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  await pgPool.query('SELECT 1')

  return {
    query: async (sql, params = []) => {
      const result = await pgPool.query(sql, params)
      return result.rows
    },
    queryOne: async (sql, params = []) => {
      const result = await pgPool.query(sql, params)
      return result.rows[0] || null
    },
    exec: async (sql, params = []) => {
      await pgPool.query(sql, params)
    },
    run: async (sql, params = []) => {
      const result = await pgPool.query(sql, params)
      return result.lastId || null
    },
    close: async () => {
      if (pgPool) await pgPool.end()
    }
  }
}

async function initSchema(db) {
  const isPostgres = dbType === 'postgres'

  let tableExists = false
  try {
    const result = await db.queryOne(
      isPostgres
        ? `SELECT 1 FROM information_schema.tables WHERE table_name = 'config'`
        : `SELECT name FROM sqlite_master WHERE type='table' AND name='config'`
    )
    tableExists = !!result
  } catch {
    tableExists = false
  }

  if (tableExists) return

  const schema = `
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      avatar TEXT,
      rank INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS blueprints (
      id TEXT PRIMARY KEY,
      data TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      worldId TEXT,
      data TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS files (
      hash TEXT PRIMARY KEY,
      filename TEXT,
      storedFilename TEXT,
      size INTEGER,
      mimeType TEXT,
      uploader TEXT,
      timestamp INTEGER,
      stored INTEGER,
      url TEXT
    );
  `

  const statements = schema.split(';').filter(s => s.trim())
  for (const stmt of statements) {
    await db.exec(stmt.trim())
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_blueprints_created ON blueprints(createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
    'CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash)',
    'CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader)',
    'CREATE INDEX IF NOT EXISTS idx_files_timestamp ON files(timestamp)',
  ]

  for (const idx of indexes) {
    await db.exec(idx)
  }

  const settingsExists = await db.queryOne('SELECT 1 FROM config WHERE key = ?', ['settings'])
  if (!settingsExists) {
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
    await db.exec('INSERT INTO config (key, value) VALUES (?, ?)', [
      'settings',
      JSON.stringify(defaultSettings)
    ])
  }
}

export async function getDB(worldDir) {
  if (dbInstance) return dbInstance

  const dbUri = process.env.DB_URI || 'local'

  if (dbUri.startsWith('postgres://') || dbUri.startsWith('postgresql://')) {
    dbType = 'postgres'
    dbInstance = await initPostgres(dbUri)
  } else {
    dbType = 'sqlite'
    const dbPath = path.join(worldDir, 'hyperfy.db')
    dbInstance = await initSqlite(dbPath)
  }

  await initSchema(dbInstance)

  return {
    query: async (sql, params = []) => dbInstance.query(sql, params),
    queryOne: async (sql, params = []) => dbInstance.queryOne(sql, params),
    exec: async (sql, params = []) => dbInstance.exec(sql, params),
    run: async (sql, params = []) => dbInstance.run(sql, params),
    close: async () => dbInstance.close(),
    metrics: () => ({ lastMin: { totalQueries: 0, avgDuration: 0, slowQueries: 0, byType: {}, byTable: {} } })
  }
}

export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
  }
  if (pgPool) {
    await pgPool.end()
    pgPool = null
  }
}
