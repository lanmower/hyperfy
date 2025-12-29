# State Synchronization Layer Guide

Unified state synchronization architecture for coordinating state between server and client.

## Architecture Overview

```
StateSyncManager (central coordinator)
├── StateRegistry (provider management)
│   ├── Collections
│   ├── Settings
│   ├── Chat
│   ├── Blueprints
│   ├── Entities
│   ├── Livekit
│   └── (custom providers)
├── StateSnapshot (immutable state snapshot)
└── Serialization/Deserialization Pipeline
```

## Core Concepts

### StateSyncManager

Central coordinator for all state synchronization operations.

**Responsibilities**:
- Register/unregister state providers
- Track dirty state changes
- Encode snapshots on server
- Decode snapshots on client
- Manage last known state

**Location**: `src/core/network/StateSync.js`

### StateRegistry

Manages all state providers and their dependencies.

**Key Methods**:
- `register(name, provider, deps)` - Register provider with optional dependencies
- `unregister(name)` - Remove provider
- `getProvider(name)` - Get specific provider
- `getAllProviders()` - Get all registered providers
- `getDependencies(name)` - Get provider dependencies
- `getOrderedNames()` - Topological sort of all providers (respects dependencies)

**Example**:
```javascript
const registry = new StateRegistry()

registry.register('collections', collectionsSystem)
registry.register('blueprints', blueprintsSystem)
registry.register('entities', entitiesSystem, ['blueprints'])  // entities depends on blueprints
registry.register('livekit', livekitSystem)

const order = registry.getOrderedNames()
// Returns: ['collections', 'blueprints', 'entities', 'livekit']
// (entities always comes after blueprints)
```

### StateSnapshot

Immutable representation of world state at a point in time.

**Structure**:
```javascript
{
  id: networkId,           // Network connection ID
  timestamp: number,       // Snapshot creation time
  version: number,         // Schema version for compatibility
  data: {                  // State data by provider
    collections: {...},
    settings: {...},
    chat: {...},
    blueprints: [...],
    entities: [...],
    livekit: {...},
    ...
  },
  metadata: {              // Additional metadata
    compression: 'gzip',
    checksum: '...',
    ...
  }
}
```

**Key Methods**:
- `addState(name, state)` - Add provider state
- `getState(name)` - Get provider state
- `setMetadata(key, value)` - Add metadata
- `getMetadata(key)` - Get metadata
- `toJSON()` - Serialize to JSON
- `StateSnapshot.fromJSON(obj)` - Deserialize from JSON

## State Providers

A state provider is any system that can serialize and deserialize its state.

### Provider Interface

```javascript
{
  // Required: serialize current state
  serialize() {
    return {
      // provider-specific state structure
    }
  },

  // Required: deserialize and apply state
  deserialize(state) {
    // apply state to system
  }
}
```

### Built-in Providers

All of these are automatically registered:

**Collections** - Data collections (minimal serialization overhead)
```javascript
// Serialization
collections.serialize() → {
  id: 'collections-...',
  items: [...]
}

// Deserialization
collections.deserialize({items: [...]})
```

**Settings** - World settings (admin code, environment, etc.)
```javascript
settings.serialize() → {
  hasAdminCode: boolean,
  environment: {...},
  ...
}
```

**Chat** - Chat messages history
```javascript
chat.serialize() → {
  messages: [{userId, userName, text, timestamp}, ...],
  ...
}
```

**Blueprints** - Blueprint definitions
```javascript
blueprints.serialize() → [
  {id, name, model, script, props, disabled, preload},
  ...
]
```

**Entities** - World entities and app instances
```javascript
entities.serialize() → [
  {id, type, data, blueprint, owner, ...},
  ...
]
```

**Livekit** - Communication configuration
```javascript
livekit.serialize() → {
  url: 'wss://...',
  token: '...',
  ...
}
```

### Custom Provider Registration

```javascript
const customProvider = {
  serialize() {
    return {
      // your state
    }
  },
  deserialize(state) {
    // apply state
  }
}

stateSync.registerStateProvider('custom', customProvider, ['blueprints'])
// Now custom will serialize/deserialize after blueprints
```

## Dirty State Tracking

Track which state has changed to enable efficient updates.

```javascript
const stateSync = new StateSyncManager(network)

// Mark state as changed
stateSync.markDirty('entities')
stateSync.markDirty('blueprints')

// Get dirty states
const dirty = stateSync.getDirtyStates()
// ['entities', 'blueprints']

// Check if specific state is dirty
if (stateSync.isDirty('entities')) {
  // send entities update
}

// Clear after transmission
stateSync.clearDirty()
```

## Server-Side Snapshot Encoding

On server, when new player connects:

```javascript
const stateSync = network.stateSync

// Providers are auto-registered from network.collections, network.entities, etc.

// When player connects
const snapshot = stateSync.encodeSnapshot(
  playerId,           // connection ID
  Date.now()          // timestamp
)

// Send to client
socket.send('snapshot', snapshot.toJSON())
```

**Current Implementation** (in PlayerConnectionManager):
```javascript
const snapshot = {
  id: socket.id,
  serverTime: Date.now(),
  apiUrl: this.serverNetwork.apiUrl,
  assetsUrl: this.serverNetwork.assetsUrl,
  collections: this.serverNetwork.collections.serialize(),
  settings: this.serverNetwork.settings.serialize(),
  chat: this.serverNetwork.chat.serialize(),
  blueprints: this.serverNetwork.blueprints.serialize(),
  entities: this.serverNetwork.entities.serialize(),
  livekit: await this.serverNetwork.livekit.serialize(userId),
  authToken: authToken,
  hasAdminCode: hasAdminCode
}

socket.send('snapshot', snapshot)
```

## Client-Side Snapshot Decoding

On client, when receiving snapshot:

```javascript
const stateSync = network.stateSync
const snapshotProcessor = network.snapshotProcessor

// Register StateSync with processor for integrated deserialization
snapshotProcessor.setStateSync(stateSync)

// When snapshot arrives
network.snapshotProcessor.process(snapshotData)

// Internally:
// 1. Sets network.id, network.serverTimeOffset, etc.
// 2. Calls stateSync.decodeSnapshot(snapshotData)
// 3. Which calls deserialize() on each provider in dependency order
```

**Benefits**:
- Automatic dependency ordering (blueprints before entities)
- Structured error handling
- Integrated logging
- Future versioning support

## Advanced Patterns

### Delta Updates

For efficient incremental updates (after initial snapshot):

```javascript
// Only send changed providers
const dirtyStates = stateSync.getDirtyStates()
const deltaSnapshot = stateSync.encodeSnapshot(playerId, now)

// Or manually:
const delta = {
  timestamp: now,
  updated: {
    entities: network.entities.serialize(),
    livekit: await network.livekit.serialize(userId)
  }
}

socket.send('stateDelta', delta)

// Client processes delta
if (data.updated.entities) {
  network.entities.deserialize(data.updated.entities)
}
```

### Versioning & Schema Migration

For protocol compatibility across versions:

```javascript
class StateSnapshot {
  version: number      // Schema version (currently 1)
  metadata: {
    clientVersion: '1.2.0',
    serverVersion: '1.2.0',
    ...
  }
}

// In deserialize, check version
static fromJSON(obj) {
  const snapshot = new StateSnapshot(...)
  snapshot.version = obj.version || 1

  if (snapshot.version < 2) {
    // Run migration
    snapshot.data = migrateV1ToV2(snapshot.data)
  }

  return snapshot
}
```

### Custom Serialization

For complex providers, override serialization:

```javascript
const customProvider = {
  serialize() {
    // Return only changed fields
    return {
      type: 'delta',
      added: this.newEntities,
      updated: this.changedEntities,
      removed: this.deletedIds
    }
  },

  deserialize(state) {
    if (state.type === 'delta') {
      for (const entity of state.added) {
        this.add(entity)
      }
      // apply updates and removals
    } else {
      // Full state
      this.clear()
      for (const entity of state) {
        this.add(entity)
      }
    }
  }
}
```

## Integration Patterns

### With DI Container

```javascript
// Register StateSync as service
const stateSync = new StateSyncManager(network)
world.registerService('stateSync', stateSync)

// In systems
const stateSync = this.world.getService('stateSync')
stateSync.markDirty('entities')
```

### With EventListenerManager

```javascript
// Track state changes
this.listeners.on(network.events, 'entityAdded', (entity) => {
  stateSync.markDirty('entities')
})

this.listeners.on(network.events, 'blueprintChanged', (blueprint) => {
  stateSync.markDirty('blueprints')
})
```

### With SnapshotProcessor

```javascript
// In ClientNetwork.__init()
this.stateSync = new StateSyncManager(this)

// Register all providers
this.stateSync.registerStateProvider('collections', this.collections)
this.stateSync.registerStateProvider('settings', this.settings)
this.stateSync.registerStateProvider('chat', this.chat)
this.stateSync.registerStateProvider('blueprints', this.blueprints)
this.stateSync.registerStateProvider('entities', this.entities, ['blueprints'])
this.stateSync.registerStateProvider('livekit', this.livekit)

// Link processor to StateSync
this.snapshotProcessor.setStateSync(this.stateSync)
```

## Error Handling

StateSync validates serialization/deserialization:

```javascript
try {
  const snapshot = stateSync.encodeSnapshot(id, timestamp)
  // All providers must serialize successfully
} catch (err) {
  logger.error('Failed to encode snapshot', { error: err.message })
  // Handle error - may not be connected
}

try {
  stateSync.decodeSnapshot(data)
  // All providers must deserialize successfully
} catch (err) {
  logger.error('Failed to decode snapshot', { error: err.message })
  // Handle error - possibly incompatible version
}
```

## Monitoring & Statistics

```javascript
const stateSync = network.stateSync

// Get statistics
const stats = stateSync.getStateStats()
console.log(stats)
// {
//   totalProviders: 6,
//   dirtyCount: 2,
//   providers: ['collections', 'settings', 'chat', 'blueprints', 'entities', 'livekit'],
//   dirty: ['entities', 'blueprints']
// }

// Get last snapshot
const snapshot = stateSync.getLastSnapshot()
console.log(`Snapshot ${snapshot.id} at ${snapshot.timestamp}`)
```

## Best Practices

1. **Register All Providers Early**
   ```javascript
   // GOOD - register in init
   stateSync.registerStateProvider('entities', entities, ['blueprints'])

   // BAD - register late or dynamically
   stateSync.registerStateProvider('custom', custom)  // after init
   ```

2. **Declare Dependencies Correctly**
   ```javascript
   // GOOD - entities depend on blueprints (blueprints load first)
   stateSync.registerStateProvider('entities', entities, ['blueprints'])

   // BAD - wrong order
   stateSync.registerStateProvider('blueprints', blueprints, ['entities'])
   ```

3. **Mark Dirty When State Changes**
   ```javascript
   // GOOD
   addEntity(entity) {
     this.entities.push(entity)
     stateSync.markDirty('entities')
   }

   // BAD - state changes without marking dirty
   this.entities.push(entity)  // no markDirty()
   ```

4. **Implement Both Serialize and Deserialize**
   ```javascript
   // GOOD - full implementation
   {
     serialize() { return {...} },
     deserialize(data) { apply(data) }
   }

   // BAD - incomplete
   {
     serialize() { return {...} }
     // deserialize missing!
   }
   ```

5. **Keep Snapshots Atomic**
   ```javascript
   // GOOD - single snapshot per update
   const snapshot = stateSync.encodeSnapshot(id, now)
   socket.send('snapshot', snapshot.toJSON())

   // BAD - partial updates without consistency
   socket.send('entities', entities)
   socket.send('blueprints', blueprints)
   ```

## Files

- `src/core/network/StateSync.js` - Core StateSync classes
- `src/core/systems/network/SnapshotProcessor.js` - Client-side snapshot processing
- `src/core/systems/network/SnapshotCodec.js` - Codec for snapshot encoding (deprecated, replaced by StateSync)
- `src/core/systems/ClientNetwork.js` - Client network integration
- `src/core/systems/ServerNetwork.js` - Server network integration
- `src/core/systems/server/PlayerConnectionManager.js` - Server snapshot generation

## Migration Path

### Phase 1: StateSync Integration (Current)
- Create StateSync abstraction
- Register all existing providers
- Maintain backward compatibility with SnapshotCodec

### Phase 2: Provider Migration
- Migrate each provider to formal registration
- Add dependency declarations
- Update error handling

### Phase 3: Delta Sync
- Implement efficient delta updates
- Track dirty state per provider
- Optimize bandwidth usage

### Phase 4: Versioning & Compatibility
- Add schema version tracking
- Implement migration functions
- Support multiple client versions

## Next Steps

1. Integrate StateSync into ClientNetwork and ServerNetwork
2. Register all 6 built-in providers with proper dependencies
3. Add metrics collection for state sync performance
4. Implement delta sync for incremental updates
5. Add versioning support for protocol compatibility
6. Create tests for state sync ordering and deserialization

## Benefits

- ✅ Single source of truth for state synchronization
- ✅ Dependency management prevents ordering bugs
- ✅ Dirty state tracking enables delta sync
- ✅ Structured error handling and logging
- ✅ Type-safe provider interface
- ✅ Extensible for custom providers
- ✅ Snapshot versioning for compatibility
- ✅ Integrated with DI container
- ✅ Full EventListenerManager support
- ✅ Decoupled from specific network implementation
