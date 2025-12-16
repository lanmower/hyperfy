// Zero-config automatic system - self-discovering and self-configuring

export class Auto {
  static async discover(path) {
    const modules = {}
    try {
      const files = await import.meta.glob?.(path, { eager: true })
      for (const [key, mod] of Object.entries(files || {})) {
        const name = key.split('/').pop().replace('.js', '')
        modules[name] = mod[Object.keys(mod)[0]]
      }
    } catch (err) {
      console.warn(`Auto discovery failed for ${path}:`, err.message)
    }
    return modules
  }

  static map(modules, prefix = '') {
    const map = {}
    for (const [name, Module] of Object.entries(modules)) {
      const key = prefix ? name.replace(prefix, '') : name
      const clean = key[0].toLowerCase() + key.slice(1)
      map[clean] = Module
    }
    return map
  }

  static async register(world, modules) {
    for (const [name, Module] of Object.entries(modules)) {
      world.register(name, Module)
    }
    return world
  }

  static defaults() {
    return {
      port: process.env.PORT || 3000,
      env: process.env.NODE_ENV || 'development',
      world: process.env.WORLD || './world',
      saveInterval: parseInt(process.env.SAVE_INTERVAL || '60'),
      pingRate: parseInt(process.env.PING_RATE || '1'),
    }
  }

  static env(key, type = 'string', fallback = null) {
    const val = process.env[key]
    if (val === undefined) return fallback
    switch (type) {
      case 'number': return Number(val)
      case 'boolean': return val === 'true' || val === '1'
      case 'json': return JSON.parse(val)
      default: return val
    }
  }

  static envAll(prefix = '') {
    const result = {}
    for (const [key, val] of Object.entries(process.env)) {
      if (prefix && !key.startsWith(prefix)) continue
      result[key] = val
    }
    return result
  }
}
