import { ComponentLogger } from '../logging/ComponentLogger.js'

const logger = new ComponentLogger('DatabaseMetrics')

export class DatabaseMetrics {
  constructor() {
    this.queries = []
    this.slowQueryThreshold = 1000
    this.maxSamples = 1000
  }

  recordQuery(name, duration, type = 'SELECT', tableNames = []) {
    const query = {
      name,
      duration,
      type,
      tables: tableNames,
      timestamp: Date.now(),
      slow: duration > this.slowQueryThreshold,
    }

    this.queries.push(query)
    if (this.queries.length > this.maxSamples) {
      this.queries.shift()
    }

    if (query.slow) {
      logger.warn('Slow database query detected', { query: name, duration, tables: tableNames })
    }
  }

  getMetrics() {
    const now = Date.now()
    const oneMin = 60000
    const recentQueries = this.queries.filter(q => now - q.timestamp < oneMin)

    const byType = {}
    const byTable = {}
    let totalDuration = 0
    let slowCount = 0

    for (const q of recentQueries) {
      if (!byType[q.type]) byType[q.type] = 0
      byType[q.type]++

      for (const table of q.tables) {
        if (!byTable[table]) byTable[table] = 0
        byTable[table]++
      }

      totalDuration += q.duration
      if (q.slow) slowCount++
    }

    return {
      lastMin: {
        totalQueries: recentQueries.length,
        avgDuration: recentQueries.length > 0 ? Math.round(totalDuration / recentQueries.length) : 0,
        slowQueries: slowCount,
        byType,
        byTable,
      },
      slowestQueries: this.queries
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    }
  }

  clear() {
    this.queries = []
  }
}

export default DatabaseMetrics
