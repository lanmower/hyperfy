# Error Monitoring & Observability Guide

## Overview

The Hyperfy error monitoring system provides real-time visibility into client-side errors with automatic reporting to the server, rich diagnostic data, and developer-friendly APIs.

## Architecture

```
Client Side:
  ┌─ Global Error Interceptor
  ├─ Error Monitor (captures errors)
  └─ ClientErrorReporter (sends to server)
         │
         └──────── Network ────────>
                                     │
Server Side:
                                     ▼
                          ServerNetwork.onClientError
                                     │
                                     └──> ErrorMonitor.receiveClientError
                                                     │
                                     ┌───────────────┼────────────┐
                                     ▼               ▼            ▼
                        ErrorRoutes  Analytics  Dashboard   WebSocket Stream
```

## Key Components

### ClientErrorReporter
**Location**: `src/core/systems/monitors/ClientErrorReporter.js`

Forwards errors from client to server with enriched context:

```javascript
// Features:
- Automatic error forwarding via network
- Network failure buffering (up to 50 errors)
- Diagnostic data enrichment:
  - Memory usage
  - Player state
  - URL and user agent
  - Timestamp
- Periodic flush of buffered errors
```

### ServerErrorDashboard
**Location**: `src/server/systems/ServerErrorDashboard.js`

Server-side error aggregation and analysis:

```javascript
// Features:
- Records all client errors (up to 1000 recent)
- Error statistics and trending
- Per-user error tracking
- Error filtering and search
- Top errors identification
- Error export for analysis
```

## API Endpoints

### Get Errors
```bash
GET /api/errors?limit=100&type=ReferenceError&since=1702900000000

Query Parameters:
- limit: Max errors to return (default: 100)
- type: Filter by error type
- since: Unix timestamp, errors after this time
- side: Filter by 'client' or 'server'
- critical: true|false

Response:
{
  errors: [
    {
      id: "...",
      type: "ReferenceError",
      message: "Cannot read properties of undefined",
      stack: "...",
      context: {
        url: "http://localhost:3000",
        diagnostics: {
          memory: { usedJSHeapSize: ... },
          playerState: { id: "...", position: [...] }
        }
      }
    }
  ],
  stats: { total: 42, critical: 3, byType: {...} },
  timestamp: "2025-12-24T..."
}
```

### Get Error Statistics
```bash
GET /api/errors/stats

Response:
{
  total: 125,
  critical: 8,
  byType: {
    "ReferenceError": 45,
    "TypeError": 32,
    "SyntaxError": 10
  },
  byUser: {
    "user-123": 34,
    "user-456": 21
  },
  topErrors: [
    { type: "ReferenceError", count: 45 },
    { type: "TypeError", count: 32 }
  ],
  topUsers: [
    { userId: "user-123", count: 34 },
    { userId: "user-456", count: 21 }
  ]
}
```

### Get Critical Errors
```bash
GET /api/errors/critical?limit=50

Returns only errors with level='error'
```

### Get User Errors
```bash
GET /api/errors/user/:userId

Returns all errors from specific user
```

### Real-Time WebSocket Stream
```bash
GET /api/errors/stream (WebSocket)

Connection returns:
{
  event: 'connected',
  data: {
    stats: {...},
    recentErrors: [...]
  }
}

Then streams errors as:
{
  event: 'error',
  data: {...error object...},
  timestamp: "..."
}
```

### Clear Errors
```bash
POST /api/errors/clear

Response:
{
  cleared: 125,
  timestamp: "..."
}
```

## Usage Examples

### Monitor Errors in Real-Time (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:3000/api/errors/stream')

ws.onmessage = (event) => {
  const { event: type, data, timestamp } = JSON.parse(event.data)

  if (type === 'error') {
    console.log(`[${timestamp}] Error: ${data.error.type}: ${data.error.message}`)
    if (data.error.level === 'error') {
      notifyAdmin(`Critical error from ${data.clientId}`)
    }
  }
}
```

### Query Errors (Fetch API)
```javascript
// Get all errors in last hour
const since = Date.now() - 3600000
const response = await fetch(`/api/errors?limit=100&since=${since}`)
const { errors, stats } = await response.json()

console.log(`Total errors: ${stats.total}`)
console.log(`Critical errors: ${stats.critical}`)

// Group by type
const byType = {}
errors.forEach(err => {
  byType[err.type] = (byType[err.type] || 0) + 1
})
console.log('Errors by type:', byType)
```

### Get Specific User's Errors
```javascript
const userId = 'user-456'
const response = await fetch(`/api/errors/user/${userId}`)
const errors = await response.json()

console.log(`User ${userId} experienced ${errors.length} errors`)
```

## Diagnostic Data Captured

### Memory Information
```javascript
{
  memory: {
    usedJSHeapSize: 125000000,      // Bytes in use
    totalJSHeapSize: 250000000,     // Total allocated
    jsHeapSizeLimit: 2000000000     // Maximum available
  }
}
```

### Player State
```javascript
{
  playerState: {
    id: "vNmrB574FI",
    position: [10.5, 1.2, -5.3],    // X, Y, Z coordinates
    health: 100                      // Health points
  }
}
```

### Context Information
```javascript
{
  context: {
    url: "http://localhost:3000/?room=test",
    userAgent: "Mozilla/5.0...",
    timestamp: 1703462400000,
    diagnostics: {...}              // Memory + player state
  }
}
```

## Error Types

### Critical Errors
Automatically marked as critical:
- `ReferenceError` - Undefined variable access
- `TypeError` - Invalid operation on wrong type
- `SyntaxError` - Code parsing error
- `RangeError` - Value out of acceptable range

### Context Errors
- Script execution failures
- API request failures
- Network errors
- Resource loading failures

## Best Practices

### 1. Monitor Critical Errors in Production
```javascript
setInterval(async () => {
  const response = await fetch('/api/errors/critical?limit=10')
  const critical = await response.json()

  if (critical.length > 0) {
    sendSlackNotification(`🚨 ${critical.length} critical errors detected`)
  }
}, 60000) // Check every minute
```

### 2. Track Error Trends
```javascript
async function getErrorTrend() {
  const now = Date.now()
  const oneHourAgo = now - 3600000

  const response = await fetch(`/api/errors/stats?since=${oneHourAgo}`)
  const stats = await response.json()

  return {
    lastHour: stats.total,
    trend: stats.byType
  }
}
```

### 3. User-Specific Debugging
```javascript
async function getUserErrors(userId) {
  const response = await fetch(`/api/errors/user/${userId}`)
  const errors = await response.json()

  return {
    count: errors.length,
    types: [...new Set(errors.map(e => e.type))],
    latest: errors[0]
  }
}
```

### 4. Export Errors for Analysis
```javascript
async function exportErrorReport() {
  const response = await fetch('/api/errors/export')
  const report = await response.json()

  const csv = convertToCSV(report.errors)
  downloadFile(csv, `errors-${new Date().toISOString()}.csv`)
}
```

## Troubleshooting

### Errors Not Appearing on Server

1. **Check ClientErrorReporter initialization**
   ```javascript
   // Verify it's enabled
   console.log(world.errorMonitor.clientReporter?.enabled)
   ```

2. **Check network connectivity**
   - Verify WebSocket is connected
   - Check network errors in console
   - Verify clientReporter buffer: `world.errorMonitor.clientReporter?.getBufferStats()`

3. **Check server handler**
   - Verify ServerNetwork has `onClientError` method
   - Check server logs for error processing

### WebSocket Stream Not Connecting

```javascript
const ws = new WebSocket('ws://localhost:3000/api/errors/stream')
ws.onerror = (err) => console.log('Connection error:', err)
ws.onclose = () => console.log('Connection closed')
```

### Too Many Buffered Errors

```javascript
// Monitor buffer status
const stats = world.errorMonitor.clientReporter?.getBufferStats()
if (stats.bufferedErrors > stats.maxBuffer * 0.8) {
  console.warn('Error buffer getting full, network issues?')
}
```

## Performance Considerations

- **Client overhead**: Minimal (~1-2ms per error)
- **Server memory**: Up to 1000 errors stored in memory
- **Network bandwidth**: Small (errors are compact)
- **Diagnostic collection**: Async, non-blocking

## Security

- Client errors are received from untrusted source
- Validate error data before processing
- Sanitize stack traces in logs
- Don't expose internal paths to clients
- Rate-limit error submissions per user

## Future Enhancements

Potential improvements:
- Error pattern detection (similar errors grouped)
- Automatic alerting to developers
- Error reproduction logs
- Source map integration for minified errors
- User session replay correlation
- A/B test error correlation
