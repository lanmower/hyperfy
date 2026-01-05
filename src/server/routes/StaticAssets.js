import statics from '@fastify/static'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import * as Babel from '@babel/standalone'
import { generateETag } from '../performance/CachingStrategy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../../..')
const srcDir = path.join(rootDir, 'src')
const clientDir = path.join(srcDir, 'client')
const publicDir = path.join(clientDir, 'public')

async function transformCode(code, filepath) {
  if (!filepath.endsWith('.js')) return code
  if (typeof code !== 'string') return code
  if (filepath.includes('node_modules')) return code

  try {
    const result = Babel.transform(code, {
      presets: ['react'],
      filename: filepath,
      babelrc: false
    })
    return result.code
  } catch (err) {
    console.error(`[JSX Transform Error] ${filepath}:`, err.message)
    return code
  }
}

export async function registerStaticAssets(fastify, buildDir, assetsDir, world) {
  fastify.get('/', async (req, reply) => {
    try {
      const buildId = Date.now().toString()
      const particlesPath = '/particles'
      let html = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8')
      html = html
        .replaceAll('{title}', 'Hyperfy')
        .replaceAll('{desc}', 'Hyperfy Virtual Worlds')
        .replaceAll('{url}', `${req.protocol}://${req.headers.host}`)
        .replaceAll('{image}', `${req.protocol}://${req.headers.host}/public/favicon.svg`)
        .replaceAll('{buildId}', buildId)
        .replaceAll('{particlesPath}', particlesPath)
      return reply.type('text/html').send(html)
    } catch (err) {
      fastify.logger.error(`Failed to serve index.html: ${err.message}`)
      return reply.code(500).send('Server error')
    }
  })

  // Serve src/client files directly (buildless)
  fastify.get('/src/client/*', async (req, reply) => {
    const filepath = path.join(clientDir, req.params['*'])
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Serve src/core files directly (buildless)
  fastify.get('/src/core/*', async (req, reply) => {
    const filepath = path.join(srcDir, 'core', req.params['*'])
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Serve node_modules files directly (buildless)
  fastify.get('/node_modules/*', async (req, reply) => {
    const filepath = path.join(rootDir, 'node_modules', req.params['*'])
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      return reply.type('application/javascript').send(transformed)
    } catch (err) {
      return reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Stub handler for server-only files accessed from client (returns empty export)
  fastify.get('/src/server/*', async (req, reply) => {
    return reply.type('application/javascript').send('export const SecurityConfig = {}; export default {};')
  })

  // Serve /assets/* static files
  await fastify.register(statics, {
    root: assetsDir,
    prefix: '/assets/',
    decorateReply: false,
    setHeaders: res => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString())
    },
  })

  // Serve public/*.* static files (CSS, JS, images, etc) but only specific extensions
  await fastify.register(statics, {
    root: publicDir,
    prefix: '/public/',
    decorateReply: false,
    setHeaders: res => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    },
  })
}

export function registerEnvEndpoint(fastify) {
  fastify.get('/env.js', async (req, reply) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const wsProtocol = protocol === 'https' ? 'wss' : 'ws'
    const wsUrl = process.env.PUBLIC_WS_URL || `${wsProtocol}://${host}`

    const publicEnvs = { PUBLIC_WS_URL: wsUrl }
    for (const key in process.env) {
      if (key.startsWith('PUBLIC_')) {
        publicEnvs[key] = process.env[key]
      }
    }

    const envsCode = `window.env = ${JSON.stringify(publicEnvs)};`
    return reply.type('application/javascript').send(envsCode)
  })
}
