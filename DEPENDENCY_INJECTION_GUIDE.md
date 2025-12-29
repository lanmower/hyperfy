# Dependency Injection (DI) Guide

This document explains how to use the new DI system to reduce coupling and improve testability.

## Quick Start

### Getting a Service (Recommended)

```javascript
// Instead of this (couples to World):
const entities = this.world.entities

// Do this (uses DI):
const entities = this.getService('entities')
```

### Checking if Service Exists

```javascript
if (this.hasService('entities')) {
  const entities = this.getService('entities')
}
```

### Requiring Services at Init

```javascript
init() {
  // Throws error if required services not available
  this.requireServices('entities', 'network', 'stage')
}
```

## System Methods

All systems inherit from System base class and have access to:

### `getService(name: string): unknown`
Get a service by name. Returns null if not found.

```javascript
const loader = this.getService('loader')
const network = this.getService('network')
```

### `hasService(name: string): boolean`
Check if a service exists in the DI container.

```javascript
if (this.hasService('xr')) {
  const xr = this.getService('xr')
}
```

### `getServiceOrThrow(name: string): unknown`
Get a service, throws if not found.

```javascript
// Guarantees service exists or throws
const stage = this.getServiceOrThrow('stage')
```

### `requireServices(...names: string[]): void`
Validate that required services exist. Call in init().

```javascript
init() {
  this.requireServices('entities', 'network')
  // Now safe to use getService without null checks
  this.entities = this.getService('entities')
  this.network = this.getService('network')
}
```

## Dependency Declaration (Advanced)

### Using DEPS Class Property

Declare dependencies at the class level for automatic property binding:

```javascript
export class MySystem extends System {
  static DEPS = {
    entities: 'entities',
    network: 'network',
    stage: 'stage'
  }

  // Now you can use this.entities, this.network, this.stage
  // They are automatically resolved from DI container
}
```

## Migration Strategy

### Phase 1: Direct Access (Current - HIGH COUPLING)
```javascript
class ClientAI extends System {
  start() {
    this.world.events.on('command', this.onCommand)
    this.world.blueprints.add(blueprint)
    this.world.builder.toggle(true)
  }
}
```

### Phase 2: Using getService (RECOMMENDED)
```javascript
class ClientAI extends System {
  start() {
    const events = this.getService('events')
    const blueprints = this.getService('blueprints')
    const builder = this.getService('builder')

    events.on('command', this.onCommand)
    blueprints.add(blueprint)
    builder.toggle(true)
  }
}
```

### Phase 3: Using DEPS (IDEAL)
```javascript
export class ClientAI extends System {
  static DEPS = {
    events: 'events',
    blueprints: 'blueprints',
    builder: 'builder'
  }

  start() {
    this.events.on('command', this.onCommand)
    this.blueprints.add(blueprint)
    this.builder.toggle(true)
  }
}
```

## Available Services (All Systems)

All 48 systems are registered in the DI container:

### Client Systems
- client
- clientActions
- clientAI
- clientAudio
- clientBuilder
- clientControls
- clientEnvironment
- clientGraphics
- clientLiveKit
- clientLoader
- clientPointer
- clientPrefs
- clientStats
- clientTarget
- clientUI
- xr
- nodeClient

### Server Systems
- server
- serverAI
- serverLiveKit
- serverLoader
- serverMonitor
- serverNetwork
- snaps
- nodeEnvironment

### Shared Systems
- anchors
- animation
- apps
- avatars
- blueprints
- chat
- collections
- entities
- errorMonitor
- events
- lods
- nametags
- particles
- performanceMonitor
- physics
- scripts
- settings
- stage
- wind

### Core Objects
- world (the World instance itself)
- di (the ServiceContainer instance)

## Benefits

1. **Loose Coupling**: Systems don't depend on World structure
2. **Testability**: Easy to mock services for testing
3. **Clarity**: Explicit about dependencies
4. **Safety**: Compile-time errors for missing services (with TypeScript)
5. **Refactoring**: Can reorganize World without updating all systems

## Best Practices

1. **Use getService instead of this.world.service**
   ```javascript
   // Bad
   this.world.entities.add(data)

   // Good
   this.getService('entities').add(data)
   ```

2. **Call requireServices in init()**
   ```javascript
   init() {
     this.requireServices('entities', 'network')
   }
   ```

3. **Use DEPS for frequently accessed services**
   ```javascript
   static DEPS = { entities: 'entities', network: 'network' }
   ```

4. **Null-check optional services**
   ```javascript
   const xr = this.getService('xr')
   if (xr) {
     xr.doSomething()
   }
   ```

## Files Modified

- `src/core/World.js` - Added getService() and hasService() methods
- `src/core/systems/System.js` - Added hasService(), getServiceOrThrow(), requireServices()
- `src/core/systems/BaseSystem.js` - Added DI helper methods
- `src/core/di/DIHelper.js` - New utility module for advanced DI patterns
- `src/core/di/ServiceContainer.js` - Existing DI container (enhanced in usage)

## Refactoring Checklist

For each system using direct world access:

- [ ] Identify all `this.world.X` accesses
- [ ] Replace with `this.getService('X')`
- [ ] Add `requireServices()` call in init()
- [ ] Consider using DEPS for frequently accessed services
- [ ] Test that system still works

## Next Steps

1. Start using getService() in new code
2. Gradually migrate existing systems (26 systems currently using direct access)
3. Systems can be migrated one at a time, no coordination needed
4. Once all systems use DI, World structure becomes implementation detail
