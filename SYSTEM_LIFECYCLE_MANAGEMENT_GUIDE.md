# System Lifecycle Management Guide

Centralized system initialization and cleanup orchestration with dependency tracking.

## Overview

The SystemLifecycleManager provides:
- **Topological sorting** - Respects system dependencies during init/shutdown
- **Coordinated cleanup** - All systems cleaned up in reverse dependency order
- **Dependency validation** - Detects missing or circular dependencies
- **Graceful shutdown** - Orderly termination with timeout support
- **Status tracking** - Monitor which systems are initialized/disposed

## Architecture

```
SystemLifecycleManager
├── Registry - Tracks all systems and their dependencies
├── Initialization - Topological sort → init each system
├── Shutdown - Reverse order → dispose each system
└── Validation - Detect circular dependencies, missing systems
```

## Core Methods

### `registerSystem(name, system)`
Register a system for lifecycle management.

```javascript
const manager = new SystemLifecycleManager(world)
manager.registerSystem('entities', world.entities)
manager.registerSystem('network', world.network)
manager.registerSystem('physics', world.physics)
```

### `addDependency(systemName, dependsOn)`
Declare that one system depends on another.

```javascript
manager.addDependency('entities', 'storage')      // entities depends on storage
manager.addDependency('physics', 'entities')      // physics depends on entities
manager.addDependency('network', 'entities')      // network depends on entities
```

### `initializeAll(options)`
Initialize all systems in dependency order.

```javascript
await manager.initializeAll({
  assetsDir: '/assets',
  assetsUrl: 'https://assets.com'
})

// Initializes in order: storage → entities → physics, network
```

### `disposeAll()`
Dispose all systems in reverse dependency order.

```javascript
await manager.disposeAll()

// Disposes in order: physics, network → entities → storage
```

### `gracefulShutdown(timeout)`
Shutdown all systems with timeout protection.

```javascript
await manager.gracefulShutdown(30000)  // 30 second timeout
```

### `validateDependencies()`
Check for missing or circular dependencies.

```javascript
try {
  manager.validateDependencies()
  console.log('All dependencies valid')
} catch (err) {
  console.error('Dependency errors:', err.message)
}
```

### `topologicalSort()`
Get systems in initialization order.

```javascript
const order = manager.topologicalSort()
// ['storage', 'entities', 'physics', 'network', ...]
```

### `getStatus(name)`
Get lifecycle status of a system.

```javascript
const status = manager.getStatus('entities')
// {
//   name: 'entities',
//   initialized: true,
//   disposed: false,
//   dependencies: ['storage'],
//   dependents: ['physics', 'network']
// }
```

### `getStats()`
Get overall lifecycle statistics.

```javascript
const stats = manager.getStats()
// {
//   total: 48,
//   initialized: 48,
//   disposed: 0,
//   dependencies: [
//     { system: 'physics', count: 2 },
//     { system: 'network', count: 1 }
//   ]
// }
```

## Integration with World

### Option 1: Integration in World.__init()

```javascript
export class World extends EventEmitter {
  constructor() {
    super()
    // ... existing code ...

    this.lifecycleManager = new SystemLifecycleManager(this)

    // Register all systems with manager
    for (const system of this.systems) {
      this.lifecycleManager.registerSystem(system.constructor.name, system)
    }
  }

  async init(options) {
    // Add dependencies
    this.lifecycleManager.addDependency('entities', 'storage')
    this.lifecycleManager.addDependency('physics', 'entities')

    // Initialize with manager
    await this.lifecycleManager.initializeAll(options)
  }

  async destroy() {
    await this.lifecycleManager.disposeAll()
  }
}
```

### Option 2: Standalone Usage

```javascript
const world = new World()
const manager = new SystemLifecycleManager(world)

// Register systems
for (const [name, system] of Object.entries(world)) {
  if (system?.init || system?.destroy) {
    manager.registerSystem(name, system)
  }
}

// Declare dependencies
manager.addDependency('physics', 'entities')
manager.addDependency('apps', 'entities')
manager.addDependency('scripts', 'apps')

// Initialize
await manager.initializeAll()

// Later: graceful shutdown
process.on('SIGTERM', async () => {
  await manager.gracefulShutdown(10000)
  process.exit(0)
})
```

## Dependency Declaration

### Critical Dependencies

Systems that must be initialized first:

```javascript
// Storage must be first (no dependencies)
manager.addDependency('entities', 'storage')
manager.addDependency('blueprints', 'storage')

// Entities needed by most systems
manager.addDependency('physics', 'entities')
manager.addDependency('apps', 'entities')
manager.addDependency('particles', 'entities')

// Network depends on entities and blueprints
manager.addDependency('network', 'entities')
manager.addDependency('network', 'blueprints')
```

### Complex Dependency Chains

```
storage
  ├── entities
  │   ├── physics
  │   ├── apps
  │   │   └── scripts
  │   └── particles
  └── blueprints
      └── apps
          └── scripts

network
  ├── entities
  └── blueprints
```

## Error Handling

### Circular Dependencies

```javascript
try {
  manager.addDependency('a', 'b')
  manager.addDependency('b', 'c')
  manager.addDependency('c', 'a')  // Circular!

  manager.validateDependencies()
} catch (err) {
  console.error('Circular dependency:', err.message)
  // Error: Circular dependency detected: a
}
```

### Missing Dependencies

```javascript
try {
  manager.addDependency('physics', 'nonexistent')
  manager.validateDependencies()
} catch (err) {
  console.error('Missing dependency:', err.message)
  // Error: System 'physics' depends on missing system 'nonexistent'
}
```

### Initialization Failure

```javascript
try {
  await manager.initializeAll()
} catch (err) {
  console.error('Initialization failed:', err.message)
  // Automatic cleanup on failure
  // All already-initialized systems are disposed
}
```

## Graceful Shutdown Pattern

### Server Shutdown

```javascript
async function shutdown() {
  logger.info('Starting graceful shutdown')

  try {
    await world.lifecycleManager.gracefulShutdown(30000)
    logger.info('Shutdown completed successfully')
    process.exit(0)
  } catch (err) {
    logger.error('Graceful shutdown failed, forcing exit', { error: err.message })
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
```

### Browser Cleanup

```javascript
window.addEventListener('beforeunload', async () => {
  if (world.lifecycleManager) {
    await world.lifecycleManager.disposeAll()
  }
})
```

## Best Practices

1. **Register all systems**
   ```javascript
   // Good - all lifecycle-aware systems registered
   for (const system of world.systems) {
     manager.registerSystem(system.constructor.name, system)
   }

   // Bad - missing systems
   manager.registerSystem('entities', world.entities)
   // No other systems registered
   ```

2. **Declare dependencies early**
   ```javascript
   // Good - before initialization
   manager.addDependency('physics', 'entities')
   await manager.initializeAll()

   // Bad - after initialization
   await manager.initializeAll()
   manager.addDependency('physics', 'entities')  // Too late!
   ```

3. **Validate before init**
   ```javascript
   try {
     manager.validateDependencies()  // Check first
     await manager.initializeAll()
   } catch (err) {
     // Handle validation errors before they cause initialization failures
   }
   ```

4. **Always cleanup**
   ```javascript
   try {
     await manager.initializeAll()
     // Use world...
   } finally {
     await manager.disposeAll()  // Guaranteed cleanup
   }
   ```

5. **Use graceful shutdown**
   ```javascript
   // Good - respects timeout
   await manager.gracefulShutdown(30000)

   // Less safe - no timeout protection
   await manager.disposeAll()
   ```

## Monitoring

### Status Checks

```javascript
// Check if all systems initialized
const stats = manager.getStats()
const allInitialized = stats.initialized === stats.total

// Check specific system
const status = manager.getStatus('physics')
if (!status.initialized) {
  logger.warn('Physics system not initialized')
}
```

### Dependency Analysis

```javascript
// Find which systems have dependencies
const stats = manager.getStats()
for (const dep of stats.dependencies) {
  console.log(`${dep.system} has ${dep.count} dependencies`)
}

// List systems in init order
const order = manager.listSystemsInOrder()
console.log('Initialization order:', order)
```

## Files

- `src/core/systems/SystemLifecycleManager.js` - Implementation
- `SYSTEM_LIFECYCLE_MANAGEMENT_GUIDE.md` - This guide

## Next Steps

1. Integrate manager into World.__init()
2. Map all system dependencies
3. Validate dependency graph
4. Test graceful shutdown
5. Monitor system lifecycle in production

## Benefits

- ✅ Prevents initialization order bugs
- ✅ Ensures proper cleanup of resources
- ✅ Detects circular dependencies
- ✅ Graceful shutdown with timeout
- ✅ System lifecycle visibility
- ✅ Coordinated startup/shutdown
