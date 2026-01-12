import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('Storage')

export class NodeStorage {
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
