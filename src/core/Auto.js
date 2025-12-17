
import fs from 'fs-extra'
import path from 'path'

export class Auto {
  static async discover(dirPath, pattern = /\.js$/) {
    const modules = {}
    const files = await fs.readdir(dirPath)

    for (const file of files) {
      if (!pattern.test(file)) continue
      const name = file.replace('.js', '')
      const fullPath = path.join(dirPath, file)
      try {
        const module = await import(`file://${fullPath}`)
        modules[name] = module.default || module
      } catch (err) {
        console.warn(`Failed to load module ${name}: ${err.message}`)
      }
    }
    return modules
  }

  static map(modules, prefix = '') {
    const mapped = {}
    for (const [name, module] of Object.entries(modules)) {
      const key = prefix ? name.replace(new RegExp(`^${prefix}`), '') : name
      mapped[key] = module
    }
    return mapped
  }

  static register(target, modules, registerer = null) {
    for (const [key, module] of Object.entries(modules)) {
      if (registerer) {
        registerer(key, module)
      } else if (typeof target[key] === 'function') {
        target[key](module)
      } else if (typeof module === 'function') {
        target[key] = module
      }
    }
  }

  static env(key, type = 'string', fallback = null) {
    const value = process.env[key]
    if (value === undefined) return fallback

    switch (type) {
      case 'number': return parseInt(value, 10)
      case 'boolean': return value === 'true' || value === '1'
      case 'json': return JSON.parse(value)
      default: return value
    }
  }

  static envFiltered(prefix) {
    const filtered = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        filtered[key] = value
      }
    }
    return filtered
  }
}
