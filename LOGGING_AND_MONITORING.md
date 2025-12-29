# Logging and Monitoring System

## Overview

The production monitoring system provides comprehensive error tracking, centralized logging, health monitoring, and request tracking.

## Components

### 1. Logger (src/server/logging/Logger.js)

Centralized logging with multiple sinks and log rotation.

**Methods:**
- `logger.debug(message, data)` - Debug level
- `logger.info(message, data)` - Info level
- `logger.warn(message, data)` - Warning level
- `logger.error(message, data)` - Error level
- `logger.critical(message, data)` - Critical level

**Configuration:**
```javascript
const logger = new Logger({
  name: 'Server',
  level: 'DEBUG',           // DEBUG, INFO, WARN, ERROR, CRITICAL
  logsDir: '/var/logs',
  maxLogSize: 10 * 1024 * 1024,  // 10MB per file
  maxLogFiles: 7            // Keep 7 days of logs
})

// Add sinks for output
logger.addSink(new ConsoleSink())
logger.addSink(new FileSink(logsDir, 'server'))
```

**Context Methods:**
```javascript
logger.setRequestId('req-12345')
logger.setUserId('user-456')
logger.setModule('ServerNetwork')
logger.info('Connection established')
```

### 2. Error Tracker (src/server/logging/ErrorTracker.js)

Advanced error tracking with deduplication and sampling.

**Features:**
- Error deduplication by fingerprint
- Error count tracking
- Sentry integration (optional)
- Breadcrumb tracking
- Sampling for high-volume errors

**Usage:**
```javascript
const errorTracker = new ErrorTracker({
  sentry: sentryClient,
  logger: loggerInstance,
  samplingRate: 0.5  // 50% sampling in production
})

// Capture exceptions
errorTracker.captureException(error, {
  category: 'Network',
  module: 'ServerNetwork',
  requestId: 'req-123',
  userId: 'user-456'
})

// Capture messages
errorTracker.captureMessage('User connected', {
  level: 'info',
  category: 'Connection'
})

// Add breadcrumbs
errorTracker.addBreadcrumb('Database query', {
  query: 'SELECT * FROM users',
  duration: 45
})

// Get stats
const stats = errorTracker.getStats()
// {
//   totalErrors: 42,
//   totalFingerprints: 8,
//   byLevel: { error: 35, warn: 7 },
//   byCategory: { Network: 25, Database: 17 },
//   byModule: { ServerNetwork: 20, DatabasePool: 22 }
// }

// Query errors
const errors = errorTracker.getErrors({ level: 'error', category: 'Network' })
```

### 3. Health Monitoring

**Endpoints:**

#### GET /health
Returns basic server health status.
```json
{
  "status": "up",
  "uptime": 3600,
  "timestamp": "2025-12-27T10:30:00Z",
  "memory": {
    "rss": 245,
    "heapUsed": 123,
    "heapTotal": 256
  }
}
```

#### GET /health/ready
Checks service readiness (database, cache, network).
```json
{
  "ready": true,
  "checks": {
    "world": true,
    "network": true,
    "storage": true
  },
  "timestamp": "2025-12-27T10:30:00Z"
}
```

#### GET /health/live
Simple liveness probe for orchestration.
```json
{
  "status": "alive",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

#### GET /metrics
Comprehensive metrics for monitoring systems.
```json
{
  "uptime": 3600,
  "memory": {
    "rss": 245,
    "heapUsed": 123,
    "heapTotal": 256
  },
  "errors": 5,
  "errorsByLevel": {
    "error": 3,
    "warn": 2
  },
  "errorsByCategory": {
    "Network": 3,
    "Database": 2
  },
  "connections": 42,
  "entities": 156,
  "blueprints": 23,
  "apps": 45
}
```

### 4. Request Tracking

Automatic request ID generation and tracking via middleware.

**Features:**
- Unique request ID per request (or from X-Request-ID header)
- Response time tracking
- Error rate monitoring
- Request logging

**Accessing request context:**
```javascript
// In route handler
fastify.get('/api/user', async (request, reply) => {
  const requestId = request.id
  const duration = performance.now() - request.startTime

  logger.setRequestId(requestId)
  logger.info('Processing user request', { duration })
})
```

## Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=DEBUG                          # DEBUG, INFO, WARN, ERROR, CRITICAL
LOG_DIR=/var/logs                        # Log directory path
LOG_MAX_SIZE=10485760                    # Max file size (10MB)
LOG_MAX_FILES=7                          # Days of logs to keep

# Sentry (optional)
SENTRY_DSN=https://key@sentry.io/123456 # Sentry project DSN
NODE_ENV=production                       # development, staging, production

# Error Tracking
ERROR_SAMPLING_RATE=0.5                  # 0.0 - 1.0, 0.5 = 50% sampling
MAX_ERROR_BUFFER=1000                    # Max errors to keep in memory
```

### Initialization in Server

```javascript
import { Logger, ConsoleSink, FileSink } from './logging/Logger.js'
import { ErrorTracker } from './logging/ErrorTracker.js'
import { initSentry } from './logging/SentryConfig.js'

// Setup logging
const logger = new Logger({
  name: 'Server',
  level: process.env.LOG_LEVEL || 'INFO',
  logsDir: process.env.LOG_DIR || './logs'
})
logger.addSink(new ConsoleSink())
if (process.env.NODE_ENV === 'production') {
  logger.addSink(new FileSink(logsDir, 'server'))
}
await logger.init()

// Setup error tracking
const sentry = await initSentry()
const errorTracker = new ErrorTracker({
  sentry,
  logger,
  samplingRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0
})

// Make available to all modules
global.logger = logger
global.errorTracker = errorTracker
```

## Integration Examples

### In Route Handlers

```javascript
fastify.post('/api/spawn-entity', async (request, reply) => {
  const requestId = request.id
  logger.setRequestId(requestId)

  try {
    const result = await world.spawnEntity(request.body)
    logger.info('Entity spawned', { entityId: result.id })
    return result
  } catch (err) {
    errorTracker.captureException(err, {
      requestId,
      category: 'EntitySpawn',
      module: 'API',
      path: '/api/spawn-entity'
    })
    throw err
  }
})
```

### In System Classes

```javascript
class ServerNetwork {
  constructor(world) {
    this.world = world
    this.logger = global.logger
    this.errorTracker = global.errorTracker
  }

  onConnection(ws, query) {
    try {
      this.logger.setModule('ServerNetwork')
      this.logger.info('Client connected', { clientId: query.id })
      this.errorTracker.addBreadcrumb('Connection', { clientId: query.id })

      // Handle connection...
    } catch (err) {
      this.errorTracker.captureException(err, {
        category: 'Connection',
        module: 'ServerNetwork',
        clientId: query.id
      })
    }
  }

  onMessage(socket, message) {
    try {
      this.logger.setRequestId(message.requestId)
      const timer = performance.now()

      // Process message...

      const duration = performance.now() - timer
      this.logger.debug('Message processed', {
        messageType: message.type,
        duration
      })
    } catch (err) {
      this.errorTracker.captureException(err, {
        category: 'MessageHandling',
        module: 'ServerNetwork',
        messageType: message.type
      })
    }
  }
}
```

### In Database Operations

```javascript
async function queryDatabase(sql, params) {
  const logger = global.logger
  const errorTracker = global.errorTracker

  const timer = performance.now()

  try {
    const result = await db.query(sql, params)
    const duration = performance.now() - timer

    if (duration > 1000) {
      logger.warn('Slow query detected', {
        sql: sql.substring(0, 100),
        duration,
        params
      })
    }

    return result
  } catch (err) {
    errorTracker.captureException(err, {
      category: 'Database',
      module: 'Query',
      sql: sql.substring(0, 100),
      duration: performance.now() - timer
    })
    throw err
  }
}
```

## Log File Format

### Console Output
```
[10:30:45] ERROR    [req:abc123] [user:john#xyz]
  Message: Failed to spawn entity
  Context: module=API, category=EntitySpawn
```

### File Output (JSON Lines)
```json
{"timestamp":"2025-12-27T10:30:45.123Z","level":"ERROR","message":"Failed to spawn entity","logger":"Server","module":"API","requestId":"abc123","userId":"user-123","data":{"error":"Invalid blueprint"}}
{"timestamp":"2025-12-27T10:30:46.456Z","level":"INFO","message":"Entity spawned","logger":"Server","module":"API","requestId":"def456","userId":"user-456","data":{"entityId":"ent-789"}}
```

## Monitoring Dashboard Integration

### Prometheus-Compatible Metrics

The system exposes metrics that can be scraped by Prometheus:

```javascript
// From /metrics endpoint
{
  "uptime": 3600,
  "errors": 5,
  "connections": 42,
  "memory": { ... }
}
```

### Example Alerting Rules

```yaml
# High error rate
- alert: HighErrorRate
  expr: error_count > 100

# Memory pressure
- alert: HighMemoryUsage
  expr: memory_heap_percent > 85

# Connection spike
- alert: ConnectionSpike
  expr: connections > 1000
```

## Best Practices

1. **Always use context:** Set requestId, userId, module before logging
2. **Avoid logging sensitive data:** PII, passwords, tokens should be masked
3. **Use appropriate levels:**
   - CRITICAL: System-level failures
   - ERROR: Operation failures
   - WARN: Degraded performance, unusual conditions
   - INFO: Important state changes
   - DEBUG: Detailed diagnostic info
4. **Add breadcrumbs before errors:** Helps with post-mortem analysis
5. **Sample high-volume errors:** Use ErrorTracker sampling in production
6. **Monitor log file sizes:** Configure log rotation appropriately
7. **Test error paths:** Verify error tracking works in staging before production

## Troubleshooting

### Logs not appearing in file
- Check log directory permissions
- Verify LOG_DIR environment variable
- Ensure logger.init() is called

### Sentry not receiving errors
- Verify SENTRY_DSN is set
- Check network connectivity
- Confirm @sentry/node is installed
- Review sampling rate (may be filtering events)

### Memory issues from error buffer
- Increase ERROR_SAMPLING_RATE (sample more aggressively)
- Decrease MAX_ERROR_BUFFER
- Review error deduplication fingerprints

### High disk usage from logs
- Reduce LOG_MAX_FILES or LOG_MAX_SIZE
- Increase LOG_LEVEL (log less verbose)
- Archive old logs to external storage
