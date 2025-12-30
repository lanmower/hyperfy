import statics from '@fastify/static'
import fs from 'fs-extra'
import path from 'path'

export function registerStaticAssets(fastify, buildDir, assetsDir, world) {
  fastify.get('/', async (req, reply) => {
    const title = world.settings.title || 'World'
    const desc = world.settings.desc || ''
    const image = world.resolveURL(world.settings.image?.url) || ''
    const url = process.env.PUBLIC_ASSETS_URL
    const filePath = path.join(buildDir, '../build/public', 'index.html')
    let html = fs.readFileSync(filePath, 'utf-8')

    const publicDir = path.join(buildDir, '../build/public')
    const files = fs.readdirSync(publicDir)
    const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'))
    const particlesFile = files.find(f => f.startsWith('particles-') && f.endsWith('.js'))

    html = html.replace('{jsPath}', jsFile ? '/' + jsFile : '/index.js')
    html = html.replace('{particlesPath}', particlesFile ? '/' + particlesFile : '/particles.js')
    html = html.replaceAll('{buildId}', Date.now())
    html = html.replaceAll('{url}', url)
    html = html.replaceAll('{title}', title)
    html = html.replaceAll('{desc}', desc)
    html = html.replaceAll('{image}', image)
    reply.type('text/html').send(html)
  })

  fastify.register(statics, {
    root: path.join(buildDir, '../build/public'),
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
