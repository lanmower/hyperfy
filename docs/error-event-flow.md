# Error Event Flow Diagram

## Client-to-Server Error Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Client (Browser/SDK)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Error occurs in app/script                                  │
│     ↓                                                            │
│  2. ErrorHandler.handleError(error, context)                    │
│     ↓                                                            │
│  3. createErrorEvent(error, context, level)                     │
│     ↓                                                            │
│  4. serializeErrorEvent(event)                                  │
│     ↓                                                            │
│  5. networkSender(errorEvent) → WebSocket                       │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ errorEvent packet
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Server (Hyperfy)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  6. ServerNetwork.onErrorEvent(socket, errorEvent)              │
│     ↓                                                            │
│  7. ErrorMonitor.receiveClientError(errorData)                  │
│     ↓                                                            │
│  8. deserializeErrorEvent(errorData.error)                      │
│     ↓                                                            │
│  9. ErrorEventBus.emit(error, context, level)                   │
│     ↓                                                            │
│  10. ErrorMonitor.forwardErrorEvent(event, isDuplicate)         │
│      ↓                                                           │
│      ├─→ Update error history                                   │
│      ├─→ Update statistics                                      │
│      ├─→ Notify listeners (MCP subscriptions)                   │
│      └─→ Stream to MCP endpoint (if configured)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Server-Side Error Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Server (Hyperfy)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Error occurs (uncaught exception, script error, etc.)       │
│     ↓                                                            │
│  2. Global error handler intercepts                             │
│     ↓                                                            │
│  3. ErrorMonitor.captureError(type, args, stack)                │
│     ↓                                                            │
│  4. createErrorEvent(error, context, level)                     │
│     ↓                                                            │
│  5. ErrorEventBus.emit(error, context, level)                   │
│     ↓                                                            │
│  6. ErrorMonitor.forwardErrorEvent(event, isDuplicate)          │
│      ↓                                                           │
│      ├─→ Update error history                                   │
│      ├─→ Update statistics                                      │
│      ├─→ Notify listeners (MCP subscriptions)                   │
│      ├─→ Stream to MCP endpoint (if configured)                 │
│      └─→ Format and write to stderr (if critical)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## ErrorEventBus Internal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ErrorEventBus.emit(error, context, level)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. createErrorEvent(error, context, level)                     │
│     ↓                                                            │
│  2. findExisting(event)                                         │
│     ├─→ Found: mergeErrorEvents(existing, event)                │
│     │   ↓                                                        │
│     │   ├─→ Update count, lastSeen                              │
│     │   └─→ notifyHandlers(merged, isDuplicate=true)            │
│     │                                                            │
│     └─→ Not found: addEvent(event)                              │
│         ↓                                                        │
│         ├─→ Add to errorHistory                                 │
│         ├─→ Add to errorMap                                     │
│         ├─→ Update statistics                                   │
│         └─→ notifyHandlers(event, isDuplicate=false)            │
│                                                                  │
│  3. Handlers receive event:                                     │
│     ↓                                                            │
│     ├─→ ErrorMonitor.forwardErrorEvent()                        │
│     ├─→ Custom registered handlers                              │
│     └─→ EventBus.emit('error', event, isDuplicate)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## MCP Subscription Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ MCP Client                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. socket.send('mcpSubscribeErrors', options)                  │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Server (Hyperfy)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2. ServerNetwork.onMcpSubscribeErrors(socket, options)         │
│     ↓                                                            │
│  3. Create errorListener callback                               │
│     ↓                                                            │
│  4. ErrorMonitor.listeners.add(errorListener)                   │
│     ↓                                                            │
│  5. socket.mcpErrorSubscription = { active: true }              │
│                                                                  │
│  [When error occurs]                                            │
│  ↓                                                               │
│  6. ErrorMonitor.forwardErrorEvent() → listeners.forEach()      │
│     ↓                                                            │
│  7. errorListener('error', errorData)                           │
│     ↓                                                            │
│  8. socket.send('mcpErrorEvent', errorData)                     │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ MCP Client                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  9. socket.on('mcpErrorEvent', (data) => { ... })               │
│     ↓                                                            │
│  10. Process real-time error notification                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### ErrorEvent
```javascript
{
  id: "lqx2k9a-8jf3k2l9s",
  timestamp: 1702834567890,
  level: "error",
  category: "app.script.runtime",
  source: "sdk",
  context: {
    app: "my-app",
    entity: "ent_123",
    user: "user_456"
  },
  message: "Cannot read property 'x' of undefined",
  stack: "Error: Cannot read property...\n  at Object.update...",
  count: 3,
  firstSeen: 1702834567890,
  lastSeen: 1702834590123,
  metadata: {},
  resolved: false
}
```

### Error Statistics
```javascript
{
  total: 156,
  unique: 23,
  recent: 12,
  byLevel: {
    error: 145,
    warn: 10,
    info: 1
  },
  byCategory: {
    "app.script.runtime": 89,
    "network": 34,
    "app.load": 23,
    "physics": 10
  },
  bySource: {
    sdk: 98,
    client: 45,
    server: 13
  },
  mostCommon: [
    {
      message: "Cannot read property 'x' of undefined",
      category: "app.script.runtime",
      count: 45,
      level: "error",
      lastSeen: 1702834590123
    }
  ]
}
```

## Key Features

### Deduplication
- Errors with same message, category, level, and context are merged
- Count incremented on each occurrence
- firstSeen and lastSeen timestamps maintained

### Backpressure Handling
- Maximum error history (500 errors)
- Automatic cleanup of old errors (24 hours)
- Silent failure on network errors

### Privacy
- Context sanitization (only allowed fields)
- Stack trace truncation (20 lines max)
- No sensitive data in error events

### Performance
- Efficient Map-based deduplication
- Minimal serialization overhead
- Non-blocking error forwarding
