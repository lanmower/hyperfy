import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('Routes.Collections')

export function registerCollectionsAPI(fastify, world) {
  fastify.get('/api/collections', async (req, reply) => {
    try {
      const collections = Array.from(world.collections?.items?.values() || [])
      const response = collections.map(coll => ({
        id: coll.id,
        name: coll.name,
        blueprints: Array.isArray(coll.blueprints) ? coll.blueprints.map(bp => ({
          id: bp.id,
          name: bp.name,
          desc: bp.desc,
          src: bp.src,
        })) : [],
      }))

      reply.type('application/json')
      reply.header('Cache-Control', 'public, max-age=3600')
      reply.send(response)
    } catch (error) {
      logger.error('Collections API failed', { error: error.message })
      reply.status(500).send({ error: 'Failed to get collections' })
    }
  })
}
