import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from './src/sdk/server.js'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3000', 10)

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

server.physics.addStaticTrimesh(join(ROOT, 'world', 'schwust.glb'), 0)

server.on('playerJoin', ({ id }) => console.log(`[+] player ${id}`))
server.on('playerLeave', ({ id }) => console.log(`[-] player ${id}`))

const { port, tickRate } = await server.start()
console.log(`[server] http://localhost:${port} @ ${tickRate} TPS`)
