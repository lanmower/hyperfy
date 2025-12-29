import { ComponentLogger } from './utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Storage')

class LocalStorage {
  get(key, defaultValue = null) {
    const data = localStorage.getItem(key)
    if (data === undefined) return defaultValue
    let value
    try {
      value = JSON.parse(data)
    } catch (err) {
      logger.error('Failed to read storage key', { key, error: err.message })
      value = null
    }
    if (value === undefined) return defaultValue
    return value || defaultValue
  }

  set(key, value) {
    if (value === undefined || value === null) {
      localStorage.removeItem(key)
    } else {
      const data = JSON.stringify(value)
      localStorage.setItem(key, data)
    }
  }

  remove(key) {
    localStorage.removeItem(key)
  }
}

class NodeStorage {
  constructor() {
    this.fs = null
    this.path = null
    this.fileURLToPath = null
    this.file = null
    this.data = {}
    this.ready = false
  }

  async init() {
    if (this.ready) return
    this.fs = await import('fs')
    this.path = await import('path')
    const urlMod = await import('url')
    this.fileURLToPath = urlMod.fileURLToPath
    const dirname = this.path.dirname(this.fileURLToPath(import.meta.url))
    const rootDir = this.path.join(dirname, '../')
    this.file = this.path.join(rootDir, 'localstorage.json')
    try {
      const data = this.fs.readFileSync(this.file, 'utf8')
      this.data = JSON.parse(data)
    } catch (err) {
      this.data = {}
    }
    this.ready = true
  }

  save() {
    if (!this.ready || !this.fs) return
    try {
      this.fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (err) {
      logger.error('Failed to write storage file', { file: this.file, error: err.message })
    }
  }

  get(key, defaultValue = null) {
    const value = this.data[key]
    if (value === undefined) return defaultValue
    return value || defaultValue
  }

  set(key, value) {
    if (value === undefined || value === null) {
      delete this.data[key]
    } else {
      this.data[key] = value
    }
    this.save()
  }

  remove(key) {
    delete this.data[key]
    this.save()
  }
}

const isBrowser = typeof window !== 'undefined'
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

let storage

if (isBrowser) {
  storage = new LocalStorage()
} else if (isNode) {
  storage = new NodeStorage()
} else {
  throw new Error('No storage implementation available for current environment')
}

export { storage }

export async function initStorage() {
  if (storage instanceof NodeStorage) {
    await storage.init()
  }
}
