import { AdminRouteBuilder } from './AdminRouteBuilder.js'

export class BaseAdminRouteSet {
  constructor(path, endpoints = []) {
    this.path = path
    this.endpoints = endpoints
    this.builder = new AdminRouteBuilder(path)
  }

  register(fastify) {
    for (const endpoint of this.endpoints) {
      this.createEndpoint(fastify, endpoint)
    }
  }

  createEndpoint(fastify, endpoint) {
    const { method = 'get', route, handler, description } = endpoint
    const fullPath = `${this.path}${route}`

    switch (endpoint.type) {
      case 'stats':
        this.builder.createStatsRoute(fastify, fullPath, handler, description)
        break
      case 'get':
        this.builder.createGetRoute(fastify, fullPath, handler, description)
        break
      case 'post':
        this.builder.createPostRoute(fastify, fullPath, handler, description)
        break
      case 'delete':
        this.builder.createDeleteRoute(fastify, fullPath, handler, description)
        break
      case 'reset':
        this.builder.createResetRoute(fastify, fullPath, handler, description)
        break
      default:
        this.builder.createRoute(fastify, method, fullPath, handler, description)
    }
  }
}
