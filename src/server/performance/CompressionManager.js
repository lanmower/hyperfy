import compress from '@fastify/compress'

const COMPRESSION_CONFIG = {
  threshold: 1024,
  level: 6,
  exclude: /\.(jpg|jpeg|png|gif|woff|woff2|ttf|otf|eot|svg|webp|mp4|webm)$/i,
}

const CONTENT_TYPE_LEVELS = {
  'text/html': 9,
  'text/plain': 9,
  'text/css': 9,
  'application/javascript': 9,
  'application/json': 8,
  'text/xml': 8,
  'application/xml': 8,
  'text/javascript': 9,
  'application/x-javascript': 9,
}

export async function setupCompression(fastify, options = {}) {
  const config = { ...COMPRESSION_CONFIG, ...options }

  const getCompressionLevel = (contentType = '') => {
    for (const [type, level] of Object.entries(CONTENT_TYPE_LEVELS)) {
      if (contentType.includes(type)) {
        return level
      }
    }
    return config.level
  }

  await fastify.register(compress, {
    threshold: config.threshold,
    encodings: ['gzip', 'deflate'],
    customEncodings: [],
    exclude: config.exclude,
    zlib: {
      level: 6,
    },
    brotliOptions: {
      params: {
        [11]: 24,
        [12]: 22,
      },
    },
    onUnsupportedEncoding: (encoding) => {
      return 'gzip'
    },
  })

  fastify.addHook('onSend', async (request, reply) => {
    const contentType = reply.getHeader('content-type') || ''
    const level = getCompressionLevel(contentType)

    if (level !== config.level && reply.getHeader('content-encoding') === 'gzip') {
      reply.header('X-Compression-Level', level.toString())
    }
  })
}

export function getCompressionStats(fastify) {
  return {
    enabled: true,
    threshold: COMPRESSION_CONFIG.threshold,
    defaultLevel: COMPRESSION_CONFIG.level,
    supportedEncodings: ['gzip', 'deflate'],
    excludePattern: COMPRESSION_CONFIG.exclude.toString(),
  }
}
