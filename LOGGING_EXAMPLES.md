# Logging and Error Tracking Examples

## Quick Start

### Basic Setup
```javascript
import { Logger, ConsoleSink, FileSink } from './logging/Logger.js'
import { ErrorTracker } from './logging/ErrorTracker.js'
import { initSentry } from './logging/SentryConfig.js'

// Initialize logger
const logger = new Logger({ name: 'MyApp', level: 'INFO' })
logger.addSink(new ConsoleSink())
await logger.init()

// Initialize error tracking
const sentry = await initSentry()
const errorTracker = new ErrorTracker({ sentry, logger })

// Make globally available
global.logger = logger
global.errorTracker = errorTracker
```

## Real-World Example: Entity Spawning

### Scenario
An admin requests to spawn a new entity in the world. We need to log the operation, track errors, and monitor performance.

### Implementation

```javascript
// In routes/EntityRoutes.js
export function registerEntityRoutes(fastify, world) {
  fastify.post('/api/entities/spawn', async (request, reply) => {
    const requestId = request.id
    const logger = fastify.logger
    const errorTracker = fastify.errorTracker
    const metrics = fastify.metrics

    // Set context for all logs in this request
    logger.setRequestId(requestId)
    logger.setModule('EntitySpawn')

    const startTime = performance.now()
    const { blueprintId, position, data } = request.body

    try {
      // Log incoming request
      logger.info('Spawn entity requested', {
        blueprintId,
        position: position?.join(','),
        dataSize: JSON.stringify(data).length
      })

      // Add breadcrumb for error context
      errorTracker.addBreadcrumb('Entity Spawn Start', {
        blueprintId,
        posX: position?.[0],
        posY: position?.[1],
        posZ: position?.[2]
      })

      // Validate blueprint exists
      const blueprint = world.blueprints.get(blueprintId)
      if (!blueprint) {
        throw new Error(`Blueprint not found: ${blueprintId}`)
      }

      // Spawn entity
      const entity = await world.spawnEntity({
        blueprint: blueprintId,
        position: position,
        data
      })

      const duration = performance.now() - startTime

      // Log success
      logger.info('Entity spawned successfully', {
        entityId: entity.id,
        duration: Math.round(duration),
        blueprintId
      })

      // Track metrics
      metrics.counter('entities.spawned')
      metrics.sample('spawn.duration_ms', duration)

      // Return success response
      return reply.code(201).send({
        entityId: entity.id,
        timestamp: new Date().toISOString()
      })

    } catch (err) {
      const duration = performance.now() - startTime

      // Log error with context
      logger.error(`Failed to spawn entity: ${err.message}`, {
        blueprintId,
        duration: Math.round(duration),
        stack: err.stack.split('\n').slice(0, 3).join('\n')
      })

      // Track error
      errorTracker.captureException(err, {
        requestId,
        category: 'EntitySpawn',
        module: 'EntityAPI',
        blueprintId,
        userId: request.user?.id,
        duration: Math.round(duration)
      })

      // Track failed spawn
      metrics.counter('entities.spawn_failed')

      // Return error response
      return reply.code(400).send({
        error: err.message,
        requestId,
        timestamp: new Date().toISOString()
      })
    }
  })
}
```

## Example: WebSocket Connection Handling

```javascript
// In systems/ServerNetwork.js
export class ServerNetwork {
  constructor(world) {
    this.world = world
  }

  onConnection(ws, query) {
    const logger = global.logger
    const errorTracker = global.errorTracker

    const clientId = query.id
    const connectionTime = Date.now()

    try {
      logger.setModule('ServerNetwork')
      logger.info('Client connection', {
        clientId,
        version: query.version,
        platform: query.platform
      })

      errorTracker.addBreadcrumb('Client Connection', {
        clientId,
        version: query.version
      })

      // Setup message handler with error tracking
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data)
          logger.setRequestId(message.requestId)

          const startTime = performance.now()

          // Process message based on type
          this.handleMessage(ws, message)

          const duration = performance.now() - startTime
          if (duration > 100) {
            logger.warn('Slow message processing', {
              messageType: message.type,
              duration: Math.round(duration),
              clientId
            })
          }

        } catch (err) {
          if (err instanceof SyntaxError) {
            logger.warn('Invalid message format', { clientId })
          } else {
            logger.error(`Message handling error: ${err.message}`, {
              clientId,
              error: err.message
            })

            errorTracker.captureException(err, {
              category: 'MessageHandling',
              module: 'ServerNetwork',
              clientId,
              messageType: message?.type
            })
          }
        }
      })

      // Track disconnection
      ws.on('close', () => {
        const duration = Date.now() - connectionTime
        logger.info('Client disconnected', {
          clientId,
          connectionDuration: Math.round(duration / 1000),
          clientCount: this.world.network.sockets.size
        })
      })

      // Track errors
      ws.on('error', (err) => {
        logger.error(`WebSocket error: ${err.message}`, { clientId })
        errorTracker.captureException(err, {
          category: 'WebSocketError',
          module: 'ServerNetwork',
          clientId
        })
      })

    } catch (err) {
      logger.critical(`Failed to establish connection: ${err.message}`)
      errorTracker.captureException(err, {
        category: 'ConnectionSetup',
        module: 'ServerNetwork',
        clientId
      })
      ws.close()
    }
  }

  handleMessage(ws, message) {
    // Message handling with error tracking
  }
}
```

## Example: Database Operation Logging

```javascript
// In db/QueryLogger.js
export class QueryLogger {
  constructor(db) {
    this.db = db
    this.logger = global.logger
    this.errorTracker = global.errorTracker
  }

  async execute(sql, params = []) {
    const startTime = performance.now()
    const queryId = Math.random().toString(36).slice(2, 9)

    try {
      this.logger.setModule('Database')
      this.logger.debug('Query start', {
        queryId,
        sql: sql.substring(0, 80),
        paramCount: params.length
      })

      const result = await this.db.execute(sql, params)
      const duration = performance.now() - startTime

      // Warn on slow queries
      if (duration > 1000) {
        this.logger.warn('Slow query detected', {
          queryId,
          duration: Math.round(duration),
          sql: sql.substring(0, 80),
          rows: result.length
        })

        this.errorTracker.addBreadcrumb('Slow Query', {
          duration: Math.round(duration),
          rows: result.length
        })
      }

      if (duration > 100) {
        this.logger.debug('Query complete', {
          queryId,
          duration: Math.round(duration),
          rows: result.length
        })
      }

      return result

    } catch (err) {
      const duration = performance.now() - startTime

      this.logger.error(`Query failed: ${err.message}`, {
        queryId,
        sql: sql.substring(0, 80),
        duration: Math.round(duration),
        error: err.message
      })

      this.errorTracker.captureException(err, {
        category: 'Database',
        module: 'Query',
        queryId,
        sql: sql.substring(0, 80),
        duration: Math.round(duration)
      })

      throw err
    }
  }
}
```

## Example: Error Analysis and Debugging

```javascript
// Get error statistics
const stats = global.errorTracker.getStats()
console.log('Error Summary:', {
  total: stats.totalErrors,
  byLevel: stats.byLevel,
  byCategory: stats.byCategory,
  byModule: stats.byModule
})

// Find all entity spawn errors in last 5 minutes
const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
const spawnErrors = global.errorTracker.getErrors({
  category: 'EntitySpawn',
  since: fiveMinutesAgo
})

console.log('Recent spawn errors:')
spawnErrors.forEach(err => {
  console.log(`  - ${err.message} (count: ${err.count})`)
})

// Identify error patterns
const errorPatterns = {}
spawnErrors.forEach(err => {
  const fingerprint = err.fingerprint.join('|')
  if (!errorPatterns[fingerprint]) {
    errorPatterns[fingerprint] = { message: err.message, count: 0 }
  }
  errorPatterns[fingerprint].count += err.count
})

console.log('Error patterns:')
Object.entries(errorPatterns)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10)
  .forEach(([fp, info]) => {
    console.log(`  - ${info.message}: ${info.count} occurrences`)
  })
```

## Example: Monitoring Health Checks

```javascript
// Setup health check with logging
fastify.get('/health', async (request, reply) => {
  const logger = fastify.logger
  const errorTracker = fastify.errorTracker

  try {
    // Check components
    const checks = {
      database: await checkDatabase(),
      network: await checkNetwork(),
      storage: await checkStorage()
    }

    // Log health status
    const allHealthy = Object.values(checks).every(c => c)
    if (!allHealthy) {
      logger.warn('Health check failed', {
        checks,
        timestamp: new Date().toISOString()
      })

      errorTracker.addBreadcrumb('Health Check Failed', { checks })
    }

    // Return status
    return reply.code(allHealthy ? 200 : 503).send({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    })

  } catch (err) {
    logger.error(`Health check error: ${err.message}`)
    errorTracker.captureException(err, {
      category: 'HealthCheck',
      module: 'Monitoring'
    })

    return reply.code(503).send({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    })
  }
})
```

## Output Examples

### Console Output

```
[10:30:45] INFO     [req:xyz789]
  Spawn entity requested
  {"blueprintId":"scene-1","position":"0,1,2","dataSize":256}

[10:30:46] INFO     [req:xyz789]
  Entity spawned successfully
  {"entityId":"ent-456","duration":1234,"blueprintId":"scene-1"}

[10:30:47] ERROR    [req:abc123]
  Failed to spawn entity: Blueprint not found: invalid-bp
  {"blueprintId":"invalid-bp","duration":45,"stack":"Error: Blueprint not found..."}
```

### File Output (JSON Lines)

```json
{"timestamp":"2025-12-27T10:30:45.123Z","level":"INFO","message":"Spawn entity requested","module":"EntitySpawn","requestId":"xyz789","data":{"blueprintId":"scene-1","position":"0,1,2"}}
{"timestamp":"2025-12-27T10:30:46.456Z","level":"INFO","message":"Entity spawned successfully","module":"EntitySpawn","requestId":"xyz789","data":{"entityId":"ent-456","duration":1234}}
{"timestamp":"2025-12-27T10:30:47.789Z","level":"ERROR","message":"Failed to spawn entity: Blueprint not found","module":"EntitySpawn","requestId":"abc123","data":{"blueprintId":"invalid-bp","error":"Blueprint not found"}}
```

### Metrics Response

```json
{
  "uptime": 3600,
  "memory": {
    "rss": 245,
    "heapUsed": 123,
    "heapTotal": 256
  },
  "errors": 42,
  "errorsByLevel": {
    "error": 35,
    "warn": 7
  },
  "errorsByCategory": {
    "EntitySpawn": 15,
    "Database": 12,
    "Network": 8,
    "MessageHandling": 7
  },
  "connections": 42,
  "entities": 156,
  "blueprints": 23,
  "apps": 45
}
```

## Debugging Commands

```javascript
// Check error tracker state
global.errorTracker.getStats()

// Get recent errors
global.errorTracker.getErrors().slice(-10)

// Get errors by category
global.errorTracker.getErrors({ category: 'Network' })

// Get errors since timestamp
const oneHourAgo = Date.now() - (60 * 60 * 1000)
global.errorTracker.getErrors({ since: oneHourAgo })

// View breadcrumbs
global.errorTracker.breadcrumbs.slice(-20)

// Clear all errors (development only)
global.errorTracker.clear()
```
