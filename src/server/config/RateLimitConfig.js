const whitelistedIPs = new Set([
  '127.0.0.1',
  '::1',
  'localhost',
])

const blacklistedIPs = new Set()

export const RATE_LIMIT_PRESETS = {
  upload: {
    max: 10,
    window: 60000,
    burst: 1.3,
    description: 'File upload rate limit',
  },
  admin: {
    max: 30,
    window: 60000,
    burst: 1.3,
    description: 'Admin command rate limit',
  },
  api: {
    max: 100,
    window: 60000,
    burst: 1.3,
    description: 'General API rate limit',
  },
  websocket: {
    max: 5,
    window: 60000,
    burst: 1.0,
    description: 'WebSocket connection rate limit',
  },
  health: {
    max: 60,
    window: 60000,
    burst: 1.5,
    description: 'Health check rate limit',
  },
}

export function isWhitelisted(ip) {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }
  return whitelistedIPs.has(ip)
}

export function isBlacklisted(ip) {
  return blacklistedIPs.has(ip)
}

export function addToWhitelist(ip) {
  whitelistedIPs.add(ip)
  return true
}

export function removeFromWhitelist(ip) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return false
  }
  return whitelistedIPs.delete(ip)
}

export function addToBlacklist(ip) {
  blacklistedIPs.add(ip)
  return true
}

export function removeFromBlacklist(ip) {
  return blacklistedIPs.delete(ip)
}

export function getWhitelist() {
  return Array.from(whitelistedIPs)
}

export function getBlacklist() {
  return Array.from(blacklistedIPs)
}

export function getRateLimitConfig(endpoint) {
  return RATE_LIMIT_PRESETS[endpoint] || RATE_LIMIT_PRESETS.api
}
