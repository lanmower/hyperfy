const REQUIRED_VARS = ['JWT_SECRET']

const OPTIONAL_VARS = {
  PORT: { default: '3000', type: 'number' },
  NODE_ENV: { default: 'development', type: 'string' },
  WORLD: { default: 'world', type: 'string' },
  SAVE_INTERVAL: { default: '60', type: 'number' },
  DB_URI: { default: 'local', type: 'string' },
  PUBLIC_PLAYER_COLLISION: { default: 'false', type: 'boolean' },
  PUBLIC_MAX_UPLOAD_SIZE: { default: '12', type: 'number' },
  PUBLIC_WS_URL: { default: 'ws://localhost:3000/ws', type: 'string' },
  PUBLIC_API_URL: { default: 'http://localhost:3000/api', type: 'string' },
  PUBLIC_ASSETS_URL: { default: 'http://localhost:3000/assets', type: 'string' },
  ASSETS: { default: 'local', type: 'string' },
  ASSETS_BASE_URL: { default: '/assets', type: 'string' },
  AI_PROVIDER: { default: 'none', type: 'string' },
  AI_MODEL: { default: 'gpt-4', type: 'string' },
  ADMIN_CODE: { default: '', type: 'string' },
  LOG_LEVEL: { default: 'info', type: 'string' },
  TELEMETRY_ENABLED: { default: 'false', type: 'boolean' },
  HTTP_TIMEOUT: { default: '30000', type: 'number' },
  WS_TIMEOUT: { default: '30000', type: 'number' },
  UPLOAD_TIMEOUT: { default: '120000', type: 'number' },
  DB_TIMEOUT: { default: '30000', type: 'number' },
  SHUTDOWN_TIMEOUT: { default: '30000', type: 'number' },
  TRUST_PROXY_HOPS: { default: '1', type: 'number' },
  LIVEKIT_WS_URL: { default: '', type: 'string' },
  LIVEKIT_API_KEY: { default: '', type: 'string' },
  LIVEKIT_API_SECRET: { default: '', type: 'string' },
}

function castValue(value, type) {
  if (type === 'number') {
    const num = parseInt(value, 10)
    if (isNaN(num)) throw new Error(`Invalid number: ${value}`)
    return num
  }
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  return String(value)
}

export function validateEnvironment() {
  const missing = REQUIRED_VARS.filter(name => !process.env[name])
  if (missing.length > 0) {
    console.error(`\nMissing required environment variables:\n  ${missing.join('\n  ')}\n`)
    process.exit(1)
  }

  const validated = {}
  for (const [name, config] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[name] ?? config.default
    validated[name] = castValue(value, config.type)
  }

  return validated
}
