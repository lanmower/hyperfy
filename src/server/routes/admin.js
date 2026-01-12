import { registerAdminRateLimitRoutes } from './AdminRateLimitRoutes.js'
import { registerAdminCircuitBreakerRoutes } from './AdminCircuitBreakerRoutes.js'
import { registerAdminDegradationRoutes } from './AdminDegradationRoutes.js'
import { registerAdminCorsRoutes } from './AdminCorsRoutes.js'

export function registerAdminRoutes(fastify) {
  registerAdminRateLimitRoutes(fastify)
  registerAdminCircuitBreakerRoutes(fastify)
  registerAdminDegradationRoutes(fastify)
  registerAdminCorsRoutes(fastify)
}
