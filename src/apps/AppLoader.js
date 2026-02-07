import { readdir, readFile, watch, access } from 'node:fs/promises'
import { join, basename, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const BLOCKED_PATTERNS = [
  'process.exit', 'child_process', 'require(', '__proto__',
  'Object.prototype', 'globalThis', 'eval(', 'import('
]

export class AppLoader {
  constructor(runtime, config = {}) {
    this._runtime = runtime
    this._dir = config.dir || './apps'
    this._watchers = new Map()
    this._loaded = new Map()
    this._onReloadCallback = null
  }

  async _resolvePath(name) {
    const flat = join(this._dir, `${name}.js`)
    try { await access(flat); return flat } catch {}
    const folder = join(this._dir, name, 'index.js')
    try { await access(folder); return folder } catch {}
    return null
  }

  async loadAll() {
    const entries = await readdir(this._dir, { withFileTypes: true }).catch(() => [])
    const results = []
    for (const entry of entries) {
      let name = null
      if (entry.isFile() && entry.name.endsWith('.js')) {
        name = basename(entry.name, extname(entry.name))
      } else if (entry.isDirectory()) {
        try { await access(join(this._dir, entry.name, 'index.js')); name = entry.name } catch {}
      }
      if (name) {
        const loaded = await this.loadApp(name)
        if (loaded) results.push(name)
      }
    }
    return results
  }

  async loadApp(name) {
    const filePath = await this._resolvePath(name)
    if (!filePath) return null
    try {
      const source = await readFile(filePath, 'utf-8')
      if (!this._validate(source, name)) return null
      const appDef = await this._evaluate(source, filePath)
      if (!appDef) return null
      this._runtime.registerApp(name, appDef)
      this._loaded.set(name, { filePath, source, clientCode: source })
      return appDef
    } catch (e) {
      console.error(`[AppLoader] failed to load ${name}:`, e.message)
      return null
    }
  }

  _validate(source, name) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (source.includes(pattern)) {
        console.error(`[AppLoader] blocked pattern "${pattern}" in ${name}`)
        return false
      }
    }
    return true
  }

  async _evaluate(source, filePath) {
    try {
      const absPath = resolve(filePath)
      const url = pathToFileURL(absPath).href + `?t=${Date.now()}`
      const mod = await import(url)
      return mod.default || mod
    } catch (e) {
      console.error(`[AppLoader] eval error:`, e.message)
      return null
    }
  }

  async watchAll() {
    try {
      const ac = new AbortController()
      const watcher = watch(this._dir, { recursive: true, signal: ac.signal })
      this._watchers.set('__dir__', ac)
      ;(async () => {
        try {
          for await (const event of watcher) {
            if (!event.filename || !event.filename.endsWith('.js')) continue
            const parts = event.filename.replace(/\\/g, '/').split('/')
            const name = parts.length > 1
              ? parts[0]
              : basename(event.filename, extname(event.filename))
            await this._onFileChange(name)
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error(`[AppLoader] watch error:`, e.message)
          }
        }
      })()
    } catch (e) {
      console.error(`[AppLoader] watchAll error:`, e.message)
    }
  }

  async _onFileChange(name) {
    console.log(`[AppLoader] reloading ${name}`)
    const appDef = await this.loadApp(name)
    if (appDef) {
      this._runtime.hotReload(name, appDef)
      if (this._onReloadCallback) {
        this._onReloadCallback(name, this._loaded.get(name)?.clientCode)
      }
      console.log(`[AppLoader] hot reloaded ${name}`)
    }
  }

  stopWatching() {
    for (const ac of this._watchers.values()) {
      ac.abort()
    }
    this._watchers.clear()
  }

  getLoaded() {
    return Array.from(this._loaded.keys())
  }

  getClientModules() {
    const modules = {}
    for (const [name, data] of this._loaded) {
      if (data.clientCode) modules[name] = data.clientCode
    }
    return modules
  }

  getClientModule(name) {
    return this._loaded.get(name)?.clientCode || null
  }

  async loadFromString(name, source) {
    if (!this._validate(source, name)) return null
    try {
      const fn = new Function('exports', source + '\nreturn exports;')
      const exports = {}
      const result = fn(exports)
      const appDef = result.default || result
      this._runtime.registerApp(name, appDef)
      this._loaded.set(name, { source, filePath: null })
      return appDef
    } catch (e) {
      console.error(`[AppLoader] string eval error:`, e.message)
      return null
    }
  }
}
