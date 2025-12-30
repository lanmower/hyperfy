import { registerUploadRoutes } from './upload.js'
import { registerStatusAPI, registerStatusPageRoutes } from './health.js'
import { registerAdminRoutes } from './admin.js'

export function registerRoutes(fastify, world, assetsDir) {
  registerUploadRoutes(fastify, assetsDir)
  registerStatusAPI(fastify, world)
  registerStatusPageRoutes(fastify, fastify.statusPageData)
  registerAdminRoutes(fastify)
}
