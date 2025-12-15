# Unified Error Event System Integration

This document describes the unified error event interface that enables cross-platform error tracking consistency between the SDK ErrorHandler and Hyperfy ErrorMonitor.

## Architecture Overview

The error event system consists of four main components:

1. **ErrorEvent Schema** (`src/core/schemas/ErrorEvent.schema.js`) - Unified error event structure
2. **ErrorEventBus** (`src/core/utils/ErrorEventBus.js`) - Centralized error event handling
3. **SDK ErrorHandler** (`hypersdk/src/utils/ErrorHandler.js`) - Client-side error collection
4. **Hyperfy ErrorMonitor** (`src/core/systems/ErrorMonitor.js`) - Server-side error integration

## Error Event Structure

```javascript
{
  id: string,                    // Unique identifier
  timestamp: number,             // Date.now()
  level: 'error' | 'warn' | 'info' | 'debug',
  category: string,              // e.g., 'app.load', 'network', 'physics'
  source: 'client' | 'server' | 'sdk',
  context: object,               // app, entity, user context
  message: string,               // Error message
  stack: string,                 // Stack trace (optional)
  count: number,                 // Deduplication count
  firstSeen: number,             // First occurrence timestamp
  lastSeen: number,              // Last occurrence timestamp
  metadata: object,              // Custom fields
  resolved: boolean              // Error resolution status
}
```

## Error Flow

### Client-Side Flow

1. SDK ErrorHandler catches client errors
2. Creates ErrorEvent using schema
3. Sends via WebSocket to server using `errorEvent` packet
4. Server ErrorMonitor receives and processes
5. Error appears in unified error statistics

### Server-Side Flow

1. ErrorMonitor intercepts global errors
2. Creates ErrorEvent using schema
3. Emits through ErrorEventBus
4. MCP subscribers receive real-time notifications
5. Error statistics updated

## Integration Points

### SDK ErrorHandler

The ErrorHandler automatically:
- Creates ErrorEvents for all errors
- Deduplicates identical errors
- Sends errors to server via WebSocket
- Maintains local error statistics

```javascript
import { ErrorHandler } from '@hyperfy/sdk'

const errorHandler = new ErrorHandler()

// Errors are automatically sent to server
errorHandler.handleError(new Error('Test error'), {
  category: 'app.script.runtime'
})

// Get local statistics
const stats = errorHandler.getErrorStats()
```

### Hyperfy ErrorMonitor

The ErrorMonitor automatically:
- Receives errors from SDK clients
- Integrates client/server errors
- Provides unified statistics
- Forwards to MCP subscribers

```javascript
// Server-side error capture
world.errorMonitor.captureError('app.load', {
  message: 'Failed to load blueprint'
}, stackTrace)

// Get unified statistics
const stats = world.errorMonitor.getStats()
console.log(stats.unified) // Combined client + server stats
```

## Network Protocol

### Error Event Packet

Packet type: `errorEvent`

```javascript
{
  // Serialized ErrorEvent
  id: string,
  timestamp: number,
  level: string,
  category: string,
  source: string,
  context: object,
  message: string,
  stack: string,
  count: number,
  firstSeen: number,
  lastSeen: number,
  metadata: object,
  resolved: boolean
}
```

### Error Report Packet (Legacy)

Packet type: `errorReport`

```javascript
{
  error: ErrorEvent,
  realTime: boolean,
  critical: boolean
}
```

## Error Categories

Categories use hierarchical naming:

- `app.load` - Application loading errors
- `app.script.compile` - Script compilation errors
- `app.script.runtime` - Script runtime errors
- `app.model.load` - Model loading errors
- `network` - Network/WebSocket errors
- `physics` - Physics simulation errors
- `render` - Rendering errors
- `unknown` - Uncategorized errors

## Error Levels

- `error` - Critical errors requiring attention
- `warn` - Warnings that may indicate issues
- `info` - Informational messages
- `debug` - Debug-level information

## Error Sources

- `client` - Browser/client-side errors
- `server` - Server-side errors
- `sdk` - SDK-originated errors

## Statistics

The unified statistics include:

```javascript
{
  total: number,           // Total error count
  unique: number,          // Unique error types
  recent: number,          // Errors in last hour
  byLevel: object,         // Count by level
  byCategory: object,      // Count by category
  bySource: object,        // Count by source
  mostCommon: array        // Most frequent errors
}
```

## MCP Integration

MCP servers can subscribe to real-time error events:

```javascript
// Subscribe to error events
socket.send('mcpSubscribeErrors', { options })

// Receive error events
socket.on('mcpErrorEvent', (errorData) => {
  console.log('Error:', errorData.error)
  console.log('Client:', errorData.clientId)
  console.log('Player:', errorData.playerName)
})
```

## Backward Compatibility

The system maintains backward compatibility with existing error handlers:

- SDK ErrorHandler API unchanged
- ErrorMonitor methods unchanged
- Additional `listeners` Set for legacy MCP subscriptions
- Error statistics include both old and new formats

## Testing

Run the integration test to verify the system:

```bash
node test/error-event-integration.test.js
```

The test verifies:
- ErrorEvent schema creation
- Serialization/deserialization
- ErrorEventBus functionality
- SDK ErrorHandler integration
- ErrorMonitor integration
- Client-to-server error forwarding
- Unified statistics

## Performance Considerations

- Error deduplication prevents duplicate processing
- Maximum error history limits (500 errors)
- Automatic cleanup of old errors (24 hours)
- Silent failure on network errors to prevent loops
- Stack traces truncated to 20 lines

## Privacy and Security

- Context sanitization removes sensitive data
- Only allowed context fields transmitted
- Stack traces cleaned before transmission
- No user credentials or tokens in error events
