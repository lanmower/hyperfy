export { ConnectionPool, QueryCache, PreparedStatementCache } from './ConnectionPool.js'
export { QueryOptimizer, IndexRecommender } from './QueryOptimizer.js'

let connectionPool = null
let queryCache = null
let preparedStatements = null
let queryOptimizer = null
let indexRecommender = null

export function initializeDatabase(options = {}) {
  connectionPool = new ConnectionPool(options.pool || {})
  queryCache = new QueryCache(options.cache || {})
  preparedStatements = new PreparedStatementCache(options.statements || {})
  queryOptimizer = new QueryOptimizer()
  indexRecommender = new IndexRecommender()

  return {
    connectionPool,
    queryCache,
    preparedStatements,
    queryOptimizer,
    indexRecommender
  }
}

export function getConnectionPool() {
  return connectionPool
}

export function getQueryCache() {
  return queryCache
}

export function getPreparedStatements() {
  return preparedStatements
}

export function getQueryOptimizer() {
  return queryOptimizer
}

export function getIndexRecommender() {
  return indexRecommender
}
