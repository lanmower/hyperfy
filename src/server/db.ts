import path from 'path'
import fs from 'fs-extra'

interface DBInterface {
  query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>
  queryOne: (sql: string, params?: unknown[]) => Promise<Record<string, unknown> | null>
  exec: (sql: string, params?: unknown[]) => Promise<void>
  run: (sql: string, params?: unknown[]) => Promise<number | null>
  close: () => Promise<void>
}

let dbInstance: DBInterface | null = null
let dbType: string = 'sqlite'
let pgPool: any = null

async function initSqlite(dbPath: string): Promise<DBInterface> {
  let Database: any
  try {
    const betterSqlite3 = await import('better-sqlite3')
    Database = betterSqlite3.default
  } catch {
    const initSqlJs = await import('sql.js').then(m => m.default)
    const SQL = await initSqlJs()
    return createSqlJsDb(SQL, dbPath)
  }

  const dir = path.dirname(dbPath)
  await fs.ensureDir(dir)
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  return {
    query: async (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    queryOne: async (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) || null,
    exec: async (sql: string, params: unknown[] = []) => {
      db.prepare(sql).run(...params)
    },
    run: async (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      const info = stmt.run(...params)
      return info.lastInsertRowid || null
    },
    close: async () => db.close()
  }
}

function createSqlJsDb(SQL: any, dbPath: string): DBInterface {
  let db: any
  let lastSave = 0
  const SAVE_INTERVAL = 1000

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

  const saveDb = (force: boolean = false) => {
    const now = Date.now()
    if (force || now - lastSave >= SAVE_INTERVAL) {
      const data = db.export()
      const buffer = Buffer.from(data)
      const dir = path.dirname(dbPath)
      fs.ensureDirSync(dir)
      fs.writeFileSync(dbPath, buffer)
      lastSave = now
    }
  }

  loadDb()

  return {
    query: async (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) {
        rows.push(stmt.getAsObject())
      }
      stmt.free()
      return rows
    },
    queryOne: async (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return null
    },
    exec: async (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      stmt.step()
      stmt.free()
      saveDb(true)
    },
    run: async (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      stmt.step()
      stmt.free()
      saveDb(true)
      return null
    },
    close: async () => {
      saveDb(true)
    }
  }
}

async function initPostgres(connectionString: string): Promise<DBInterface> {
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
    query: async (sql: string, params: unknown[] = []) => {
      const result = await pgPool.query(sql, params)
      return result.rows
    },
    queryOne: async (sql: string, params: unknown[] = []) => {
      const result = await pgPool.query(sql, params)
      return result.rows[0] || null
    },
    exec: async (sql: string, params: unknown[] = []) => {
      await pgPool.query(sql, params)
    },
    run: async (sql: string, params: unknown[] = []) => {
      const result = await pgPool.query(sql, params)
      return result.lastId || null
    },
    close: async () => {
      if (pgPool) await pgPool.end()
    }
  }
}

async function initSchema(db: DBInterface): Promise<void> {
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

export async function getDB(worldDir: string): Promise<DBInterface & { metrics: () => any }> {
  if (dbInstance) return dbInstance as any

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
    query: async (sql: string, params?: unknown[]) => dbInstance!.query(sql, params),
    queryOne: async (sql: string, params?: unknown[]) => dbInstance!.queryOne(sql, params),
    exec: async (sql: string, params?: unknown[]) => dbInstance!.exec(sql, params),
    run: async (sql: string, params?: unknown[]) => dbInstance!.run(sql, params),
    close: async () => dbInstance!.close(),
    metrics: () => ({ lastMin: { totalQueries: 0, avgDuration: 0, slowQueries: 0, byType: {}, byTable: {} } })
  }
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
  }
  if (pgPool) {
    await pgPool.end()
    pgPool = null
  }
}
