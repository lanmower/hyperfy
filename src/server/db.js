// Database initialization and direct SQL.js wrapper
import initSqlJs from 'sql.js'

let db
let SQL

export async function initDatabase() {
  SQL = await initSqlJs()
  db = new SQL.Database()

  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      createdAt INTEGER
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
  `)

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_blueprints_id ON blueprints(id)',
    'CREATE INDEX IF NOT EXISTS idx_blueprints_created ON blueprints(createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_entities_id ON entities(id)',
    'CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_users_id ON users(id)',
    'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
    'CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash)',
    'CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader)',
    'CREATE INDEX IF NOT EXISTS idx_files_timestamp ON files(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_config_key ON config(key)',
  ]

  for (const idx of indexes) {
    try {
      db.run(idx)
    } catch (e) {
    }
  }

  return db
}

export function query(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function exec(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  stmt.free()
}

export function insert(table, data) {
  const keys = Object.keys(data)
  const values = keys.map(k => data[k])
  const placeholders = keys.map(() => '?').join(',')
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`
  exec(sql, values)
}

export function getDatabase() {
  return db
}

export async function getDB(worldDir) {
  if (!db) {
    await initDatabase()

    const configExists = query(`SELECT name FROM sqlite_master WHERE type='table' AND name='config'`).length
    if (!configExists) {
      exec(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`)
      insert('config', { key: 'version', value: '0' })
    }

    const result = query(`SELECT * FROM config WHERE key = 'settings'`)
    if (!result.length) {
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
      insert('config', { key: 'settings', value: JSON.stringify(defaultSettings) })
    }
  }

  return {
    insert,
    query,
    exec,
    metrics: () => ({ lastMin: { totalQueries: 0, avgDuration: 0, slowQueries: 0, byType: {}, byTable: {} } })
  }
}
