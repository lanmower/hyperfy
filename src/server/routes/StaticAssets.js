import statics from '@fastify/static'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../../..')
const srcDir = path.join(rootDir, 'src')
const clientDir = path.join(srcDir, 'client')
const publicDir = path.join(clientDir, 'public')

async function transformCode(code, filepath) {
  // Basic JSX/ES module transformation for development
  if (filepath.endsWith('.jsx') || code.includes('jsx')) {
    // Client-side JSX will be transformed by @firebolt-dev/jsx at runtime
    return code
  }
  return code
}

export function registerStaticAssets(fastify, buildDir, assetsDir, world) {
  // Serve index.html
  fastify.get('/', async (req, reply) => {
    const title = world.settings.title || 'World'
    const desc = world.settings.desc || ''
    const image = world.resolveURL(world.settings.image?.url) || ''
    const url = process.env.PUBLIC_ASSETS_URL
    const filePath = path.join(publicDir, 'index.html')
    let html = fs.readFileSync(filePath, 'utf-8')

    html = html.replace('{jsPath}', '/src/client/index.js?t=' + Date.now())
    html = html.replace('{particlesPath}', '/src/client/particles.js?t=' + Date.now())
    html = html.replaceAll('{buildId}', Date.now())
    html = html.replaceAll('{url}', url)
    html = html.replaceAll('{title}', title)
    html = html.replaceAll('{desc}', desc)
    html = html.replaceAll('{image}', image)
    reply.type('text/html').send(html)
  })

  // Serve src/client files directly (buildless)
  fastify.get('/src/client/*', async (req, reply) => {
    const filepath = path.join(clientDir, req.params['*'])
    try {
      const code = await fs.readFile(filepath, 'utf-8')
      const transformed = await transformCode(code, filepath)
      reply.type('application/javascript').send(transformed)
    } catch (err) {
      reply.code(404).send(`Not found: ${req.params['*']}`)
    }
  })

  // Serve public assets
  fastify.register(statics, {
    root: publicDir,
    prefix: '/',
    decorateReply: false,
    setHeaders: res => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    },
  })

  fastify.register(statics, {
    root: assetsDir,
    prefix: '/assets/',
    decorateReply: false,
    setHeaders: res => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString())
    },
  })
}

export function registerEnvEndpoint(fastify) {
  const publicEnvs = {}
  for (const key in process.env) {
    if (key.startsWith('PUBLIC_')) {
      publicEnvs[key] = process.env[key]
    }
  }
  const envsCode = `
  if (!globalThis.env) globalThis.env = {}
  globalThis.env = ${JSON.stringify(publicEnvs)}
`
  fastify.get('/env.js', async (req, reply) => {
    reply.type('application/javascript').send(envsCode)
  })
}
