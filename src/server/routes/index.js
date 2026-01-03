import { registerUploadRoutes } from './upload.js'
import { registerStatusAPI, registerStatusPageRoutes } from './health.js'
import { registerAdminRoutes } from './admin.js'
import { registerPerformanceRoutes } from './PerformanceRoutes.js'
import { registerCollectionsAPI } from './collections.js'

export async function registerRoutes(fastify, world, assetsDir) {
  await registerUploadRoutes(fastify, assetsDir)
  registerStatusAPI(fastify, world)
  registerStatusPageRoutes(fastify, fastify.statusPageData)
  registerAdminRoutes(fastify)
  registerPerformanceRoutes(fastify)
  registerCollectionsAPI(fastify, world)
}
