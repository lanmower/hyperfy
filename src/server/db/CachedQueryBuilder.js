import { QueryBuilder } from './QueryBuilder.js'

export class CachedQueryBuilder extends QueryBuilder {
  constructor(db, SQL, tableName, where, queryCache = null, metrics = null) {
    super(db, SQL, tableName, where)
    this.queryCache = queryCache
    this.metrics = metrics
    this.forceNoCache = false
    this.queryName = null
  }

  noCache() {
    this.forceNoCache = true
    return this
  }

  cacheAs(queryName) {
    this.queryName = queryName
    return this
  }

  async first() {
    const startTime = Date.now()
    if (this.queryCache && this.queryName && !this.forceNoCache) {
      const cacheKey = this.queryCache.buildKey(this.queryName, this._where)
      const cached = this.queryCache.get(this.queryName, this._where)
      if (cached !== undefined) {
        if (this.metrics) {
          this.metrics.recordQuery(`${this.tableName}.first (cached)`, Date.now() - startTime, 'SELECT', [this.tableName])
        }
        return cached
      }
    }

    const result = await super.first()

    if (this.queryCache && this.queryName && !this.forceNoCache) {
      this.queryCache.set(this.queryName, this._where, result)
    }

    if (this.metrics) {
      this.metrics.recordQuery(`${this.tableName}.first`, Date.now() - startTime, 'SELECT', [this.tableName])
    }

    return result
  }

  async _getAllRows() {
    const startTime = Date.now()
    if (this.queryCache && this.queryName && !this.forceNoCache) {
      const cached = this.queryCache.get(this.queryName, this._where)
      if (cached !== undefined) {
        if (this.metrics) {
          this.metrics.recordQuery(`${this.tableName}.all (cached)`, Date.now() - startTime, 'SELECT', [this.tableName])
        }
        return cached
      }
    }

    const result = await super._getAllRows()

    if (this.queryCache && this.queryName && !this.forceNoCache) {
      this.queryCache.set(this.queryName, this._where, result)
    }

    if (this.metrics) {
      this.metrics.recordQuery(`${this.tableName}.all`, Date.now() - startTime, 'SELECT', [this.tableName])
    }

    return result
  }

  async insert(data) {
    const startTime = Date.now()
    const result = await super.insert(data)
    if (this.queryCache) {
      this.queryCache.invalidateTable(this.tableName)
    }
    if (this.metrics) {
      this.metrics.recordQuery(`${this.tableName}.insert`, Date.now() - startTime, 'INSERT', [this.tableName])
    }
    return result
  }

  async update(data) {
    const startTime = Date.now()
    const result = await super.update(data)
    if (this.queryCache) {
      this.queryCache.invalidateQuery(this.queryName, this._where)
      this.queryCache.invalidateTable(this.tableName)
    }
    if (this.metrics) {
      this.metrics.recordQuery(`${this.tableName}.update`, Date.now() - startTime, 'UPDATE', [this.tableName])
    }
    return result
  }

  async delete() {
    const startTime = Date.now()
    const result = await super.delete()
    if (this.queryCache) {
      this.queryCache.invalidateQuery(this.queryName, this._where)
      this.queryCache.invalidateTable(this.tableName)
    }
    if (this.metrics) {
      this.metrics.recordQuery(`${this.tableName}.delete`, Date.now() - startTime, 'DELETE', [this.tableName])
    }
    return result
  }
}

export default CachedQueryBuilder
