const PERFORMANCE_BUDGETS = {
  '/health': 100,
  '/metrics': 100,
  '/': 500,
  '/api/': 1000,
  '/assets/': 200,
  default: 2000,
}

const SLOW_QUERY_THRESHOLD = 100

class ResponseMetrics {
  constructor() {
    this.responseTimes = []
    this.slowRequests = []
    this.lastReset = Date.now()
  }

  record(path, duration, statusCode) {
    this.responseTimes.push({
      path,
      duration,
      statusCode,
      timestamp: Date.now(),
    })

    if (duration > SLOW_QUERY_THRESHOLD) {
      this.slowRequests.push({
        path,
        duration,
        timestamp: Date.now(),
      })
    }

    if (this.responseTimes.length > 10000) {
      this.responseTimes = this.responseTimes.slice(-5000)
    }

    if (this.slowRequests.length > 1000) {
      this.slowRequests = this.slowRequests.slice(-500)
    }
  }

  getStats() {
    if (this.responseTimes.length === 0) {
      return { count: 0, avg: 0, p95: 0, p99: 0 }
    }

    const durations = this.responseTimes
      .map(r => r.duration)
      .sort((a, b) => a - b)

    const count = durations.length
    const avg = durations.reduce((a, b) => a + b, 0) / count
    const p95Idx = Math.floor(count * 0.95)
    const p99Idx = Math.floor(count * 0.99)

    return {
      count,
      avg: Math.round(avg * 100) / 100,
      p95: durations[p95Idx] || 0,
      p99: durations[p99Idx] || 0,
      slowCount: this.slowRequests.length,
    }
  }

  getSlowRequests(limit = 10) {
    return this.slowRequests.slice(-limit).reverse()
  }

  reset() {
    this.responseTimes = []
    this.slowRequests = []
    this.lastReset = Date.now()
  }
}

export function trackResponseTime(fastify, options = {}) {
  const metrics = new ResponseMetrics()
  fastify.metrics.response = metrics

  fastify.addHook('onRequest', async (request) => {
    request._performanceStart = process.hrtime.bigint()
  })

  fastify.addHook('onSend', (request, reply, payload) => {
    if (!request._performanceStart) return payload
    if (reply.sent) return payload

    const end = process.hrtime.bigint()
    const duration = Number(end - request._performanceStart) / 1000000
    const path = request.url.split('?')[0]

    metrics.record(path, duration, reply.statusCode)

    const budget = getPerformanceBudget(path)
    if (duration > budget) {
      fastify.logger?.warn(
        `[PERF] Slow request detected: ${path} took ${Math.round(duration)}ms (budget: ${budget}ms)`,
        { path, duration, statusCode: reply.statusCode }
      )
    }

    if (!reply.headersSent) {
      try {
        reply.header('X-Response-Time', Math.round(duration * 100) / 100 + 'ms')
      } catch (err) {
        // Headers already sent by another onSend hook, silently skip
      }
    }
    return payload
  })

  return metrics
}

function getPerformanceBudget(path) {
  for (const [pattern, budget] of Object.entries(PERFORMANCE_BUDGETS)) {
    if (pattern === 'default') continue
    if (path === pattern || path.startsWith(pattern)) {
      return budget
    }
  }
  return PERFORMANCE_BUDGETS.default
}

export function registerPerformanceEndpoints(fastify) {
  fastify.get('/admin/performance/stats', async (request, reply) => {
    const metrics = fastify.metrics?.response
    if (!metrics) {
      return reply.send({ error: 'Metrics not available' })
    }

    return reply.send({
      stats: metrics.getStats(),
      slowRequests: metrics.getSlowRequests(20),
      uptime: Date.now() - metrics.lastReset,
    })
  })

  fastify.get('/admin/performance/budgets', async (request, reply) => {
    return reply.send(PERFORMANCE_BUDGETS)
  })

  fastify.post('/admin/performance/reset', async (request, reply) => {
    const metrics = fastify.metrics?.response
    if (metrics) {
      metrics.reset()
    }
    return reply.send({ success: true, message: 'Metrics reset' })
  })
}

export function enforcePerformanceBudgets(fastify, options = {}) {
  fastify.addHook('onSend', (request, reply, payload) => {
    if (reply.sent || reply.headersSent) {
      return payload
    }
    if (options.enforceStrict && request._performanceStart) {
      const end = process.hrtime.bigint()
      const duration = Number(end - request._performanceStart) / 1000000
      const path = request.url.split('?')[0]
      const budget = getPerformanceBudget(path)

      if (duration > budget * 1.5) {
        fastify.logger?.error(
          `[PERF] Performance budget exceeded: ${path}`,
          { path, duration, budget }
        )
      }
    }
    return payload
  })
}

export function getPerformanceMetrics(fastify) {
  const metrics = fastify.metrics?.response
  if (!metrics) return null

  return {
    stats: metrics.getStats(),
    slowRequests: metrics.getSlowRequests(10),
  }
}
