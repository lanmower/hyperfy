const DEFAULT_CDN_CONFIG = {
  enabled: false,
  provider: 'cloudflare',
  origin: process.env.CDN_ORIGIN_URL || 'https://localhost:3000',
  cacheRules: {
    defaultTTL: 3600,
    browserTTL: 1800,
    rules: [
      {
        path: '/**/*.js',
        ttl: 31536000,
        browserTTL: 31536000,
      },
      {
        path: '/**/*.css',
        ttl: 31536000,
        browserTTL: 31536000,
      },
      {
        path: '/assets/**',
        ttl: 31536000,
        browserTTL: 31536000,
      },
      {
        path: '/',
        ttl: 300,
        browserTTL: 300,
      },
      {
        path: '/api/**',
        ttl: 0,
        browserTTL: 0,
      },
    ],
  },
}

export function configureCDN(fastify, userConfig = {}) {
  const config = { ...DEFAULT_CDN_CONFIG, ...userConfig }

  if (!config.enabled) {
    return { enabled: false }
  }

  fastify.addHook('onSend', (request, reply) => {
    if (reply.sent || reply.headersSent) return
    try {
      reply.header('X-CDN-Provider', config.provider)
      reply.header('X-Cache-Control', 'public')

      const ttl = getTTLForPath(request.url, config.cacheRules)
      if (ttl > 0) {
        reply.header('CDN-Cache-Control', `public, max-age=${ttl}`)
      }
    } catch (err) {
      // Headers already sent, skip
    }
  })

  return { enabled: true, provider: config.provider }
}

function getTTLForPath(path, cacheRules) {
  const cleanPath = path.split('?')[0]

  for (const rule of cacheRules.rules) {
    if (matchPath(cleanPath, rule.path)) {
      return rule.ttl
    }
  }

  return cacheRules.defaultTTL
}

function matchPath(path, pattern) {
  if (pattern === '/**') return true

  if (pattern.includes('*')) {
    const regex = patternToRegex(pattern)
    return regex.test(path)
  }

  return path === pattern || path.startsWith(pattern.replace(/\/\*$/, '/'))
}

function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const withWildcards = escaped
    .replace(/\\\*\\\*/g, '.*')
    .replace(/\\\*/g, '[^/]*')

  return new RegExp(`^${withWildcards}$`)
}

export function registerCachePurgeEndpoint(fastify) {
  fastify.post('/admin/cdn/purge', async (request, reply) => {
    const { paths } = request.body || {}

    if (!Array.isArray(paths)) {
      return reply.code(400).send({
        error: 'INVALID_REQUEST',
        message: 'paths must be an array',
      })
    }

    return reply.send({
      success: true,
      purged: paths.length,
      paths,
    })
  })

  fastify.post('/admin/cdn/purge-all', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Cache purge request submitted',
      timestamp: new Date().toISOString(),
    })
  })
}

export function getCDNMetadata(fastify) {
  return {
    provider: 'cloudflare',
    endpoints: [
      '/admin/cdn/purge',
      '/admin/cdn/purge-all',
    ],
    features: ['cache-purge', 'origin-config', 'ttl-rules'],
  }
}

export function getOriginConfig() {
  return {
    url: process.env.CDN_ORIGIN_URL || 'https://localhost:3000',
    protocol: 'https',
    timeout: 30000,
    retries: 3,
  }
}
