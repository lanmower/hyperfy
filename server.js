import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from './src/sdk/server.js'
import worldDef from './apps/world.js'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '8080', 10)

console.log('[init] Creating server...')
const server = await createServer({
  port: PORT,
  tickRate: 128,
  appsDir: join(ROOT, 'apps'),
  staticDirs: [
    { prefix: '/src/', dir: join(ROOT, 'src') },
    { prefix: '/world/', dir: join(ROOT, 'world') },
    { prefix: '/', dir: join(ROOT, 'client') }
  ]
})
console.log('[init] Server created, loading world...')

console.log('[init] Loading world definition...')
await server.loadWorld(worldDef)
console.log('[init] World loaded with', server.getEntityCount(), 'entities')

server.on('playerJoin', ({ id }) => console.log(`[+] player ${id}`))
server.on('playerLeave', ({ id }) => console.log(`[-] player ${id}`))

console.log('[init] Calling server.start()...')
const { port, tickRate } = await server.start()
console.log(`[server] http://localhost:${port} @ ${tickRate} TPS`)

// Keep process alive
setInterval(() => {}, 1000)
