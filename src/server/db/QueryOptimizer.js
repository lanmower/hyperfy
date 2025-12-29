import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('QueryOptimizer')

export class QueryOptimizer {
  constructor() {
    this.stats = {
      queriesAnalyzed: 0,
      optimized: 0,
      slow: 0,
      totalTime: 0
    }
    this.slowQueryThreshold = 100 // ms
    this.queryPatterns = new Map()
  }

  analyze(sql, executionTime) {
    this.stats.queriesAnalyzed++
    this.stats.totalTime += executionTime

    const pattern = this.extractPattern(sql)
    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastExecuted: null,
        suggestions: []
      })
    }

    const patternStats = this.queryPatterns.get(pattern)
    patternStats.count++
    patternStats.totalTime += executionTime
    patternStats.minTime = Math.min(patternStats.minTime, executionTime)
    patternStats.maxTime = Math.max(patternStats.maxTime, executionTime)
    patternStats.lastExecuted = Date.now()

    if (executionTime > this.slowQueryThreshold) {
      this.stats.slow++
      this.generateSuggestions(sql, executionTime, patternStats)
    }

    return {
      pattern,
      executionTime,
      isSlow: executionTime > this.slowQueryThreshold,
      averageTime: patternStats.totalTime / patternStats.count
    }
  }

  extractPattern(sql) {
    return sql
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, "'...'")
      .substring(0, 100)
  }

  generateSuggestions(sql, executionTime, patternStats) {
    const suggestions = []

    if (sql.toUpperCase().includes('SELECT *')) {
      suggestions.push('Avoid SELECT * - specify only needed columns')
    }

    if (sql.toUpperCase().includes('JOIN')) {
      const joinCount = (sql.match(/JOIN/gi) || []).length
      if (joinCount > 3) {
        suggestions.push(`Multiple JOINs (${joinCount}) - consider denormalization`)
      }
    }

    if (sql.toUpperCase().includes('ORDER BY') && sql.toUpperCase().includes('LIMIT')) {
      suggestions.push('ORDER BY with LIMIT - ensure index on sort column')
    }

    if (sql.toUpperCase().includes('LIKE')) {
      if (sql.includes("LIKE '%")) {
        suggestions.push('Leading wildcard LIKE - not index-friendly')
      }
    }

    if (sql.toUpperCase().includes('GROUP BY')) {
      suggestions.push('GROUP BY query - verify index on grouped column')
    }

    if (executionTime > 500) {
      suggestions.push(`Query very slow (${executionTime}ms) - consider caching or async processing`)
    }

    patternStats.suggestions = suggestions

    if (suggestions.length > 0) {
      logger.warn('Slow query detected', {
        sql: sql.substring(0, 100),
        time: executionTime,
        suggestions
      })
    }
  }

  getSlowQueries(limit = 10) {
    const queries = Array.from(this.queryPatterns.values())
      .sort((a, b) => (b.totalTime / b.count) - (a.totalTime / a.count))
      .slice(0, limit)

    return queries.map((q, i) => ({
      rank: i + 1,
      count: q.count,
      averageTime: (q.totalTime / q.count).toFixed(2) + 'ms',
      minTime: q.minTime.toFixed(2) + 'ms',
      maxTime: q.maxTime.toFixed(2) + 'ms',
      totalTime: q.totalTime.toFixed(2) + 'ms',
      suggestions: q.suggestions,
      lastExecuted: new Date(q.lastExecuted).toISOString()
    }))
  }

  getStats() {
    const avgTime = this.stats.queriesAnalyzed > 0
      ? (this.stats.totalTime / this.stats.queriesAnalyzed).toFixed(2)
      : 0

    return {
      ...this.stats,
      averageQueryTime: avgTime + 'ms',
      slowQueryPercentage: ((this.stats.slow / this.stats.queriesAnalyzed) * 100).toFixed(2) + '%',
      uniquePatterns: this.queryPatterns.size
    }
  }

  reset() {
    this.stats = {
      queriesAnalyzed: 0,
      optimized: 0,
      slow: 0,
      totalTime: 0
    }
    this.queryPatterns.clear()
  }
}

export class IndexRecommender {
  constructor() {
    this.recommendations = []
    this.analyzedQueries = new Map()
  }

  analyze(sql) {
    const hashKey = this.hash(sql)

    if (this.analyzedQueries.has(hashKey)) {
      return this.analyzedQueries.get(hashKey)
    }

    const recs = this.generateRecommendations(sql)
    this.analyzedQueries.set(hashKey, recs)

    if (recs.length > 0) {
      this.recommendations.push({
        sql: sql.substring(0, 100),
        recommendations: recs,
        timestamp: Date.now()
      })
    }

    return recs
  }

  generateRecommendations(sql) {
    const recs = []
    const upperSql = sql.toUpperCase()

    const whereMatch = sql.match(/WHERE\s+([^ORDER|GROUP|LIMIT|JOIN]*)/i)
    if (whereMatch) {
      const columns = this.extractColumns(whereMatch[1])
      if (columns.length > 0) {
        recs.push({
          type: 'WHERE_COLUMN',
          columns,
          reason: 'Columns in WHERE clause benefit from index'
        })
      }
    }

    const orderMatch = sql.match(/ORDER\s+BY\s+([^LIMIT]*)/i)
    if (orderMatch) {
      const columns = this.extractColumns(orderMatch[1])
      if (columns.length > 0) {
        recs.push({
          type: 'ORDER_COLUMN',
          columns,
          reason: 'ORDER BY columns should be indexed'
        })
      }
    }

    const groupMatch = sql.match(/GROUP\s+BY\s+([^HAVING|ORDER]*)/i)
    if (groupMatch) {
      const columns = this.extractColumns(groupMatch[1])
      if (columns.length > 0) {
        recs.push({
          type: 'GROUP_COLUMN',
          columns,
          reason: 'GROUP BY columns should be indexed'
        })
      }
    }

    if (upperSql.includes('JOIN')) {
      const joinMatch = sql.match(/ON\s+([^WHERE|GROUP|ORDER]*)/gi)
      if (joinMatch) {
        for (const match of joinMatch) {
          const columns = this.extractColumns(match)
          if (columns.length > 0) {
            recs.push({
              type: 'JOIN_COLUMN',
              columns,
              reason: 'JOIN condition columns should be indexed'
            })
          }
        }
      }
    }

    return recs
  }

  extractColumns(text) {
    const matches = text.match(/([a-zA-Z_][a-zA-Z0-9_]*)/g) || []
    return [...new Set(matches)].filter(col => {
      const lower = col.toLowerCase()
      return !['and', 'or', 'not', 'in', 'between'].includes(lower)
    })
  }

  hash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  getRecommendations(limit = 20) {
    return this.recommendations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  getAllUnique() {
    const unique = new Map()

    for (const rec of this.recommendations) {
      for (const rec_item of rec.recommendations) {
        const key = `${rec_item.type}:${rec_item.columns.join(',')}`
        if (!unique.has(key)) {
          unique.set(key, rec_item)
        }
      }
    }

    return Array.from(unique.values())
  }

  clear() {
    this.recommendations = []
    this.analyzedQueries.clear()
  }
}
