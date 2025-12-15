# Error Observation Quick Start

Quick reference for the server-side error observation system.

## What It Does

Captures ALL client errors and reports them to stderr with:
- Timestamps
- Client information
- Error context (app, user, entity)
- Stack traces
- Aggregated statistics
- Pattern detection
- Automatic alerting

## Error Flow

```
Client Error → SDK → WebSocket → Server → ErrorObserver → stderr
```

## Stderr Output Example

```
[2025-12-15T16:30:45.123Z] 🔴ERROR [app:MetaverseUI] [client:alice@192.168.1.10] [user:Alice#abc123]
  Category: app.script.runtime
  Message: ReferenceError: config is not defined
  Context: userId=alice, entityId=e123
  Stack:
    ReferenceError: config is not defined
    at MetaverseUI.js:127:15
    at updateUI (app.js:45:20)
  ────────────────────────────────────────────────────────────
```

## Monitoring Errors

### Real-time Monitoring

```bash
# View all errors
npm run dev 2>&1 | grep ERROR

# View warnings
npm run dev 2>&1 | grep WARN

# View specific category
npm run dev 2>&1 | grep "app.script"

# Save to file
npm run dev 2>errors.log
```

### Query Errors Programmatically

```javascript
import { errorObserver } from './src/server/services/ErrorObserver.js'

// Get statistics
const stats = errorObserver.getErrorStats()
console.log(stats)

// Get errors by client
const clientErrors = errorObserver.getErrorsByClient('alice-123')

// Get errors by category
const scriptErrors = errorObserver.getErrorsByCategory('app.script.runtime')

// Get error patterns
const patterns = errorObserver.getErrorPatterns()

// Export summary
const summary = errorObserver.exportErrors('summary')
console.log(summary)
```

## Alert Thresholds

| Threshold | Condition | Action |
|-----------|-----------|--------|
| Warning | 10 errors/minute | Yellow alert banner |
| Critical | 25 errors/minute | Red alert banner |
| Cascade | 5 same errors from different clients | Pattern alert |

## Error Categories

Automatically categorized:

- `app.script.compile` - Syntax errors
- `app.script.runtime` - Runtime errors (ReferenceError, TypeError)
- `app.load` - Loading failures
- `app.model.load` - GLTF/model loading
- `network` - Network errors
- `network.timeout` - Request timeouts
- `physics` - Physics errors
- `physics.collision` - Collision issues
- `render` - Rendering/WebGL errors
- `unknown` - Uncategorized

## Statistics Available

```javascript
{
  total: 15,              // Total errors stored
  lastMinute: 12,         // Errors in last 60 seconds
  lastHour: 15,           // Errors in last hour
  byLevel: {              // By severity
    error: 10,
    warn: 3,
    info: 2
  },
  byCategory: {           // By category
    'app.script.runtime': 5,
    'network.timeout': 3
  },
  byClient: 8,            // Number of clients with errors
  errors: 10,             // ERROR level count
  warnings: 3,            // WARN level count
  critical: 2,            // Critical errors
  topPatterns: [...],     // Most common errors
  activeClients: 8        // Clients with active errors
}
```

## Error Patterns

Tracks:
- Message frequency
- Affected clients
- First/last occurrence
- Total count

Example:
```javascript
{
  category: 'app.script.runtime',
  message: 'ReferenceError: config is not defined',
  count: 15,
  clients: Set(3),  // 3 different clients
  firstSeen: 1765814445123,
  lastSeen: 1765814567890
}
```

## Common Operations

### Clear All Errors

```javascript
const count = errorObserver.clearErrors()
console.log(`Cleared ${count} errors`)
```

### Clear Client Errors

```javascript
const count = errorObserver.clearClientErrors('alice-123')
console.log(`Cleared ${count} errors for client`)
```

### Export for Debugging

```javascript
// JSON format
const json = errorObserver.exportErrors('json')
fs.writeFileSync('errors.json', json)

// Summary format
const summary = errorObserver.exportErrors('summary')
fs.writeFileSync('errors.txt', summary)
```

## Integration Points

### ServerNetwork

Automatically forwards all `errorEvent` and `errorReport` packets to ErrorObserver.

### ErrorMonitor

Works alongside ErrorMonitor:
- ErrorMonitor: Local tracking, error bus, MCP
- ErrorObserver: Client observation, stderr, patterns

### SDK ErrorHandler

Client errors automatically sent to server via WebSocket.

## Testing

Run tests:

```bash
# Basic test
node test/error-observer.test.js

# Integration test
node test/error-integration-full.test.js
```

## Performance

- Stores max 1000 errors (oldest dropped)
- Rate limiting prevents spam (1s for errors, 5s for warnings)
- O(1) lookups via Map
- Automatic cleanup of old patterns
- 60s cooldown on alerts

## Color Support

Automatic detection:
- Terminal: Full ANSI colors
- File redirect: Plain text

Disable colors:
```bash
NO_COLOR=1 npm run dev
```

## Files

- `src/server/services/ErrorObserver.js` - Core observer
- `src/server/utils/ErrorFormatter.js` - Formatting
- `src/server/utils/StderrLogger.js` - Logging
- `src/core/systems/ErrorMonitor.js` - Integration
- `src/core/systems/ServerNetwork.js` - Packet handling
