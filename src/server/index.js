import http from 'http'
import { createServerWorld } from '../core/createServerWorld.js'

const port = process.env.PORT || 3000

try {
  const world = createServerWorld()
  console.log('Physics world initialized')
  console.log('Available systems:', Object.keys(world.systems || {}))

  const server = http.createServer((request, reply) => {
    if (request.url === '/' && request.method === 'GET') {
      reply.writeHead(200, { 'Content-Type': 'application/json' })
      reply.end(JSON.stringify({ status: 'Physics engine running' }))
    } else {
      reply.writeHead(404, { 'Content-Type': 'application/json' })
      reply.end(JSON.stringify({ error: 'Not found' }))
    }
  })

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`)
  })
} catch (err) {
  console.error('Server startup failed:', err.message)
  process.exit(1)
}
