export class AIProviderHealth {
  constructor(logger) {
    this.logger = logger
    this.providers = new Map()
    this.checkInterval = null
    this.checkIntervalMs = 30000
  }

  addProvider(name, config) {
    this.providers.set(name, {
      name,
      config,
      status: 'UNKNOWN',
      lastCheck: null,
      lastSuccess: null,
      lastError: null,
      responseTime: null,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
    })
  }

  async checkProvider(name) {
    const provider = this.providers.get(name)
    if (!provider) return

    const startTime = Date.now()
    try {
      await this.pingProvider(provider.config)
      const responseTime = Date.now() - startTime

      provider.status = responseTime > 2000 ? 'DEGRADED' : 'UP'
      provider.lastCheck = new Date().toISOString()
      provider.lastSuccess = new Date().toISOString()
      provider.responseTime = responseTime
      provider.successCount++
      provider.lastError = null
    } catch (err) {
      provider.status = 'DOWN'
      provider.lastCheck = new Date().toISOString()
      provider.lastError = err.message
      provider.failureCount++
      provider.responseTime = null
      this.logger?.error(`AI provider ${name} health check failed: ${err.message}`)
    }

    const total = provider.successCount + provider.failureCount
    provider.successRate = total > 0 ? Math.round((provider.successCount / total) * 100) : 0
  }

  async pingProvider(config) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(config.healthEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return true
    } finally {
      clearTimeout(timeout)
    }
  }

  async checkAll() {
    const checks = []
    for (const [name] of this.providers) {
      checks.push(this.checkProvider(name))
    }
    await Promise.allSettled(checks)
  }

  start() {
    if (this.checkInterval) return

    this.checkAll()
    this.checkInterval = setInterval(() => {
      this.checkAll()
    }, this.checkIntervalMs)

    this.logger?.info(`AI provider health checks started (interval: ${this.checkIntervalMs}ms)`)
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      this.logger?.info('AI provider health checks stopped')
    }
  }

  getStatus(name) {
    return this.providers.get(name)
  }

  getAllStatus() {
    const status = {}
    for (const [name, data] of this.providers) {
      status[name] = {
        status: data.status,
        lastCheck: data.lastCheck,
        lastSuccess: data.lastSuccess,
        lastError: data.lastError,
        responseTime: data.responseTime,
        successRate: data.successRate,
        successCount: data.successCount,
        failureCount: data.failureCount,
      }
    }
    return status
  }

  getHealthyProvider(excludeNames = []) {
    const candidates = []
    for (const [name, data] of this.providers) {
      if (excludeNames.includes(name)) continue
      if (data.status === 'UP' || data.status === 'DEGRADED') {
        candidates.push({ name, data })
      }
    }

    if (candidates.length === 0) return null

    candidates.sort((a, b) => {
      if (a.data.status === 'UP' && b.data.status !== 'UP') return -1
      if (b.data.status === 'UP' && a.data.status !== 'UP') return 1
      return (b.data.successRate || 0) - (a.data.successRate || 0)
    })

    return candidates[0].name
  }

  isHealthy(name) {
    const provider = this.providers.get(name)
    return provider && (provider.status === 'UP' || provider.status === 'DEGRADED')
  }
}
