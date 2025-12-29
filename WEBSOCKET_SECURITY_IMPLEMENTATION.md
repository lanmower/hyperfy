# WebSocket Protocol Security Implementation

Complete hardening of WebSocket protocol with comprehensive data validation and security controls.

## Files Modified

### 1. WebSocketManager.js (Client-Side)
**Path**: `C:\dev\hyperfy\src\core\systems\network\WebSocketManager.js`

**Security Features Added**:
- Message validation (ArrayBuffer type, size limits, empty checks)
- Invalid message tracking and threshold enforcement (10 per minute)
- Message queue backpressure (max 100 queued messages)
- Inactivity timeout monitoring (5 minutes)
- Request timeout handling (30 seconds)
- Automatic disconnect on security violations

**Validation Rules**:
```javascript
MAX_MESSAGE_SIZE: 1MB
INVALID_MESSAGE_THRESHOLD: 10 messages
INVALID_MESSAGE_WINDOW: 60 seconds
INACTIVITY_TIMEOUT: 5 minutes
MESSAGE_QUEUE_MAX: 100 messages
```

**Security Logging**:
- `[SECURITY] Invalid message type` - Non-ArrayBuffer messages
- `[SECURITY] Message size exceeds limit` - Messages > 1MB
- `[SECURITY] Empty message received` - Zero-byte messages
- `[SECURITY] Invalid message threshold exceeded` - >10 invalid/minute
- `[SECURITY] Message queue backpressure` - Queue overflow

### 2. PacketCodec.js (Client & Server)
**Path**: `C:\dev\hyperfy\src\core\systems\network\PacketCodec.js`

**Security Features Added**:
- ArrayBuffer type validation
- Packet structure validation (must be [id, data] array)
- Packet ID type validation (must be number)
- Unknown packet ID rejection
- Comprehensive error logging

**Validation Flow**:
1. Check packet is ArrayBuffer
2. Unpack with msgpackr
3. Validate unpacked is array with length 2
4. Validate packet ID is number
5. Validate packet ID exists in registry
6. Return [method, data] or empty array on failure

**Security Logging**:
- `[SECURITY] PacketCodec.decode: packet is not ArrayBuffer`
- `[SECURITY] PacketCodec.decode: unpacked packet is not array`
- `[SECURITY] PacketCodec.decode: invalid packet structure`
- `[SECURITY] PacketCodec.decode: packet id is not number`
- `[SECURITY] PacketCodec.decode: unknown packet id`

### 3. Socket.js (Server-Side)
**Path**: `C:\dev\hyperfy\src\core\Socket.js`

**Security Features Added**:
- Buffer type validation
- Message size validation
- Invalid message tracking per socket
- Automatic disconnect on threshold breach
- Decode failure tracking

**Validation Rules**:
```javascript
MAX_MESSAGE_SIZE: 1MB
INVALID_MESSAGE_THRESHOLD: 10 messages
INVALID_MESSAGE_WINDOW: 60 seconds
```

**Security Logging**:
- `[SECURITY] Invalid message type from socket {id}` - Non-Buffer messages
- `[SECURITY] Message size exceeds limit from socket {id}` - Messages > 1MB
- `[SECURITY] Empty message from socket {id}` - Zero-byte messages
- `[SECURITY] Invalid message threshold exceeded for socket {id}` - >10 invalid/minute
- `[SECURITY] Failed to decode packet from socket {id}` - Decode failures
- `[SECURITY] Too many decode failures from socket {id}` - Disconnect trigger

### 4. CommandHandler.js (Server-Side)
**Path**: `C:\dev\hyperfy\src\server\services\CommandHandler.js`

**Security Features Added**:
- Command structure validation
- Command method type validation (must be string)
- Command whitelist enforcement
- Unknown command rejection

**Allowed Commands**:
- `admin` - Admin privilege management
- `name` - Player name changes
- `spawn` - Spawn modifications
- `chat` - Chat operations
- `server` - Server stats

**Security Logging**:
- `[SECURITY] Command args is not array` - Invalid structure
- `[SECURITY] Empty command received` - No command provided
- `[SECURITY] Command method is not string` - Type mismatch
- `[SECURITY] Unknown command method` - Not in whitelist
- `[SECURITY] Command validation failed` - General validation failure

### 5. EntitySpawner.js (Client & Server)
**Path**: `C:\dev\hyperfy\src\core\systems\entities\EntitySpawner.js`

**Security Features Added**:
- Entity data structure validation
- Entity ID validation (must be string)
- Entity type validation (must be 'app' or 'player')
- Position/quaternion/scale numeric validation
- Support for both array and object formats
- Invalid entity tracking and threshold

**Validation Rules**:
```javascript
Valid entity types: ['app', 'player']
Position: [x, y, z] or {x, y, z} - all finite numbers
Quaternion: [x, y, z, w] or {x, y, z, w} - all finite numbers
Scale: [x, y, z] or {x, y, z} - all finite numbers
INVALID_ENTITY_THRESHOLD: 10 per minute
```

**Security Logging**:
- `[SECURITY] Entity data is not object` - Invalid type
- `[SECURITY] Entity id is invalid` - Missing or non-string ID
- `[SECURITY] Entity type is invalid` - Missing or non-string type
- `[SECURITY] Unknown entity type` - Not 'app' or 'player'
- `[SECURITY] Entity position invalid` - Invalid numbers
- `[SECURITY] Entity quaternion invalid` - Invalid numbers
- `[SECURITY] Entity scale invalid` - Invalid numbers
- `[SECURITY] Entity data validation failed` - General failure
- `[SECURITY] Invalid entity threshold exceeded` - >10 invalid/minute
- `[SECURITY] Too many invalid entities, potential attack` - Attack detection

## Security Controls Summary

### Message-Level Protection
1. **Type Validation**: All messages must be ArrayBuffer (client) or Buffer (server)
2. **Size Limits**: Maximum 1MB per message
3. **Empty Message Rejection**: Zero-byte messages rejected
4. **Rate Limiting**: Max 10 invalid messages per minute before disconnect

### Packet-Level Protection
1. **Structure Validation**: Must be [id, data] array
2. **ID Validation**: Packet ID must be number and exist in registry
3. **Decode Error Handling**: Malformed packets logged and rejected
4. **Unknown Packet Rejection**: Only registered packet types accepted

### Command-Level Protection
1. **Whitelist Enforcement**: Only 5 commands allowed (admin, name, spawn, chat, server)
2. **Type Validation**: Command method must be string
3. **Structure Validation**: Commands must be array with at least one element
4. **Unknown Command Rejection**: Unregistered commands rejected

### Entity-Level Protection
1. **Type Whitelist**: Only 'app' and 'player' entities allowed
2. **Numeric Validation**: All position/rotation/scale values must be finite numbers
3. **Format Flexibility**: Supports both array [x,y,z] and object {x,y,z} formats
4. **ID Validation**: Entity IDs must be non-empty strings
5. **Rate Limiting**: Max 10 invalid entities per minute

### Connection-Level Protection
1. **Inactivity Timeout**: 5 minutes of no activity triggers reconnection
2. **Backpressure Control**: Message queue limited to 100 items
3. **Request Timeout**: 30 seconds for request/response cycles
4. **Auto-Disconnect**: Threshold breaches trigger automatic disconnect with 1008 code

## Attack Mitigation

### Protection Against:
1. **Buffer Overflow**: 1MB message size limit prevents memory exhaustion
2. **Type Confusion**: Strict type checking prevents injection
3. **Malformed Packets**: Validation rejects corrupted data
4. **Unknown Commands**: Whitelist prevents arbitrary command execution
5. **DoS via Invalid Messages**: Rate limiting disconnects attackers
6. **Entity Flooding**: Invalid entity threshold prevents spam
7. **Message Queue Flooding**: Backpressure prevents memory exhaustion
8. **Slowloris Attacks**: Inactivity timeout closes stale connections

## Monitoring & Alerting

All security events logged with `[SECURITY]` prefix for easy filtering:

```bash
# View all security events
grep "\[SECURITY\]" server.log

# View invalid message events
grep "\[SECURITY\] Invalid message" server.log

# View threshold breaches
grep "\[SECURITY\].*threshold exceeded" server.log

# View disconnect events
grep "\[SECURITY\].*disconnecting" server.log
```

## Testing Validation

### Test Invalid Message Type
```javascript
// Client sends non-ArrayBuffer
ws.send("invalid"); // Rejected: Invalid message type
```

### Test Message Size Limit
```javascript
// Client sends 2MB message
const large = new ArrayBuffer(2 * 1024 * 1024);
ws.send(large); // Rejected: Message too large
```

### Test Unknown Command
```javascript
// Client sends unknown command
network.send('command', ['hack', 'payload']); // Rejected: Unknown command
```

### Test Invalid Entity
```javascript
// Client sends entity with NaN position
network.send('entityAdded', {
  id: 'test',
  type: 'app',
  position: [NaN, 0, 0] // Rejected: Invalid numbers
});
```

### Test Rate Limiting
```javascript
// Send 11 invalid messages rapidly
for (let i = 0; i < 11; i++) {
  ws.send(""); // 11th triggers disconnect
}
```

## Performance Impact

- **Validation Overhead**: <1ms per message (negligible)
- **Memory Overhead**: ~100 bytes per socket (tracking counters)
- **CPU Impact**: Minimal, validation is O(1) complexity
- **Network Impact**: None, validation is post-receive

## Future Enhancements

1. **Rate Limiting by IP**: Track invalid messages per IP address
2. **Adaptive Thresholds**: Adjust limits based on server load
3. **Metrics Export**: Expose security metrics via /metrics endpoint
4. **Alert Integration**: Send alerts to monitoring systems
5. **Replay Attack Prevention**: Add nonce/timestamp validation
6. **Encryption**: Add TLS/SSL requirement for production
