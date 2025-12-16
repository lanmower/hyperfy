// Configuration system - centralized config management

export class Config {
  constructor(env = process.env) {
    this.env = env
    this.cache = new Map()
    this.defaults = new Map()
  }

  set(key, value, type = 'string') {
    this.defaults.set(key, { value, type })
    this.cache.delete(key) // Clear cache when setting
    return this
  }

  get(key, defaultValue = null) {
    if (this.cache.has(key)) return this.cache.get(key)

    const config = this.defaults.get(key)
    let value = this.env[key]

    if (value === undefined) {
      value = config?.value ?? defaultValue
    } else if (config?.type) {
      value = this.#convert(value, config.type)
    }

    this.cache.set(key, value)
    return value
  }

  all() {
    const result = {}
    for (const key of this.defaults.keys()) {
      result[key] = this.get(key)
    }
    return result
  }

  has(key) {
    return key in this.env || this.defaults.has(key)
  }

  applyPreset(preset) {
    for (const [key, value] of Object.entries(preset)) {
      this.env[key] = value
      this.cache.delete(key)
    }
    return this
  }

  #convert(value, type) {
    switch (type) {
      case 'number': return Number(value)
      case 'boolean': return value === 'true' || value === '1'
      case 'json': return JSON.parse(value)
      default: return value
    }
  }

  toString() {
    return `Config(${this.defaults.size} keys)`
  }
}

export const config = new Config()

// Environment presets
export const presets = {
  development: {
    NODE_ENV: 'development',
    DEBUG: 'true',
    PORT: '3000',
    SAVE_INTERVAL: '30',
    JWT_SECRET: 'dev-secret-change-in-production',
  },
  production: {
    NODE_ENV: 'production',
    DEBUG: 'false',
    PORT: '80',
    SAVE_INTERVAL: '60',
  },
  testing: {
    NODE_ENV: 'test',
    DEBUG: 'true',
    PORT: '3001',
    SAVE_INTERVAL: '5',
  },
}

// Server configuration setup
export function setupServerConfig(env = process.env.NODE_ENV || 'development') {
  // Apply preset first
  config.applyPreset(presets[env] || presets.development)

  // Define all server configuration keys
  config.set('PORT', 3000, 'number')
  config.set('NODE_ENV', 'development')
  config.set('WORLD', './world')
  config.set('SAVE_INTERVAL', 60, 'number')
  config.set('PING_RATE', 1, 'number')
  config.set('ADMIN_CODE', null)
  config.set('PUBLIC_ASSETS_URL', '')
  config.set('PUBLIC_API_URL', '')
  config.set('PUBLIC_MAX_UPLOAD_SIZE', 52428800, 'number')
  config.set('JWT_SECRET', 'change-me-in-production')
  config.set('LIVEKIT_WS_URL', '')
  config.set('LIVEKIT_API_KEY', '')
  config.set('LIVEKIT_API_SECRET', '')
  config.set('DEBUG', false, 'boolean')

  return config
}

// Client configuration setup
export function setupClientConfig(env = process.env.NODE_ENV || 'development') {
  // Apply preset first
  config.applyPreset(presets[env] || presets.development)

  // Define all client configuration keys
  config.set('NODE_ENV', 'development')
  config.set('DEBUG', false, 'boolean')
  config.set('PUBLIC_ASSETS_URL', '')
  config.set('PUBLIC_API_URL', '')
  config.set('LIVEKIT_WS_URL', '')

  return config
}
