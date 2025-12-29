# Code Cleanup & Resource Deallocation Patterns

This document establishes standard cleanup patterns for the Hyperfy codebase to prevent memory leaks and ensure proper resource deallocation.

## Core Principles

1. **Always clean up what you create** - Every resource (listener, timer, DOM element, Three.js object) must be explicitly released
2. **Use EventListenerManager** - All event listeners should be tracked via `this.listeners` manager
3. **Parent cleanup triggers child cleanup** - Call `super.destroy()` to trigger parent class cleanup
4. **Break circular references** - Set references to null in destroy methods to allow garbage collection
5. **Document cleanup requirements** - Use CleanupChecklist to identify all resources

## Cleanup Infrastructure

### 1. DisposableResource
Base class for any object that needs cleanup:
```javascript
import { DisposableResource } from 'src/core/lifecycle/DisposableResource.js'

class MyResource extends DisposableResource {
  constructor() {
    super('MyResource')
    this.data = createLargeObject()
  }

  onDispose() {
    this.data = null
  }
}
```

### 2. LifecycleCoordinator
Manages resource disposal order by layer (supports depth-first cleanup):
```javascript
import { lifecycleCoordinator } from 'src/core/lifecycle/LifecycleCoordinator.js'

// Register resources by layer (higher layers disposed first)
lifecycleCoordinator.register('network', networkSystem, 0)
lifecycleCoordinator.register('physics', physicsSystem, 1)

// Dispose all resources in reverse layer order
lifecycleCoordinator.dispose()
```

### 3. ResourceManager
Tracks all disposable resources by type and owner:
```javascript
import { resourceManager } from 'src/core/lifecycle/ResourceManager.js'

// Track a resource
resourceManager.track(this, 'Node', mesh, { name: 'sceneMesh' })

// Query resources
const meshes = resourceManager.getResourcesByType('Node')
const stats = resourceManager.getStats()

// Cleanup all resources owned by this system
resourceManager.disposeResourcesByOwner('MySystem')
```

### 4. CleanupTracker
Records all cleanup operations for debugging:
```javascript
import { cleanupTracker } from 'src/core/lifecycle/CleanupTracker.js'

// Register a cleanup operation
const deregister = cleanupTracker.registerCleanup('network', () => {
  socket.close()
}, 1) // priority

// Execute all cleanups
const results = await cleanupTracker.executeCleanups()
console.log(results) // { executed, failed, skipped }
```

## System Cleanup Pattern

All systems extending BaseSystem should implement proper destroy:

```javascript
import { BaseSystem } from 'src/core/systems/BaseSystem.js'

export class MySystem extends BaseSystem {
  constructor(world) {
    super(world)

    // Initialize resources
    this.socket = createSocket()
    this.interval = null

    // Track listeners
    this.listeners.on(this.socket, 'message', this.onMessage)
    this.listeners.addEventListener(window, 'resize', this.onResize)
  }

  start() {
    // Start periodic updates
    this.interval = setInterval(() => this.update(), 100)
  }

  destroy() {
    // Cleanup listeners (automatic via EventListenerManager)
    this.listeners.clear()

    // Clear timers
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    // Close connections
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    // Call parent destroy to trigger mixin cleanup
    super.destroy()
  }
}
```

## Node (Three.js) Cleanup Pattern

Nodes that create Three.js objects should properly dispose:

```javascript
export class CustomNode extends Node {
  constructor(data = {}) {
    super(data)

    // Create Three.js objects
    this.geometry = new THREE.BufferGeometry()
    this.material = new THREE.MeshStandardMaterial()
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  dispose() {
    // Dispose geometry
    if (this.geometry) {
      this.geometry.dispose()
      this.geometry = null
    }

    // Dispose materials (handle arrays)
    if (this.material) {
      if (Array.isArray(this.material)) {
        this.material.forEach(m => m.dispose())
      } else {
        this.material.dispose()
      }
      this.material = null
    }

    // Remove from parent
    if (this.parent) {
      this.parent.remove(this)
    }

    // Cleanup sub-controllers
    this.audioController?.cleanup()
    this.videoRenderer?.cleanup()

    // Call parent dispose
    super.dispose()
  }
}
```

## Event Listener Cleanup

EventListenerManager handles automatic tracking:

```javascript
class MySystem extends BaseSystem {
  constructor(world) {
    super(world)

    // EventEmitter style
    this.listeners.on(world.events, 'spawn', this.onSpawn.bind(this))

    // DOM events
    this.listeners.addEventListener(document, 'click', this.onClick.bind(this))

    // Once listeners
    this.listeners.once(socket, 'connect', this.onConnect.bind(this))
  }

  destroy() {
    // All listeners automatically cleared
    this.listeners.clear()
    super.destroy()
  }
}
```

## Async Operation Cleanup

Use AbortController for async cleanup:

```javascript
class FileLoader extends BaseSystem {
  constructor(world) {
    super(world)
    this.abortController = new AbortController()
  }

  async fetchData(url) {
    try {
      const response = await fetch(url, {
        signal: this.abortController.signal
      })
      return await response.json()
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch cancelled')
      } else {
        throw err
      }
    }
  }

  destroy() {
    // Cancel all pending fetches
    this.abortController.abort()
    this.listeners.clear()
    super.destroy()
  }
}
```

## Cleanup Checklist for New Classes

Before marking a class as "complete", verify:

### For Systems:
- [ ] Event listeners cleared in destroy()
- [ ] Timers cleared (clearInterval, clearTimeout)
- [ ] Async operations cancelled (AbortController)
- [ ] Child systems destroyed
- [ ] super.destroy() called

### For Nodes:
- [ ] Geometries disposed
- [ ] Materials disposed
- [ ] Textures disposed
- [ ] Removed from parent
- [ ] Audio/video controllers cleaned up
- [ ] super.dispose() called

### For All Classes:
- [ ] Circular references broken (set to null)
- [ ] Large data structures cleared
- [ ] Dispose method logged for debugging
- [ ] No references to already-disposed objects

## Testing Cleanup

Use ResourceLeakDetector to verify cleanup works:

```javascript
// In browser console:
await window.__DEBUG__.resources.snapshot()
// Take snapshot before/after cleanup to verify resources released

const report = await window.__DEBUG__.resources.getReport()
console.log('Leaked resources:', report.leaks)
```

## Debug API Access

Available in `window.__DEBUG__.cleanup`:

```javascript
// Get cleanup stats
window.__DEBUG__.cleanup.getStats()
// { total, successful, failed, pending, byName }

// Get detailed cleanup report
window.__DEBUG__.cleanup.getDetailedReport()
// All cleanup operations with timing and errors

// View cleanup guide
window.__DEBUG__.cleanup.printGuide('SYSTEM')
// Prints cleanup checklist for category
```

## Common Pitfalls

1. **Forgetting super.destroy()** - Child cleanup won't run
2. **Not clearing listeners** - Memory leaks from dangling event handlers
3. **Not disposing Three.js objects** - GPU memory leak
4. **Circular references** - Object A → B → A prevents GC
5. **Storing references after dispose** - Using disposed objects crashes
6. **Not handling disposal errors** - Silent failures hide problems

## File Locations

- `src/core/lifecycle/DisposableResource.js` - Base class
- `src/core/lifecycle/LifecycleCoordinator.js` - Layer-based disposal
- `src/core/lifecycle/ResourceManager.js` - Resource tracking
- `src/core/lifecycle/CleanupTracker.js` - Operation recording
- `src/core/lifecycle/CleanupChecklist.js` - Pattern guides
- `src/core/systems/EventListenerManager.js` - Event listener tracking
- `src/core/systems/BaseSystem.js` - System base with destroy()
- `src/core/nodes/Node.js` - Node base with dispose()

## Example: Complete System with Cleanup

```javascript
import { BaseSystem } from 'src/core/systems/BaseSystem.js'
import { resourceManager } from 'src/core/lifecycle/index.js'

export class WebSocketSystem extends BaseSystem {
  constructor(world) {
    super(world)

    this.abortController = new AbortController()
    this.socket = null
    this.updateInterval = null
  }

  async init() {
    // Create socket
    this.socket = new WebSocket('ws://localhost:8080')
    resourceManager.track(this, 'socket', this.socket, { url: 'ws://localhost:8080' })

    // Register listeners
    this.listeners.on(this.socket, 'message', this.onMessage.bind(this))
    this.listeners.on(this.socket, 'close', this.onClose.bind(this))

    // DOM listeners
    this.listeners.addEventListener(window, 'beforeunload', this.onUnload.bind(this))

    // Start periodic heartbeat
    this.updateInterval = setInterval(() => this.ping(), 30000)
  }

  onMessage(event) {
    // Handle message
  }

  onClose() {
    this.logger.info('WebSocket closed')
  }

  onUnload() {
    this.destroy()
  }

  ping() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'ping' }))
    }
  }

  destroy() {
    // Cancel async operations
    this.abortController.abort()

    // Stop timers
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    // Close socket
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close()
      }
      this.socket = null
    }

    // Clear all event listeners
    this.listeners.clear()

    // Call parent cleanup
    super.destroy()

    // Track resource cleanup
    const stats = resourceManager.getStats()
    this.logger.info('System destroyed', stats)
  }
}
```

This cleanup infrastructure ensures:
- ✅ No memory leaks from dangling listeners
- ✅ Proper GPU memory cleanup (Three.js disposal)
- ✅ Cancelled async operations
- ✅ Clear resource ownership tracking
- ✅ Debugging tools for verification
