import 'dotenv-flow/config'
import 'ses'
import '../core/lockdown'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

let __filename = fileURLToPath(import.meta.url)
if (__filename.startsWith('/') && __filename[2] === ':') {
  __filename = __filename.slice(1)
}
const __dirname = path.dirname(__filename)
import Fastify from 'fastify'
import ws from '@fastify/websocket'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import multipart from '@fastify/multipart'

import { World } from '../core/World.js'
import { getDB } from './db.js'
import { Storage } from './Storage.js'
import { initCollections } from './collections.js'
import { registerErrorRoutes } from './routes/ErrorRoutes.js'
import { registerUploadRoutes } from './routes/UploadRoutes.js'
import { registerStatusRoutes } from './routes/StatusRoutes.js'

const rootDir = path.join(__dirname, '../')
const worldDir = path.join(rootDir, process.env.WORLD || 'world')
const assetsDir = path.join(worldDir, '/assets')
const collectionsDir = path.join(worldDir, '/collections')
const port = process.env.PORT || 3000

await fs.ensureDir(worldDir)
await fs.ensureDir(assetsDir)
await fs.ensureDir(collectionsDir)

await fs.copy(path.join(rootDir, 'src/world/assets'), path.join(assetsDir))
await fs.copy(path.join(rootDir, 'src/world/collections'), path.join(collectionsDir))

let world
try {
  const collections = await initCollections({ collectionsDir, assetsDir })

  const { importApp } = await import('../core/extras/appTools.js')
  const sceneHypPath = path.join(rootDir, 'src/world/scene.hyp')
  if (fs.existsSync(sceneHypPath)) {
    const sceneHypBuffer = fs.readFileSync(sceneHypPath)
    const sceneHypFile = new File([sceneHypBuffer], 'scene.hyp', { type: 'application/octet-stream' })
    const sceneApp = await importApp(sceneHypFile)
    if (sceneApp.blueprint) {
      const sceneBlueprint = { ...sceneApp.blueprint, id: '$scene' }
      collections.push({
        id: 'scene',
        name: 'Scene',
        blueprints: [sceneBlueprint],
      })
      console.log('Scene blueprint loaded from scene.hyp')
    }
  }

  const db = await getDB(worldDir)

  const storage = new Storage(path.join(worldDir, '/storage.json'))

  world = new World()
  world.isServer = true
  world.assetsUrl = process.env.PUBLIC_ASSETS_URL
  world.collections.deserialize(collections)

  const { ServerNetwork } = await import('../core/systems/ServerNetwork.js')
  const { ServerLiveKit } = await import('../core/systems/ServerLiveKit.js')
  world.register('network', ServerNetwork)
  world.register('livekit', ServerLiveKit)

  world.init({ db, storage, assetsDir })
} catch (err) {
  console.error('Server initialization failed:', err.message)
  process.exit(1)
}

const fastify = Fastify({ logger: { level: 'error' } })

async function worldNetwork(fastify) {
  fastify.get('/ws', { websocket: true }, (ws, req) => {
    console.log('[WS] Connection received')
    world.network.onConnection(ws, req.query)
  })
}

fastify.register(cors)
fastify.register(compress)
fastify.register(multipart, {
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
})
fastify.register(ws)
fastify.register(worldNetwork)

registerErrorRoutes(fastify, world)
registerUploadRoutes(fastify, assetsDir)
registerStatusRoutes(fastify, world)

fastify.get('/', async (req, reply) => {
  const title = world.settings.title || 'World'
  const desc = world.settings.desc || ''
  const image = world.resolveURL(world.settings.image?.url) || ''
  const url = process.env.PUBLIC_ASSETS_URL
  const filePath = path.join(__dirname, '../build/public', 'index.html')
  let html = fs.readFileSync(filePath, 'utf-8')

  const buildDir = path.join(__dirname, '../build/public')
  const files = fs.readdirSync(buildDir)
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
  root: path.join(__dirname, '../build/public'),
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
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString()) // older browsers
  },
})

const publicEnvs = {}
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    const value = process.env[key]
    publicEnvs[key] = value
  }
}
const envsCode = `
  if (!globalThis.env) globalThis.env = {}
  globalThis.env = ${JSON.stringify(publicEnvs)}
`
fastify.get('/env.js', async (req, reply) => {
  reply.type('application/javascript').send(envsCode)
})

fastify.setErrorHandler((err, req, reply) => {
  console.error(err)
  reply.status(500).send()
})

async function startServer(retries = 10) {
  try {
    await fastify.listen({ port, host: '0.0.0.0', exclusive: false })
    console.log(`running on port ${port}`)
  } catch (err) {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return startServer(retries - 1)
    }
    console.error(`failed to launch on port ${port}:`, err.message)
    process.exit(1)
  }
}

await startServer()

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`)
  try {
    if (fastify.server) {
      fastify.server.close()
    }
    await fastify.close()
  } catch (err) {
    console.error('Error during shutdown:', err.message)
  }
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
