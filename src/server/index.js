import Fastify from 'fastify'
import { createServerWorld } from '../core/createServerWorld.js'

const port = process.env.PORT || 3000
const fastify = Fastify({ logger: true })

try {
  const world = createServerWorld()
  console.log('Physics world initialized')
  console.log('Available systems:', Object.keys(world.systems || {}))
  
  fastify.get('/', (request, reply) => {
    return { status: 'Physics engine running' }
  })

  await fastify.listen({ port, host: '0.0.0.0' })
  console.log()
} catch (err) {
  console.error('Server startup failed:', err.message)
  process.exit(1)
}
