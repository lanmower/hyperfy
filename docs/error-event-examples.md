# Error Event System Examples

This document provides practical examples of using the unified error event system.

## Basic Usage

### SDK Client-Side Error Handling

```javascript
import { HyperfyClient } from '@hyperfy/sdk'

const client = new HyperfyClient('ws://localhost:4000')

// Errors are automatically captured and sent to server
await client.connect()

// Manual error reporting
client.errorHandler.handleError(new Error('Custom error'), {
  category: 'app.script.runtime',
  app: 'my-app',
  entity: 'ent_123'
})

// Get error statistics
const stats = client.errorHandler.getErrorStats()
console.log('Total errors:', stats.total)
console.log('Critical errors:', stats.criticalCount)
console.log('Most common:', stats.mostCommon)

// Listen for errors
client.errorHandler.on('error', (errorData) => {
  console.log('Error occurred:', errorData.message)
  if (errorData.severity === 'critical') {
    // Handle critical errors
  }
})

// Export error report
const report = client.errorHandler.export('json')
console.log(report)
```

### Server-Side Error Monitoring

```javascript
// In server code
export function init(world) {
  // Capture custom errors
  world.errorMonitor.captureError('app.custom', {
    message: 'Custom server error'
  }, new Error().stack)

  // Listen for all errors
  world.events.on('errorCaptured', (errorEntry) => {
    console.log('Error captured:', errorEntry.type, errorEntry.side)
  })

  // Listen for critical errors
  world.events.on('criticalError', (errorEvent) => {
    console.error('CRITICAL:', errorEvent.message)
    // Send alert, page admin, etc.
  })

  // Get unified statistics
  const stats = world.errorMonitor.getStats()
  console.log('Server stats:', stats)
  console.log('Unified stats:', stats.unified)

  // Get recent errors
  const recentErrors = world.errorMonitor.getErrors({
    limit: 10,
    since: Date.now() - 60000 // Last minute
  })

  // Get errors by type
  const scriptErrors = world.errorMonitor.getErrors({
    type: 'app.script.runtime',
    limit: 50
  })

  // Get client-side errors only
  const clientErrors = world.errorMonitor.getErrors({
    side: 'client',
    limit: 100
  })
}
```

## Advanced Usage

### Custom Error Categories

```javascript
// Define custom error categories
const ErrorCategories = {
  DATABASE: 'database.query',
  AUTHENTICATION: 'auth.validation',
  PAYMENT: 'payment.processing',
  API: 'api.external',
  CACHE: 'cache.redis'
}

// Use custom categories
client.errorHandler.handleError(
  new Error('Database connection failed'),
  { category: ErrorCategories.DATABASE }
)

world.errorMonitor.captureError(
  ErrorCategories.AUTHENTICATION,
  { message: 'Invalid JWT token' },
  null
)
```

### Error Context Enrichment

```javascript
// Add rich context to errors
function handleUserAction(userId, action) {
  try {
    performAction(action)
  } catch (err) {
    client.errorHandler.handleError(err, {
      category: 'app.user.action',
      user: userId,
      metadata: {
        action: action.type,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
      }
    })
  }
}
```

### MCP Error Subscription

```javascript
// MCP client subscribes to real-time errors
import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:4000')

ws.on('open', () => {
  // Subscribe to error events
  ws.send(JSON.stringify({
    type: 'mcpSubscribeErrors',
    data: {
      level: 'error', // Only errors, not warnings
      critical: true  // Only critical errors
    }
  }))
})

ws.on('message', (data) => {
  const message = JSON.parse(data)

  if (message.type === 'mcpErrorEvent') {
    const { error, clientId, playerId, playerName } = message.data

    console.log('Real-time error from client:', {
      player: playerName,
      error: error.message,
      category: error.category,
      level: error.level,
      count: error.count
    })

    // Alert on critical errors
    if (error.level === 'error') {
      sendAlert(`Critical error from ${playerName}: ${error.message}`)
    }
  }
})
```

### Error Analysis and Reporting

```javascript
// Analyze error patterns
function analyzeErrors(world) {
  const stats = world.errorMonitor.getStats()

  // Check for error spikes
  if (stats.recent > 50) {
    console.warn('Error spike detected:', stats.recent, 'errors in last hour')
  }

  // Find most problematic categories
  const categoryStats = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  console.log('Top error categories:')
  categoryStats.forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`)
  })

  // Check unified stats
  if (stats.unified) {
    console.log('Combined client+server stats:')
    console.log('  Total:', stats.unified.total)
    console.log('  Unique:', stats.unified.unique)
    console.log('  By level:', stats.unified.byLevel)
    console.log('  By source:', stats.unified.bySource)
  }
}

// Generate error report
function generateErrorReport(world) {
  const stats = world.errorMonitor.getStats()
  const recentErrors = world.errorMonitor.getErrors({ limit: 100 })

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: stats.total,
      recent: stats.recent,
      critical: stats.critical
    },
    topErrors: stats.unified.mostCommon,
    recentErrors: recentErrors.map(e => ({
      timestamp: e.timestamp,
      type: e.type,
      message: e.args.message || 'Unknown',
      side: e.side,
      count: e.count
    }))
  }

  return JSON.stringify(report, null, 2)
}
```

### Error Filtering and Deduplication

```javascript
// Client-side error filtering
class SmartErrorHandler {
  constructor(client) {
    this.client = client
    this.ignoredPatterns = [
      /ResizeObserver loop/,
      /Script error\./,
      /Loading chunk/
    ]
  }

  shouldIgnore(error) {
    const message = error.message || String(error)
    return this.ignoredPatterns.some(pattern => pattern.test(message))
  }

  handleError(error, context) {
    if (this.shouldIgnore(error)) {
      return // Skip noisy errors
    }

    this.client.errorHandler.handleError(error, context)
  }
}

// Server-side deduplication is automatic via ErrorEventBus
```

### Error Recovery Patterns

```javascript
// Automatic retry with error tracking
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url)
    } catch (err) {
      lastError = err

      client.errorHandler.handleError(err, {
        category: 'network',
        metadata: {
          attempt: i + 1,
          maxRetries,
          url
        }
      })

      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }

  // Final failure
  client.errorHandler.critical('Fetch failed after retries', {
    url,
    attempts: maxRetries,
    error: lastError.message
  })

  throw lastError
}
```

### Integration with App Scripts

```javascript
// In app script
export function update(world, dt) {
  try {
    // Your app logic
    updateGameState(world, dt)
  } catch (err) {
    // Errors automatically forwarded to ErrorMonitor
    // via App.js wrapper, but you can add context:
    if (world.errorMonitor) {
      world.errorMonitor.captureError('app.script.update', {
        message: err.message,
        app: this.data.id,
        state: getGameState()
      }, err.stack)
    }

    // Implement fallback behavior
    enterSafeMode(world)
  }
}
```

### Error Aggregation for Dashboards

```javascript
// Aggregate error data for monitoring dashboard
class ErrorDashboard {
  constructor(world) {
    this.world = world
    this.updateInterval = 5000 // 5 seconds
    this.startMonitoring()
  }

  startMonitoring() {
    setInterval(() => {
      this.update()
    }, this.updateInterval)
  }

  update() {
    const stats = this.world.errorMonitor.getStats()
    const recentErrors = this.world.errorMonitor.getErrors({
      limit: 10,
      since: Date.now() - this.updateInterval
    })

    const dashboardData = {
      timestamp: Date.now(),
      errorRate: recentErrors.length / (this.updateInterval / 1000),
      totalErrors: stats.total,
      criticalErrors: stats.critical,
      errorsByCategory: stats.byType,
      errorsBySource: stats.unified.bySource,
      topErrors: stats.unified.mostCommon.slice(0, 5),
      recentActivity: recentErrors.map(e => ({
        time: e.timestamp,
        type: e.type,
        message: e.args.message,
        source: e.side
      }))
    }

    this.sendToDashboard(dashboardData)
  }

  sendToDashboard(data) {
    // Send to monitoring service
    fetch('https://monitoring.example.com/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silent fail to avoid error loops
    })
  }
}
```

## Testing Examples

### Unit Testing Error Events

```javascript
import { createErrorEvent, serializeErrorEvent, ErrorLevels, ErrorSources } from '../src/core/schemas/ErrorEvent.schema.js'

describe('ErrorEvent', () => {
  test('creates error event with proper structure', () => {
    const error = new Error('Test error')
    const event = createErrorEvent(error, {
      category: 'test',
      source: ErrorSources.SDK
    }, ErrorLevels.ERROR)

    expect(event.id).toBeDefined()
    expect(event.level).toBe(ErrorLevels.ERROR)
    expect(event.category).toBe('test')
    expect(event.source).toBe(ErrorSources.SDK)
    expect(event.message).toBe('Test error')
    expect(event.count).toBe(1)
  })

  test('serializes and deserializes correctly', () => {
    const error = new Error('Test')
    const original = createErrorEvent(error, {}, ErrorLevels.ERROR)
    const serialized = serializeErrorEvent(original)
    const deserialized = deserializeErrorEvent(serialized)

    expect(deserialized.id).toBe(original.id)
    expect(deserialized.message).toBe(original.message)
  })
})
```

### Integration Testing

```javascript
import { ErrorEventBus } from '../src/core/utils/ErrorEventBus.js'

describe('ErrorEventBus', () => {
  test('deduplicates identical errors', () => {
    const bus = new ErrorEventBus()
    const events = []

    bus.register((event, isDuplicate) => {
      events.push({ event, isDuplicate })
    })

    const error = new Error('Duplicate error')
    bus.emit(error, { category: 'test' }, 'error')
    bus.emit(error, { category: 'test' }, 'error')

    expect(events).toHaveLength(2)
    expect(events[0].isDuplicate).toBe(false)
    expect(events[1].isDuplicate).toBe(true)
    expect(events[1].event.count).toBe(2)
  })
})
```

## Best Practices

1. **Use Specific Categories**: Always provide meaningful error categories
2. **Add Context**: Include relevant context (app, entity, user) with errors
3. **Don't Leak Sensitive Data**: Avoid including passwords, tokens, or PII
4. **Handle Errors Gracefully**: Use try-catch and provide fallback behavior
5. **Monitor Critical Errors**: Set up alerts for critical error patterns
6. **Clean Up Old Errors**: ErrorMonitor automatically cleans errors older than 24 hours
7. **Test Error Handling**: Write tests that verify error reporting works correctly
8. **Avoid Error Loops**: Catch errors in error handlers to prevent infinite loops
9. **Use Appropriate Levels**: error for critical, warn for potential issues, info for notices
10. **Review Error Statistics**: Regularly check error stats to identify patterns
