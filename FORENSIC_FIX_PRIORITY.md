# FORENSIC ANALYSIS - CRITICAL FIXES REQUIRED
## Hyperfy Engine - Fix Priority & Implementation Guide

**Status:** 8 bugs identified, 4 blocking deployment
**Estimated Fix Time:** 4-6 hours for all critical issues
**Risk if not fixed:** Multiplayer broken, crashes, security breach

---

## PRIORITY 1: BLOCKING ISSUES (FIX FIRST)

### Bug #1: Interpolation Stubs (CRITICAL - 30 min)
**File:** `src/core/extras/BufferedLerpVector3.js` and `BufferedLerpQuaternion.js`
**Current State:** Empty update() methods
**Impact:** Multiplayer movement is broken (teleporting instead of smooth)
**Criticality:** Game unplayable without this

**Fix:**
```javascript
// BufferedLerpVector3.js
export class BufferedLerpVector3 {
  constructor() {
    this.current = { x: 0, y: 0, z: 0 }
    this.target = { x: 0, y: 0, z: 0 }
  }

  update(delta, speed) {
    // Linearly interpolate from current toward target
    const lerp = (a, b, t) => a + (b - a) * t
    const t = Math.min(1, delta * speed)

    this.current.x = lerp(this.current.x, this.target.x, t)
    this.current.y = lerp(this.current.y, this.target.y, t)
    this.current.z = lerp(this.current.z, this.target.z, t)
  }

  setTarget(x, y, z) {
    this.target.x = x
    this.target.y = y
    this.target.z = z
  }
}
```

```javascript
// BufferedLerpQuaternion.js - use slerp (spherical linear interpolation)
export class BufferedLerpQuaternion {
  constructor() {
    this.current = { x: 0, y: 0, z: 0, w: 1 }
    this.target = { x: 0, y: 0, z: 0, w: 1 }
  }

  update(delta, speed) {
    const t = Math.min(1, delta * speed)

    // Use THREE.js if available, otherwise implement slerp
    const q = new THREE.Quaternion(
      this.current.x, this.current.y, this.current.z, this.current.w
    )
    const target = new THREE.Quaternion(
      this.target.x, this.target.y, this.target.z, this.target.w
    )
    q.slerp(target, t)

    this.current.x = q.x
    this.current.y = q.y
    this.current.z = q.z
    this.current.w = q.w
  }

  setTarget(x, y, z, w) {
    this.target.x = x
    this.target.y = y
    this.target.z = z
    this.target.w = w
  }
}
```

**Testing:**
- Move player in world
- Open DevTools, check if movement is smooth (not teleporting)
- Verify no position jitter
- Check collision detection still works

---

### Bug #2: Decompression Null Handling (CRITICAL - 20 min)
**File:** `src/core/systems/network/SnapshotProcessor.js`
**Current State:** decompress() returns null, crashes downstream
**Impact:** Corrupted packets cause disconnections
**Fix Priority:** Before any multiplayer testing

**Fix in SnapshotProcessor.js:**
```javascript
process(data) {
  tracer.traceSync(`snapshot_process`, span => {
    logger.info('Snapshot process started', { networkId: data.id })

    // Add decompression error handling
    let decompressedData = data
    if (data.compressed) {
      const result = this.network.compressor?.decompress(data)
      if (result === null) {
        logger.error('Snapshot decompression failed - packet corrupted', {
          networkId: data.id,
          size: data.compressedSize
        })
        span?.setAttribute('deserializeStatus', 'decompression_failed')
        // Either return, reconnect, or request retransmit
        this.network.emit('decompressionError', { data })
        return
      }
      decompressedData = result
    }

    this.network.id = decompressedData.id
    this.network.serverTimeOffset = decompressedData.serverTime - performance.now()

    // Continue with deserialization...
  })
}
```

**Also fix Compressor.decompress():**
```javascript
decompress(payload) {
  if (!payload || !payload.compressed) {
    this.stats.uncompressed++
    if (payload?.data && typeof Buffer !== 'undefined') {
      const size = Buffer.byteLength(JSON.stringify(payload.data))
      this.stats.totalUncompressedBytes += size
    }
    return payload?.data || payload
  }

  if (!hasZlib) {
    logger.warn('Zlib not available - cannot decompress', {})
    return null  // Signal error instead of returning null
  }

  try {
    const buffer = Buffer.from(payload.data, 'base64')
    const decompressed = gunzipSync(buffer)
    const data = JSON.parse(decompressed.toString())
    return data
  } catch (err) {
    logger.error('Decompression failed', {
      error: err.message,
      type: err.code || err.name
    })
    throw new Error(`Decompression failed: ${err.message}`)
  }
}
```

**Testing:**
- Simulate corrupted packet: modify base64 data before decompression
- Verify error logged correctly
- Verify player doesn't disconnect (handles gracefully)
- Check reconnection works

---

### Bug #3: Script Sandbox Security (CRITICAL - 45 min)
**File:** `src/core/systems/Scripts.js`
**Current State:** new Function() allows prototype pollution
**Impact:** User scripts can corrupt all game state
**Fix Priority:** CRITICAL - Security vulnerability

**Fix:**
```javascript
export class Scripts extends System {
  constructor(world) {
    super(world)
    const scriptLogger = new StructuredLogger('ScriptExecution')

    // Use real SES Compartment if available, with strict lockdown
    if (typeof globalThis.Compartment === 'function') {
      this.compartment = new Compartment({
        console: {
          log: (...args) => console.log('[USER_SCRIPT]', ...args),
          warn: (...args) => console.warn('[USER_SCRIPT]', ...args),
          error: (...args) => console.error('[USER_SCRIPT]', ...args),
        },
        scriptLogger: {
          error: (message, context) => scriptLogger.error(message, context),
        },
        Date: Object.freeze({
          now: () => Date.now(),
        }),
        Math: Object.freeze(Math),
        Object: Object.freeze({
          keys: Object.keys,
          values: Object.values,
          entries: Object.entries,
          assign: (target, ...sources) => {
            // Prevent prototype pollution - only copy own properties
            for (const source of sources) {
              for (const key of Object.keys(source)) {
                if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
                  target[key] = source[key]
                }
              }
            }
            return target
          },
        }),
        // Add safe APIs only
        Vector3: THREE.Vector3,
        Quaternion: THREE.Quaternion,
      })
    } else {
      // UNSAFE FALLBACK - must not be used in production
      logger.warn('SES Compartment not available - using unsafe fallback')
      this.compartment = new UnsafeCompartment()
    }
  }

  evaluate(code) {
    // Validate script code before execution
    if (!this.validateScript(code)) {
      logger.error('Script validation failed', {})
      return { exec: () => { throw new Error('Script validation failed') } }
    }

    const result = {
      exec: (...args) => {
        try {
          const value = this.compartment.evaluate(this.wrapScript(code))
          return value(...args)
        } catch (err) {
          logger.error('Script execution error', { error: err.message })
          throw err
        }
      },
      code,
    }
    return result
  }

  validateScript(code) {
    // Block dangerous patterns
    const blocklist = [
      /Object\.prototype/g,
      /globalThis\./g,
      /__proto__/g,
      /constructor\s*\[/g,
      /require\(/g,
      /eval\(/g,
    ]

    for (const pattern of blocklist) {
      if (pattern.test(code)) {
        logger.warn('Script contains blocked pattern', { pattern: pattern.toString() })
        return false
      }
    }
    return true
  }

  wrapScript(code) {
    return `(function() {
      const shared = {}
      return (world, app, fetch, props, setTimeout) => {
        try {
          ${code}
        } catch (err) {
          scriptLogger.error('Error executing app script', { error: err.message })
          throw err
        }
      }
    })()`
  }
}

class UnsafeCompartment {
  constructor(globals) {
    this.globals = globals
  }
  evaluate(source) {
    throw new Error('UnsafeCompartment not available - SES Compartment required')
  }
}
```

**Testing:**
- Load a simple test script - verify it runs
- Try prototype pollution attack - verify it's blocked
- Try accessing globalThis - verify blocked
- Verify error logging works
- Test with SES polyfill from npm: `ses` package

---

### Bug #4: Server Time Base Mismatch (CRITICAL - 25 min)
**File:** `src/core/systems/ClientNetwork.js` and `src/core/systems/network/SnapshotProcessor.js`
**Current State:** Mixing moment.now() and performance.now()
**Impact:** Clock skew causes animation jitter and state divergence
**Fix Priority:** Essential for network sync

**Fix - Use performance.now() everywhere:**

```javascript
// ClientNetwork.js - REMOVE moment dependency
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientNetwork')

export class ClientNetwork extends BaseNetwork {
  constructor(world) {
    super(world, clientNetworkHandlers)
    this.serverTimeOffset = 0
    this.lastSyncTime = performance.now()
  }

  setServerTime(serverTime) {
    // Use performance.now() consistently
    this.serverTimeOffset = performance.now() - serverTime
    this.lastSyncTime = performance.now()
    logger.info('Server time synchronized', { offset: this.serverTimeOffset })
  }

  getTime() {
    // Always use performance.now() as base
    return performance.now() - this.serverTimeOffset
  }
}
```

```javascript
// SnapshotProcessor.js - Consistent time base
process(data) {
  tracer.traceSync(`snapshot_process`, span => {
    logger.info('Snapshot process started', { networkId: data.id })

    // Use performance.now() consistently
    this.network.id = data.id
    this.network.serverTimeOffset = data.serverTime - performance.now()
    this.network.apiUrl = data.apiUrl

    // ... rest of method
  })
}
```

```javascript
// SnapshotCodec.js - Fix double timestamp
export class SnapshotCodec {
  static encode(network) {
    const env = typeof process !== 'undefined' && process.env ? process.env : {}
    return {
      id: network.id || network.sockets?.size,
      serverTime: performance.now(),  // Server time at encode
      encodeTimestamp: Date.now(),    // For debugging only
      // ... other fields
    }
  }

  static decode(data, network) {
    // Only use serverTime sent by server
    return {
      id: data.id,
      serverTime: data.serverTime,    // Use value as-is
      // ... other fields
    }
  }
}
```

**Testing:**
- Check browser DevTools performance logs
- Verify smooth animations (no jitter)
- Compare client time vs server time - should stay within 100ms
- Run for 5+ minutes - time should not drift more than 10ms/min

---

## PRIORITY 2: HIGH SEVERITY (FIX NEXT)

### Bug #5: Silent Queue Entry Loss (HIGH - 15 min)
**File:** `src/core/systems/ClientNetwork.js`

**Fix:**
```javascript
flush() {
  while (this.queue.length) {
    try {
      const entry = this.queue.shift()
      if (!Array.isArray(entry) || entry.length < 2) {
        logger.warn('Invalid queue entry dropped', {
          entryType: typeof entry,
          isArray: Array.isArray(entry),
          length: entry?.length,
          entry: entry  // Log the dropped data for debugging
        })
        continue
      }
      const [method, data] = entry
      if (!method) {
        logger.warn('Empty method in queue entry', { data })
        continue
      }
      this[method]?.(data)
    } catch (err) {
      logger.error('Error flushing queue', {
        error: err.message,
        stack: err.stack
      })
    }
  }
}
```

---

### Bug #6: SnapshotCodec Double Timestamp (HIGH - 10 min)
**File:** `src/core/systems/network/SnapshotCodec.js`

**Fix:**
```javascript
static decode(data, network) {
  // Timestamp already calculated at encode time
  // Don't recalculate - just use the value sent by server
  return {
    id: data.id,
    serverTime: data.serverTime,  // Use directly, don't calculate offset here
    apiUrl: data.apiUrl,
    maxUploadSize: data.maxUploadSize,
    assetsUrl: data.assetsUrl,
    // ... rest
  }
}
```

---

## PRIORITY 3: MEDIUM SEVERITY (FIX WHEN POSSIBLE)

### Bug #7: Offline Mode Callback (MEDIUM - 5 min)
**File:** `src/core/systems/ClientNetwork.js:75-77`

**Fix:**
```javascript
sendReliable(method, data, onAck) {
  if (this.offlineMode) {
    onAck?.()
    return Promise.resolve()
  }

  const promise = this.protocol.sendReliable(this.wsManager, method, data)
  if (onAck) promise.then(onAck)
  return promise
}
```

---

### Bug #8: Zlib Module Loading (MEDIUM - 10 min)
**File:** `src/core/systems/network/Compressor.js`

**Fix:**
```javascript
export class Compressor {
  constructor() {
    this.stats = {
      compressed: 0,
      uncompressed: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      totalUncompressedBytes: 0,
    }
    this.ready = this.checkZlib()
  }

  async checkZlib() {
    // Ensure zlib is loaded before compression
    return hasZlib === true
  }

  compress(data) {
    if (!data) return data
    if (!hasZlib) return { compressed: false, data }

    const buffer = Buffer.from(JSON.stringify(data))
    const originalSize = buffer.length

    if (originalSize < MIN_COMPRESS_SIZE) {
      return { compressed: false, data }
    }

    try {
      const compressed = gzipSync(buffer)
      const compressedSize = compressed.length

      this.stats.compressed++
      this.stats.totalOriginalBytes += originalSize
      this.stats.totalCompressedBytes += compressedSize

      return {
        compressed: true,
        data: compressed.toString('base64'),
      }
    } catch (err) {
      logger.error('Compression failed', { size: originalSize, error: err.message })
      return { compressed: false, data }
    }
  }
}
```

---

## TESTING CHECKLIST

After all fixes, test:

- [ ] Single player game loads and runs
- [ ] Multiple players can connect
- [ ] Player movement is smooth (not teleporting)
- [ ] Movement visible to other players without jitter
- [ ] Disconnection handling works gracefully
- [ ] Offline mode works
- [ ] User scripts can execute
- [ ] User scripts cannot break other players' games
- [ ] Extended gameplay (30+ mins) - time doesn't drift
- [ ] Network with 100-200ms latency simulated - still smooth
- [ ] Corrupted packets don't crash client
- [ ] Compression stats show compression active
- [ ] No console errors during normal gameplay

---

## VERIFICATION COMMAND

Run forensic analysis to verify all fixes:
```bash
node forensic-verify.js
```

This will:
1. Check interpolation methods are implemented
2. Verify decompression error handling
3. Test script sandbox security
4. Confirm time base consistency
5. Validate queue logging
6. Test callback behavior

---

## ESTIMATED TIMELINE

| Bug | Time | Difficulty |
|-----|------|-----------|
| #1 Interpolation | 30 min | Medium |
| #2 Decompression | 20 min | Low |
| #3 Script Sandbox | 45 min | High |
| #4 Time Base | 25 min | Medium |
| #5 Queue Logging | 15 min | Low |
| #6 Timestamp | 10 min | Low |
| #7 Offline Mode | 5 min | Low |
| #8 Zlib Loading | 10 min | Low |
| Testing | 30 min | Medium |
| **TOTAL** | **~3 hours** | - |

---

## DO NOT DEPLOY UNTIL

- [ ] All 4 critical bugs fixed
- [ ] Testing checklist passed
- [ ] No regressions in existing features
- [ ] Security review of script sandbox
- [ ] Network stress test (100+ players simulated)

