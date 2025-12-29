import { CacheManager } from './CacheManager.js'

export class QueryCache {
  constructor(cacheManager = null) {
    this.cache = cacheManager || new CacheManager(2000)
    this.queryDependencies = new Map([
      ['blueprints', ['blueprints', 'entities']],
      ['entities', ['entities', 'blueprints']],
      ['users', ['users']],
      ['config', ['config']],
      ['files', ['files']],
    ])
    this.ttls = new Map([
      ['getBlueprintsForUser', 300000],
      ['getBlueprints', 300000],
      ['getEntitiesInWorld', 60000],
      ['getEntities', 60000],
      ['getUserById', 600000],
      ['getAssetMetadata', 3600000],
      ['listAssets', 300000],
      ['getConfigValue', 300000],
    ])
  }

  buildKey(queryName, params) {
    const paramStr = typeof params === 'object'
      ? Object.entries(params)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, v]) => `${k}:${v}`)
        .join('|')
      : params
    return `query:${queryName}:${paramStr}`
  }

  get(queryName, params) {
    const key = this.buildKey(queryName, params)
    return this.cache.get(key)
  }

  set(queryName, params, result) {
    const key = this.buildKey(queryName, params)
    const ttl = this.ttls.get(queryName)
    this.cache.set(key, result, ttl)
    return result
  }

  invalidateQuery(queryName, params = null) {
    if (params) {
      const key = this.buildKey(queryName, params)
      this.cache.delete(key)
    } else {
      this.cache.invalidate(`query:${queryName}:`)
    }
  }

  invalidateTable(tableName) {
    const deps = this.queryDependencies.get(tableName) || [tableName]
    for (const dep of deps) {
      this.cache.invalidate(`query:`)
    }
  }

  onQueryInvalidate(queryName, callback) {
    const pattern = `query:${queryName}:`
    this.cache.onInvalidate(pattern, callback)
  }

  getHitRate() {
    const stats = this.cache.stats
    if (stats.hits + stats.misses === 0) return 0
    return stats.hits / (stats.hits + stats.misses)
  }

  getStats() {
    return this.cache.getStats()
  }
}

export default QueryCache
