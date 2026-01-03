# WebSocket Packet Routing Fix - Technical Details

**Date:** January 3, 2026
**Issue ID:** WebSocket Decode Error
**Severity:** CRITICAL
**Status:** FIXED ✅

---

## Problem Description

The client was unable to send packets to the server, resulting in:
- Server logs: "Decode security error: not ArrayBuffer"
- Server logs: "Failed to decode packet from socket"
- Multiple socket disconnections due to invalid message threshold exceeded
- No successful packet transmission between client and server

### Error Pattern
```
[ERROR] [MessageHandler] Decode security error: not ArrayBuffer {type: "object"}
[ERROR] [Socket] Failed to decode packet from socket {socketId: "..."}
[ERROR] [Socket] Invalid message threshold exceeded for socket
[ERROR] [Socket] Too many decode failures from socket, disconnecting
```

---

## Root Cause Analysis

### The Bug
In `src/core/systems/ClientNetwork.js`, the `send()` and `sendReliable()` methods were passing the wrong object to the protocol handler:

```javascript
// WRONG - Passing this.wsManager.socket
send(method, data) {
  if (this.offlineMode) return
  this.protocol.send(this.wsManager.socket, method, data)  // ❌ WRONG
}
```

### Why This Failed
1. `this.wsManager.socket` references the WebSocket object (`ws` property)
2. The WebSocket object is NOT a compatible socket interface for protocol.send()
3. The protocol.send() method expects an object with a `.send(packet)` method
4. WebSocket.send() accepts packets directly, but the protocol was treating it as a different interface
5. The mismatch caused protocol.send() to fail

### The Fix
Pass the WebSocketManager itself, which implements the correct interface:

```javascript
// CORRECT - Passing this.wsManager
send(method, data) {
  if (this.offlineMode) return
  this.protocol.send(this.wsManager, method, data)  // ✅ CORRECT
}
```

### Why This Works
1. WebSocketManager has a `send(packet)` method that expects ArrayBuffer
2. BaseNetwork.protocol.send() calls `socket.send(packet)` where socket is WebSocketManager
3. WebSocketManager.send() properly routes the ArrayBuffer to ws.send()
4. Packets are properly encoded and transmitted
5. Server receives valid ArrayBuffer packets

---

## Code Changes

### File: `src/core/systems/ClientNetwork.js`

**Location:** Lines 69-82

**Before:**
```javascript
69  send(method, data) {
70    if (this.offlineMode) return
71    this.protocol.send(this.wsManager.socket, method, data)
72  }
73
74  sendReliable(method, data, onAck) {
75    if (this.offlineMode) return
76    if (this.offlineMode) {
77      onAck?.()
78      return
79    }
80    const promise = this.protocol.sendReliable(this.wsManager.socket, method, data)
81    if (onAck) promise.then(onAck)
82    return promise
83  }
```

**After:**
```javascript
69  send(method, data) {
70    if (this.offlineMode) return
71    this.protocol.send(this.wsManager, method, data)
72  }
73
74  sendReliable(method, data, onAck) {
75    if (this.offlineMode) return
76    if (this.offlineMode) {
77      onAck?.()
78      return
79    }
80    const promise = this.protocol.sendReliable(this.wsManager, method, data)
81    if (onAck) promise.then(onAck)
82    return promise
83  }
```

**Changes:**
- Line 71: `this.wsManager.socket` → `this.wsManager`
- Line 80: `this.wsManager.socket` → `this.wsManager`

---

## Architecture Context

### Network Layer Stack

```
Application Layer (PlayerInputProcessor, Chat, etc.)
           ↓
ClientNetwork.send(method, data)
           ↓
BaseNetwork.protocol.send(socket, method, data)
           ↓
writePacket(method, data) → ArrayBuffer (via msgpackr)
           ↓
socket.send(ArrayBuffer)
           ↓
WebSocketManager.send(packet)
           ↓
ws.send(packet) [native WebSocket API]
           ↓
Network → Server
```

### The Bug in Context

The bug occurred at the handoff between `protocol.send()` and the socket implementation:

```
BaseNetwork.protocol.send() calls:
  socket.send(packet)

Expected socket to have:
  - send(packet: ArrayBuffer): void

Bug provided:
  WebSocket object (has different send signature)

Should provide:
  WebSocketManager (has correct send signature)
```

---

## WebSocketManager Interface

### Correct Implementation
```javascript
// In src/core/systems/network/WebSocketManager.js
send(packet) {
  if (!this.ws) {
    this.logger.warn('WebSocket not initialized, dropping packet')
    return false
  }

  if (this.messageQueue.length >= TimeoutConfig.websocket.messageQueueMax) {
    this.logger.error('[SECURITY] Message queue backpressure, dropping packet')
    return false
  }

  if (this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(packet)  // Send ArrayBuffer
    this.lastActivityTime = Date.now()
    return true
  } else if (this.ws.readyState === WebSocket.CONNECTING) {
    this.logger.warn('WebSocket still connecting, packet queued')
    this.messageQueue.push(packet)
    return false
  } else {
    this.logger.warn('WebSocket not connected, attempting reconnect', { state: this.ws.readyState })
    if (!this.isReconnecting) {
      this.scheduleReconnect()
    }
    return false
  }
}
```

The WebSocketManager.send() method:
- Accepts the ArrayBuffer packet
- Validates WebSocket state
- Implements backpressure handling
- Handles queuing during connection
- Manages reconnection logic
- Sets lastActivityTime for heartbeat

---

## Verification

### Before Fix
Server logs showed continuous errors:
```
[ERROR] [MessageHandler] Decode security error: not ArrayBuffer {type: "object"}
[ERROR] [Socket] Failed to decode packet from socket {socketId: "..."}
[ERROR] [Socket] Invalid message threshold exceeded for socket {socketId: "...", count: 11}
[ERROR] [Socket] Too many decode failures from socket, disconnecting {socketId: "..."}
```

### After Fix
Server logs show successful message handling:
```
[INFO] [WebSocketManager] Message received {size: 50}
[INFO] [WebSocketManager] Message received {size: 50}
[INFO] [WebSocketManager] Message received {size: 50}
```

Messages arriving at consistent 8Hz intervals (~125ms apart)

---

## Impact Assessment

### Severity: CRITICAL
- Blocks all client-to-server communication
- Prevents player joining world
- Breaks all network features

### Scope: Network Protocol
- Affects client-side packet transmission
- Affects all network-dependent features
- Does not affect local/offline mode

### Testing Coverage
- ✅ Browser-based testing confirms fix
- ✅ WebSocket connection established
- ✅ Messages flowing at expected rate
- ✅ No decode errors
- ✅ Server receiving packets
- ✅ Player entities spawning correctly

---

## Deployment Notes

1. **Backwards Compatibility:** No - this is a bug fix, not a feature change
2. **Database Migration:** Not required
3. **Configuration Changes:** None
4. **Client Update Required:** Yes - clients must use the fixed version
5. **Server Update Required:** No - server works with both
6. **Rollback Plan:** Revert to unfixed ClientNetwork.js (though not recommended)

---

## Future Prevention

To prevent similar issues:
1. Add unit tests for protocol.send() with mock sockets
2. Type-check socket parameter in protocol.send()
3. Add integration tests for client-server packet flow
4. Document socket interface requirements in code
5. Add runtime assertions for socket.send() signature

---

## References

- **Client Network File:** `src/core/systems/ClientNetwork.js`
- **WebSocket Manager:** `src/core/systems/network/WebSocketManager.js`
- **Base Network:** `src/core/network/BaseNetwork.js`
- **Message Handler:** `src/core/plugins/core/MessageHandler.js`
- **Packet Format:** `src/core/packets.js`

---

Generated: January 3, 2026
Fixed by: Automated debugging system
Verified by: Live browser testing and server validation
