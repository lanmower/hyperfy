import crypto from 'crypto'

const CACHE_STRATEGIES = {
  static: {
    maxAge: 31536000,
    immutable: true,
    public: true,
  },
  html: {
    maxAge: 300,
    revalidate: true,
    public: false,
  },
  api: {
    maxAge: 0,
    noCache: true,
    noStore: true,
  },
  media: {
    maxAge: 86400,
    immutable: true,
    public: true,
  },
}

export function setupCacheHeaders(fastify) {
  fastify.addHook('onSend', (request, reply, payload) => {
    if (reply.sent || reply.headersSent) return payload
    const path = request.url.split('?')[0]
    const strategy = getCacheStrategy(path)

    if (strategy) {
      try {
        applyCacheHeaders(reply, strategy)
      } catch (err) {
        // Headers already sent, skip
      }
    }
    return payload
  })
}

function getCacheStrategy(path) {
  if (path.match(/\.(js|css|woff2?|ttf|otf|eot)$/i) || path.startsWith('/assets/')) {
    return CACHE_STRATEGIES.static
  }

  if (path === '/' || path.match(/\.html?$/i)) {
    return CACHE_STRATEGIES.html
  }

  if (path.startsWith('/api/') || path.startsWith('/health') || path.startsWith('/metrics')) {
    return CACHE_STRATEGIES.api
  }

  if (path.match(/\.(jpg|jpeg|png|gif|svg|webp|mp4|webm|ogg|mp3|wav)$/i)) {
    return CACHE_STRATEGIES.media
  }

  return null
}

function applyCacheHeaders(reply, strategy) {
  if (strategy.noCache) {
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    reply.header('Pragma', 'no-cache')
    reply.header('Expires', '0')
    return
  }

  let cacheControl = strategy.public ? 'public' : 'private'

  if (strategy.maxAge > 0) {
    cacheControl += `, max-age=${strategy.maxAge}`
  }

  if (strategy.immutable) {
    cacheControl += ', immutable'
  }

  if (strategy.revalidate) {
    cacheControl += ', must-revalidate'
  }

  reply.header('Cache-Control', cacheControl)

  if (strategy.maxAge > 0) {
    const expiresDate = new Date(Date.now() + strategy.maxAge * 1000).toUTCString()
    reply.header('Expires', expiresDate)
  }
}

export function generateETag(content) {
  if (!content) return undefined

  const hash = crypto.createHash('sha256')
  if (typeof content === 'string') {
    hash.update(content)
  } else if (Buffer.isBuffer(content)) {
    hash.update(content)
  } else {
    hash.update(JSON.stringify(content))
  }

  return `"${hash.digest('hex').slice(0, 16)}"`
}

export function addETagSupport(fastify) {
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (reply.sent || reply.headersSent) return payload

    const contentType = reply.getHeader('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return payload
    }

    const etag = generateETag(payload)
    if (etag && !reply.headersSent) {
      try {
        reply.header('ETag', etag)
      } catch (err) {
        return payload
      }
    }

    return payload
  })
}

export function getCacheStats() {
  return {
    strategies: Object.keys(CACHE_STRATEGIES),
    staticMaxAge: CACHE_STRATEGIES.static.maxAge,
    htmlMaxAge: CACHE_STRATEGIES.html.maxAge,
    mediaMaxAge: CACHE_STRATEGIES.media.maxAge,
  }
}
