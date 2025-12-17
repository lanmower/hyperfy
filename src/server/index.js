import 'ses'
import '../core/lockdown'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { pipeline } from 'stream/promises'
import Fastify from 'fastify'
import ws from '@fastify/websocket'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import multipart from '@fastify/multipart'

import { createServerWorld } from '../core/createServerWorld.js'
import { hashFile } from '../core/utils.js'
import { getDB } from './db.js'
import { Storage } from './Storage.js'
import { initCollections } from './collections.js'

const rootDir = path.join(__dirname, '../')
const worldDir = path.join(rootDir, process.env.WORLD)
const assetsDir = path.join(worldDir, '/assets')
const collectionsDir = path.join(worldDir, '/collections')
const port = process.env.PORT

await fs.ensureDir(worldDir)
await fs.ensureDir(assetsDir)
await fs.ensureDir(collectionsDir)

await fs.copy(path.join(rootDir, 'src/world/assets'), path.join(assetsDir))
await fs.copy(path.join(rootDir, 'src/world/collections'), path.join(collectionsDir))

const collections = await initCollections({ collectionsDir, assetsDir })

const db = await getDB(worldDir)

const storage = new Storage(path.join(worldDir, '/storage.json'))

const world = await createServerWorld()
world.assetsUrl = process.env.PUBLIC_ASSETS_URL
world.collections.deserialize(collections)
world.init({ db, storage, assetsDir })

const fastify = Fastify({ logger: { level: 'error' } })

fastify.register(cors)
fastify.register(compress)
fastify.register(multipart, {
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
})
fastify.register(ws)
fastify.register(worldNetwork)
fastify.get('/', async (req, reply) => {
  const title = world.settings.title || 'World'
  const desc = world.settings.desc || ''
  const image = world.resolveURL(world.settings.image?.url) || ''
  const url = process.env.PUBLIC_ASSETS_URL
  const filePath = path.join(__dirname, 'public', 'index.html')
  let html = fs.readFileSync(filePath, 'utf-8')
  html = html.replaceAll('{url}', url)
  html = html.replaceAll('{title}', title)
  html = html.replaceAll('{desc}', desc)
  html = html.replaceAll('{image}', image)
  reply.type('text/html').send(html)
})
fastify.register(statics, {
  root: path.join(__dirname, 'public'),
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

fastify.post('/api/upload', async (req, reply) => {
  const file = await req.file()
  const ext = file.filename.split('.').pop().toLowerCase()
  const chunks = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  const hash = await hashFile(buffer)
  const filename = `${hash}.${ext}`
  const filePath = path.join(assetsDir, filename)
  const exists = await fs.exists(filePath)
  if (!exists) {
    await fs.writeFile(filePath, buffer)
  }
})

fastify.get('/api/upload-check', async (req, reply) => {
  const filename = req.query.filename
  const filePath = path.join(assetsDir, filename)
  const exists = await fs.exists(filePath)
  return { exists }
})

fastify.get('/health', async (request, reply) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    return reply.code(200).send(health)
  } catch (error) {
    console.error('Health check failed:', error)
    return reply.code(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.get('/status', async (request, reply) => {
  try {
    const status = {
      uptime: Math.round(world.time),
      protected: process.env.ADMIN_CODE !== undefined ? true : false,
      connectedUsers: [],
      commitHash: process.env.COMMIT_HASH,
    }
    for (const socket of world.network.sockets.values()) {
      status.connectedUsers.push({
        id: socket.player.data.userId,
        position: socket.player.position.value.toArray(),
        name: socket.player.data.name,
      })
    }

    return reply.code(200).send(status)
  } catch (error) {
    console.error('Status failed:', error)
    return reply.code(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.get('/api/errors', async (request, reply) => {
  try {
    const { limit, type, since, side, critical } = request.query
    const options = {}
    if (limit) options.limit = parseInt(limit)
    if (type) options.type = type
    if (since) options.since = since
    if (side) options.side = side
    if (critical !== undefined) options.critical = critical === 'true'

    if (!world.errorMonitor) {
      return reply.code(503).send({ error: 'Error monitoring not available' })
    }

    const errors = world.errorMonitor.getErrors(options)
    const stats = world.errorMonitor.getStats()

    return reply.code(200).send({
      errors,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error endpoint failed:', error)
    return reply.code(500).send({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.post('/api/errors/clear', async (request, reply) => {
  try {
    if (!world.errorMonitor) {
      return reply.code(503).send({ error: 'Error monitoring not available' })
    }

    const count = world.errorMonitor.clearErrors()
    
    return reply.code(200).send({
      cleared: count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clear endpoint failed:', error)
    return reply.code(500).send({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.get('/api/errors/stream', { websocket: true }, (ws, req) => {
  if (!world.errorMonitor) {
    ws.close(1011, 'Error monitoring not available')
    return
  }

  const cleanup = world.errorMonitor.addListener((event, data) => {
    try {
      ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }))
    } catch (err) {
    }
  })

  ws.on('close', cleanup)
  ws.on('error', cleanup)

  try {
    ws.send(JSON.stringify({
      event: 'connected',
      data: {
        stats: world.errorMonitor.getStats(),
        recentErrors: world.errorMonitor.getErrors({ limit: 10 })
      },
      timestamp: new Date().toISOString()
    }))
  } catch (err) {
    cleanup()
  }
})

fastify.setErrorHandler((err, req, reply) => {
  console.error(err)
  reply.status(500).send()
})

try {
  await fastify.listen({ port, host: '0.0.0.0' })
} catch (err) {
  console.error(err)
  console.error(`failed to launch on port ${port}`)
  process.exit(1)
}

async function worldNetwork(fastify) {
  fastify.get('/ws', { websocket: true }, (ws, req) => {
    console.log('[WS] Connection received')
    world.network.onConnection(ws, req.query)
  })
}

console.log(`running on port ${port}`)

process.on('SIGINT', async () => {
  await fastify.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})
