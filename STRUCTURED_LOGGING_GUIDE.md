# Structured Logging Guide

Unified structured logging system with log levels, context tracking, and multiple handlers.

## Quick Start

### Basic Usage (ComponentLogger)

```javascript
import { ComponentLogger } from './utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('EntitySpawner')

logger.info('Entity spawned', { entityId: '123', type: 'Player' })
logger.error('Spawn failed', { error: 'Invalid position' })
logger.warn('Missing component', { component: 'Physics' })
logger.debug('Debug info', { state: { x: 0, y: 1 } })
```

### Structured Logger (Advanced)

```javascript
import { StructuredLogger } from './utils/logging/StructuredLogger.js'

const logger = new StructuredLogger('MySystem', {
  minLevel: 'DEBUG',
  includeTimestamp: true
})

logger.info('Operation completed', { duration: '523ms' })
logger.pushContext('userId', '456')
logger.info('Action performed')  // Automatically includes userId
logger.popContext('userId')
```

## Architecture

### Three-Tier System

```
ComponentLogger (simple, backward-compatible)
       ↓
StructuredLogger (full-featured, extensible)
       ↓
Handlers (console, file, remote, buffer)
```

## Log Levels

```javascript
LogLevels = {
  TRACE: 0,    // Detailed debugging
  DEBUG: 1,    // Development info
  INFO: 2,     // General information (default)
  WARN: 3,     // Warning conditions
  ERROR: 4,    // Error conditions
  FATAL: 5,    // Fatal errors
  SILENT: 6    // No logging
}
```

## Features

### Context Stack

```javascript
logger.pushContext('requestId', 'req-123')
logger.pushContext('userId', 'user-456')

logger.info('Processing')  // Includes both requestId and userId

logger.popContext('userId')
logger.info('Cleanup')     // Includes only requestId
```

### Metadata

```javascript
logger.setMetadata('version', '1.0.0')
logger.setMetadata('environment', 'production')

logger.info('Started')  // All future logs include version and environment
```

### Multiple Handlers

```javascript
const logger = new StructuredLogger('App')

// Console handler (default)
logger.addHandler(consoleHandler)

// Buffer handler (in-memory)
const buffer = createLogBuffer(1000)
logger.addHandler(buffer.handler)

// Later: retrieve logs
const recentLogs = buffer.getLast(10)
const errors = buffer.getByLevel('ERROR')
```

### Timing

```javascript
const timer = logger.time('Database query')
// ... do work ...
const elapsed = timer()  // Logs: "Database query completed { duration: '123ms' }"
```

### Child Loggers

```javascript
const parentLogger = new StructuredLogger('App')
parentLogger.setMetadata('app', 'hyperfy')

const childLogger = parentLogger.createChild('Module')
// childLogger inherits parent's metadata and context stack
```

## ComponentLogger API

### Methods

```javascript
logger.error(message, context)   // Error level
logger.warn(message, context)    // Warning level
logger.info(message, context)    // Info level
logger.debug(message, context)   // Debug level
logger.trace(message, context)   // Trace level
logger.time(label)               // Start timer
```

### Static Methods

```javascript
ComponentLogger.setGlobalLevel('DEBUG')  // Set minimum log level
ComponentLogger.addGlobalHandler(fn)     // Add handler to all loggers
```

## StructuredLogger API

### Methods

```javascript
logger.log(level, message, context)      // Raw log
logger.trace(message, context)           // Trace level
logger.debug(message, context)           // Debug level
logger.info(message, context)            // Info level
logger.warn(message, context)            // Warn level
logger.error(message, context)           // Error level
logger.fatal(message, context)           // Fatal level

// Context management
logger.pushContext(key, value)           // Push to stack
logger.popContext(key)                   // Pop from stack
logger.setMetadata(key, value)           // Set metadata
logger.getContext()                      // Get combined context

// Handlers
logger.addHandler(handler)               // Add handler
logger.removeHandler(handler)            // Remove handler
logger.clearHandlers()                   // Remove all handlers

// Utilities
logger.time(label)                       // Start timer
logger.createChild(name)                 // Create child logger
logger.stats()                           // Get statistics
```

## Log Entry Format

```javascript
{
  timestamp: '2025-12-29T10:30:45.123Z',  // ISO timestamp
  level: 'INFO',                          // Log level
  category: 'EntitySpawner',              // Logger category
  message: 'Entity spawned',              // Message
  context: {                              // Additional context
    entityId: '123',
    type: 'Player',
    requestId: 'req-123'
  },
  metadata: {                             // Logger metadata
    app: 'hyperfy',
    version: '1.0.0'
  }
}
```

## Handlers

### Console Handler

```javascript
import { defaultConsoleHandler } from './utils/logging/StructuredLogger.js'

logger.addHandler(defaultConsoleHandler)
// Logs to console.log, console.warn, console.error based on level
```

### Buffer Handler

```javascript
import { createLogBuffer } from './utils/logging/StructuredLogger.js'

const buffer = createLogBuffer(1000)  // Max 1000 entries
logger.addHandler(buffer.handler)

// Retrieve logs
buffer.getAll()                // All buffered logs
buffer.getByLevel('ERROR')    // Errors only
buffer.getLast(10)            // Last 10 logs
buffer.stats()                // { size: 42, maxSize: 1000 }
buffer.clear()                // Clear buffer
```

### Custom Handler

```javascript
const remoteHandler = (logEntry) => {
  fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify(logEntry)
  }).catch(err => console.error('Log transmission failed', err))
}

logger.addHandler(remoteHandler)
```

## Integration Patterns

### With World

```javascript
export class World extends EventEmitter {
  constructor() {
    this.logger = new ComponentLogger('World')
  }

  init(options) {
    this.logger.info('Initializing world', { mode: options.mode })
    // ...
  }
}
```

### With Systems

```javascript
export class MySystem extends BaseSystem {
  constructor(world) {
    super(world)
    this.logger = new ComponentLogger(this.constructor.name)
  }

  async init() {
    this.logger.info('System initializing')
    this.logger.pushContext('systemId', this.id)
  }

  destroy() {
    this.logger.info('System destroyed')
    this.logger.popContext('systemId')
  }
}
```

### Global Setup

```javascript
// In application startup
import { ComponentLogger } from './utils/logging/ComponentLogger.js'
import { createLogBuffer, defaultConsoleHandler } from './utils/logging/StructuredLogger.js'

// Set minimum log level
ComponentLogger.setGlobalLevel('INFO')

// Add buffering for error tracking
const errorBuffer = createLogBuffer(500)
ComponentLogger.addGlobalHandler(errorBuffer.handler)

// Later: access error logs
window.__DEBUG__.logs = errorBuffer.getAll()
```

## Best Practices

### 1. Use Context for Correlation

```javascript
// Good - correlate requests
logger.pushContext('requestId', req.id)
logger.info('Processing request')
logger.popContext('requestId')

// Bad - recreate context each time
logger.info('Processing', { requestId: req.id })
logger.info('Validating', { requestId: req.id })
logger.info('Saving', { requestId: req.id })
```

### 2. Include Enough Context

```javascript
// Good
logger.error('Spawn failed', { entityId, position, error: err.message })

// Bad
logger.error('Spawn failed')
```

### 3. Use Appropriate Levels

```javascript
logger.trace('Function entry', { args })        // Extremely detailed
logger.debug('Processing step', { state })      // Development debugging
logger.info('User logged in', { userId })       // General information
logger.warn('Missing optional config', { key }) // Something unusual
logger.error('Database error', { error })       // Error condition
logger.fatal('Unrecoverable failure')           // Critical issue
```

### 4. Don't Log Sensitive Data

```javascript
// Bad - exposes password
logger.info('User login', { username, password })

// Good - redact sensitive data
logger.info('User login', { username, password: '***' })

// Better - don't log it at all
logger.info('User login', { username })
```

### 5. Use Handlers Strategically

```javascript
// Development: console + buffer
const buffer = createLogBuffer()
logger.addHandler(defaultConsoleHandler)
logger.addHandler(buffer.handler)

// Production: remote logging
logger.clearHandlers()
logger.addHandler(remoteHandler)
```

## Migration from Old Pattern

### Before

```javascript
console.log('[EntitySpawner]', 'Spawned:', id)
console.error('[EntitySpawner]', 'Failed:', error.message)
```

### After

```javascript
const logger = new ComponentLogger('EntitySpawner')
logger.info('Spawned', { entityId: id })
logger.error('Failed', { error: error.message })
```

## Files

- `src/core/utils/logging/ComponentLogger.js` - Simple API
- `src/core/utils/logging/StructuredLogger.js` - Full-featured API
- `src/core/utils/logging/LogLevels.js` - Level definitions

## Performance

- Minimal overhead per log call
- Context stack limited to 50 entries
- Buffer handler memory-bounded
- Handler errors don't break logging
- No blocking I/O in default handlers

## Next Steps

1. Update ComponentLogger usage across codebase (173+ console calls)
2. Add remote logging handler for production
3. Set up log aggregation (ELK, Datadog, etc.)
4. Configure appropriate log levels per environment
5. Add performance monitoring for critical paths
