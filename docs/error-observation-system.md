# Error Observation System

Comprehensive server-side error monitoring that captures ALL client errors and reports them to stderr with proper formatting, aggregation, and alerting.

## Architecture

```
Client Error
  ↓
SDK ErrorHandler.handleError()
  ↓
socket.emit('errorEvent', errorEvent)
  ↓
ServerNetwork.onErrorEvent(socket, errorEvent)
  ↓
ErrorObserver.recordClientError(clientId, error, metadata)
  ↓
ErrorFormatter.formatForStderr(error, context)
  ↓
process.stderr.write(formatted)
  ↓
Console displays: timestamp, severity, context, message, stack
```

## Components

### 1. ErrorObserver (src/server/services/ErrorObserver.js)

Comprehensive client error tracking and analysis.

**Features:**
- Collects errors from all connected clients
- Aggregates by client, severity, category, error type
- Real-time stderr logging with proper formatting
- Error pattern detection (duplicate errors, cascading failures)
- Alert thresholds (warning at 10 errors, critical at 25 errors)
- Error context preservation (client info, app, user, timestamp)
- Rate limiting to prevent spam
- Persistent error history (searchable)

**Methods:**
- `recordClientError(clientId, error, metadata)` - Record error from client
- `getActiveErrors()` - Get errors from last 5 minutes
- `getErrorStats()` - Aggregate statistics
- `getErrorsByClient(clientId)` - Client-specific errors
- `getErrorsByCategory(category)` - Category-specific errors
- `getErrorPatterns()` - Detected error patterns
- `clearErrors()` - Clear history
- `exportErrors(format)` - Export for debugging

### 2. ErrorFormatter (src/server/utils/ErrorFormatter.js)

Formats errors for stderr with proper structure and coloring.

**Functions:**
- `formatForStderr(error, context)` - Full error formatting
- `formatTimestamp(timestamp)` - ISO timestamp with timezone
- `formatSeverity(level)` - Colored severity (ERROR, WARN, INFO)
- `formatContext(context)` - Client/app/user context
- `formatStack(stack)` - Readable stack trace
- `formatErrorSummary(stats)` - Aggregate summary
- `formatAlert(message, level)` - Alert formatting

**Output Example:**
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

### 3. StderrLogger (src/server/utils/StderrLogger.js)

Centralized stderr logging with formatting and rate limiting.

**Features:**
- Timestamp all output
- Severity-based formatting
- Rate limiting (don't spam)
- Grouping of similar errors
- Colorized output (if TTY)
- Plain output (if redirected)

**Methods:**
- `error(message, context)` - Error level
- `warn(message, context)` - Warning level
- `info(message, context)` - Info level
- `group(message)` - Group related messages
- `table(data)` - Format as table
- `separator()` - Visual separator

### 4. ServerNetwork Integration

Updated to forward all client errors to ErrorObserver:

```javascript
onErrorEvent = (socket, errorEvent) => {
  const metadata = {
    realTime: true,
    clientId: socket.id,
    userId: socket.player?.data?.id,
    userName: socket.player?.data?.name,
    clientIP: socket.ws?.remoteAddress || 'unknown',
    timestamp: Date.now()
  }

  errorObserver.recordClientError(socket.id, errorEvent, metadata)
  // ... also forwards to ErrorMonitor and MCP subscribers
}
```

### 5. ErrorMonitor Enhancements

New methods for server-side error reporting:

- `reportServerError(errorEvent, errorData)` - Format and log to stderr
- `getServerErrorReport()` - Combined local + client error stats
- `captureClientError(clientId, error)` - Manually capture error
- `checkAlertThresholds()` - Check for alert conditions

## Alert System

### Thresholds

- **Warning**: 10 errors in last minute
- **Critical**: 25 errors in last minute
- **Cascade Detection**: 5 errors of same category from different clients

### Alert Cooldown

Alerts have a 60-second cooldown to prevent spam.

### Alert Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL ALERT: High error rate detected across all clients
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Error Statistics

The system tracks:

- Total errors
- Errors in last minute
- Errors in last hour
- Errors by level (ERROR, WARN, INFO)
- Errors by category (app.script, physics, network, etc)
- Errors by client
- Top error patterns
- Affected clients per pattern

## Error Patterns

Automatically detects:

- Duplicate errors (same message, same client)
- Cascading failures (same error, multiple clients)
- High-frequency errors (many errors, short time)
- Client-specific issues (one client, many errors)

## Export Formats

### JSON Export

```javascript
errorObserver.exportErrors('json')
```

Returns complete error data with statistics.

### Summary Export

```javascript
errorObserver.exportErrors('summary')
```

Returns human-readable summary:

```
ERROR OBSERVATION SUMMARY
════════════════════════════════════════════════════════════

Total Errors: 15
Last Minute: 12
Last Hour: 15
Active Clients: 8

By Level:
  error: 12
  warn: 3

By Category:
  network.disconnected: 7
  app.script.runtime: 3
  physics.collision: 2

Top Error Patterns:
  1. WebSocket connection lost
     Count: 7, Clients: 7
  2. ReferenceError: config is not defined
     Count: 3, Clients: 2
```

## Usage

### Start Server

Error observation is automatic when server starts. All client errors are captured and logged to stderr.

### Monitor Errors

```bash
# View real-time errors
npm run dev 2>&1 | grep ERROR

# Save errors to file
npm run dev 2>errors.log

# Filter by category
npm run dev 2>&1 | grep "app.script"
```

### Query Errors Programmatically

```javascript
// Get error statistics
const stats = errorObserver.getErrorStats()

// Get errors by client
const clientErrors = errorObserver.getErrorsByClient('alice-123')

// Get errors by category
const scriptErrors = errorObserver.getErrorsByCategory('app.script.runtime')

// Get error patterns
const patterns = errorObserver.getErrorPatterns()

// Export for debugging
const summary = errorObserver.exportErrors('summary')
```

### Clear Errors

```javascript
// Clear all errors
const count = errorObserver.clearErrors()

// Clear specific client errors
const cleared = errorObserver.clearClientErrors('alice-123')
```

## Testing

Run the test suite:

```bash
node test/error-observer.test.js
```

This simulates various error scenarios and verifies:
- Error recording and formatting
- Statistics calculation
- Pattern detection
- Alert triggering
- Export functionality

## Color Support

The formatter automatically detects TTY mode:

- **TTY mode (terminal)**: Full ANSI colors
- **Redirected mode (file)**: Plain text, no colors

This ensures logs are readable in both console and log files.

## Performance

- Maximum 1000 errors stored (oldest dropped)
- Rate limiting prevents stderr spam
- Pattern cleanup runs automatically
- O(1) client lookup via Map
- O(1) category lookup via Map

## Integration with ErrorMonitor

ErrorObserver works alongside the existing ErrorMonitor:

- **ErrorMonitor**: Local error tracking, error bus, MCP integration
- **ErrorObserver**: Client error observation, stderr reporting, pattern detection

Both systems receive client errors and can be used independently or together.
