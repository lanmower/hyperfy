# StateSync Abstraction Layer - Architecture Analysis & Design

## Current Implementation Analysis

### Overview
State synchronization is currently split across multiple systems with overlapping responsibilities:
- **ServerNetwork**: Handles network transmission and incoming message routing
- **ClientNetwork**: Manages client-side networking and snapshot reception
- **Entities**: Manages entity lifecycle and local state storage
- **BaseEntity**: Provides entity-level serialization/deserialization

### Data Flow Architecture

#### Client Initialization (Full Snapshot)
```
1. ClientNetwork.init(wsUrl, name, avatar)
   ↓
2. WebSocketManager connects to server
   ↓
3. Server sends onSnapshot with full state
   ↓
4. ClientNetwork.onSnapshot(data)
   ↓
5. SnapshotProcessor.process(data)
   ↓
6. SnapshotCodec.deserializeState(data, network)
   - collections.deserialize(data.collections)
   - settings.deserialize(data.settings)
   - blueprints.deserialize(data.blueprints)
   - entities.deserialize(data.entities)
     ↓
7. Entities.deserialize(datas)
   ↓
8. Entities.add(data) for each entity
   ↓
9. EntitySpawner.spawn(data, local=false)
   - Creates App/PlayerLocal/PlayerRemote instance
   - Stores in entities.items Map
   - Emits EVENT.entity.added
```

#### Entity Creation (Client)
```
1. Client creates entity: entities.add(data, local=true)
   ↓
2. EntitySpawner.spawn(data, local=true)
   - Creates entity instance
   - Stores in entities.items
   - Emits EVENT.entity.added
   ↓
3. BaseEntity constructor sends: network.send('entityAdded', this.data)
   ↓
4. ServerNetwork.onEntityAdded(socket, data)
   → BuilderCommandHandler.onEntityAdded(socket, data)
   - Creates entity on server
   - Broadcasts to all clients via protocol
```

#### Entity Modification (Any Side)
```
Client modifies entity:
1. BaseEntity.position = v
   ↓
2. markDirty() → network.markDirty(entityId)
   ↓
3. ServerNetwork.markDirty(id) marks in dirtyApps/dirtyBlueprints sets
   ↓
4. Protocol flushes marked entities periodically
   ↓
5. ClientNetwork receives onEntityModified(data)
   ↓
6. ClientPacketHandlers.handleEntityModified(data)
   ↓
7. entity.modify(updates)
   - Updates entity.data properties
   - Calls onModified(changes) hook
   - Marks entity dirty again for propagation

Server modifies entity:
1. ServerNetwork.onEntityModified(socket, data)
   → BuilderCommandHandler.onEntityModified(socket, data)
   - Modifies entity on server
   - Broadcasts to clients via protocol
```

#### Entity Destruction
```
1. entities.remove(id)
   ↓
2. EntityLifecycle.remove(id)
   - entity.destroy()
   - entities.items.delete(id)
   - entities.removed.push(id)
   - Emits EVENT.entity.removed
   ↓
3. Network notifies other sides via onEntityRemoved(id)
```

### Key Components & Responsibilities

#### ServerNetwork (src/core/systems/ServerNetwork.js)
- Extends BaseNetwork
- Properties:
  - `sockets`: Map of connected clients
  - `dirtyBlueprints`, `dirtyApps`: Sets tracking modified entities
  - `compressor`: Handles message compression
  - `lifecycleManager`, `socketManager`, `chatManager`, etc.
- Responsibilities:
  - Send/receive network messages
  - Route handler calls to appropriate managers
  - Track entity modifications
  - Manage socket lifecycle
- **Problem**: Tightly coupled with entity modification tracking; no centralized state change coordination

#### ClientNetwork (src/core/systems/ClientNetwork.js)
- Extends BaseNetwork
- Properties:
  - `snapshotProcessor`: Handles initial snapshot
  - `packetHandlers`: Routes incoming messages
  - `wsManager`: WebSocket connection management
  - `lastKnownState`: Caches last snapshot for offline mode
- Responsibilities:
  - Receive snapshots and deltas from server
  - Route state updates to handlers
  - Manage connection state and offline mode
- **Problem**: No coordination with Entities about what updates mean; direct handler delegation

#### Entities (src/core/systems/Entities.js)
- Extends System
- Properties:
  - `items`: Map[entityId → Entity]
  - `players`: Map[playerId → PlayerEntity]
  - `hot`: Set of active entities for update loops
  - `removed`: Array of recently deleted entity IDs
  - `spawner`, `lifecycle`: Sub-systems
- Responsibilities:
  - Store entity instances
  - Create/destroy entities via spawner
  - Update lifecycle management
  - Serialize/deserialize entity collections
  - Emit entity events
- **Problem**: Mixed concerns - storage, lifecycle, and synchronization all in one place

#### BaseEntity (src/core/entities/BaseEntity.js)
- Properties:
  - `data`: Entity state object with id, position, quaternion, etc.
  - `state`: Custom app state
  - `events`: Event callbacks map
  - `local`: Whether entity was created locally
- Methods:
  - `modify(updates)`: Apply incoming changes
  - `markDirty()`: Signal changes to network
  - `serialize()`: Convert to network format
  - `deserialize(data)`: Apply from network format
- **Problem**: Entity-level sync logic spread across modify/markDirty/serialize

#### SnapshotCodec (src/core/systems/network/SnapshotCodec.js)
- Static methods for full state encoding/decoding
- `encode(network)`: Serializes all systems (collections, settings, chat, blueprints, entities)
- `decode(data, network)`: Decodes network snapshot
- `deserializeState(data, network)`: Applies snapshot to systems
- **Problem**: Tight coupling to specific systems; no abstraction for what state matters

#### DeltaCodec (src/core/systems/network/DeltaCodec.js)
- Static methods for incremental change encoding/decoding
- `encode(current, previous)`: Computes delta between states
- `encodeEntityDelta(entity, previousState)`: Entity-specific delta
- `compressEntityList()`: Tracks added/modified/removed entities
- **Problem**: Codec logic separate from state coordination; no ownership of state lifecycle

#### ClientPacketHandlers (src/core/systems/network/ClientPacketHandlers.js)
- Routes incoming packets to handler methods
- Methods: handleEntityAdded, handleEntityModified, handleEntityRemoved, etc.
- Each handler directly calls into systems (entities.add, entity.modify, entities.remove)
- **Problem**: No validation, coordination, or ordering of state changes

### State Synchronization Protocol

#### Snapshots (Full State)
- Sent on initial connection or reconnection
- Contains complete state of all systems
- Format: { id, serverTime, collections, settings, blueprints, entities, ... }
- Received by: ClientNetwork.onSnapshot() → SnapshotProcessor.process()

#### Deltas (Incremental Changes)
- Sent via `onEntityAdded`, `onEntityModified`, `onEntityRemoved` messages
- Only changed properties sent in modify events
- Examples:
  - `onEntityAdded`: Full entity data
  - `onEntityModified`: { id, position: [...], quaternion: [...], ... }
  - `onEntityRemoved`: entity id

#### Message Format (BaseNetwork Protocol)
```javascript
protocol.enqueue(socket, method, data)
  ↓
handlers[method] (e.g., 'onEntityAdded')
  ↓
flushTarget[handlerName] (e.g., serverNetwork.onEntityAdded)
```

### Coupling Issues Identified

#### 1. **Bidirectional Notification Loop**
- Entity sends `network.send('entityAdded', ...)` in constructor
- ServerNetwork broadcasts to other clients
- ClientNetwork receives and calls `entities.add(data)`
- New entity calls `network.send('entityAdded', ...)` again
- **Risk**: Infinite loops if not careful with `local` flag

#### 2. **Dirty Tracking vs Lazy Propagation**
- ServerNetwork has `dirtyApps` and `dirtyBlueprints` sets
- Entities emit EVENT.entity.added/removed
- No explicit coordination between dirty tracking and event emission
- **Problem**: Unclear when changes are actually synced

#### 3. **Snapshot vs Delta Mixing**
- Full snapshots deserialize via SnapshotCodec.deserializeState()
- Deltas deserialize via entity.modify()
- Both update entity.data but through different paths
- No unified state application logic

#### 4. **Error Handling & Validation**
- EntitySpawner validates entity data with validateEntityData()
- ClientPacketHandlers have no validation before forwarding
- Can create inconsistent state if validation differs between sides
- **Risk**: Client/server divergence on invalid data

#### 5. **Event Emission Timing**
- Events emitted in multiple places:
  - EntitySpawner.spawn(): EVENT.entity.added
  - EntityLifecycle.remove(): EVENT.entity.removed
  - BaseEntity.modify(): No event emission
- Subscribers don't know what changed, only that something did
- **Problem**: Listeners can't act on specific property changes

#### 6. **Callback/Hook Pattern Fragmentation**
- BaseEntity.onModified(changes) hook exists
- App has onModified override for app-specific handling
- No standard pattern for sync side effects
- **Problem**: Custom logic scattered, hard to coordinate

### Critical Data Dependencies

#### Entity Creation (Client → Server → All Clients)
1. Client creates → sends 'entityAdded'
2. Server receives, validates, creates locally
3. Server broadcasts to all clients (including originator)
4. Clients receive 'onEntityAdded' and create locally
5. **Assumption**: All receive same data in same order

#### Entity Modification (Any → All)
1. Side modifies property → calls markDirty()
2. Network queues change
3. Other sides receive 'onEntityModified'
4. Other sides call modify() to apply changes
5. **Assumption**: Deltas are idempotent (applying twice = applying once)

#### Entity Destruction
1. Side calls entities.remove(id)
2. Network broadcasts 'onEntityRemoved'
3. Other sides receive and call entities.remove(id)
4. **Assumption**: Safe to call remove() multiple times

### Serialization Format

#### Full Entity (from entity.serialize())
```javascript
{
  id: 'uuid-string',
  name: 'Entity Name',
  type: 'app' | 'playerLocal' | 'playerRemote',
  position: [x, y, z],
  quaternion: [x, y, z, w],
  blueprint: 'blueprint-id',
  avatar: 'url',
  userId: 'user-id',
  ...app-specific fields
}
```

#### Delta Update (for modify)
```javascript
{
  id: 'uuid-string',
  position: [x, y, z],
  quaternion: [x, y, z, w],
  // Only changed properties included
}
```

## StateSync Abstraction Design

### Goals
1. **Single Source of Truth**: One place handles all state change coordination
2. **Clear Protocol**: Explicit methods for lifecycle events and remote updates
3. **Decoupling**: ServerNetwork and Entities independently orchestrated
4. **Validation & Consistency**: Coordinate validation across client/server
5. **Batch Efficiency**: Group changes by type and timing
6. **Error Handling**: Fail gracefully with inconsistency recovery
7. **Observability**: Track state changes for debugging and auditing

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   World                                  │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐         ┌──────────────┐              │
│ │ Entities     │         │ ServerNetwork│              │
│ │              │         │              │              │
│ │ - items      │         │ - sockets    │              │
│ │ - players    │         │ - protocol   │              │
│ │ - hot        │         │ - managers   │              │
│ └──────┬───────┘         └──────┬───────┘              │
│        │                        │                      │
│        └────────────┬───────────┘                      │
│                     ↓                                   │
│            ┌────────────────┐                          │
│            │   StateSync    │                          │
│            │                │                          │
│            │ Entity Cycle:  │                          │
│            │ - onCreated    │                          │
│            │ - onUpdated    │                          │
│            │ - onDestroyed  │                          │
│            │                │                          │
│            │ Remote Sync:   │                          │
│            │ - onRemote...  │                          │
│            │ - applySnapshot│                          │
│            │ - applyUpdate  │                          │
│            │                │                          │
│            │ Flushing:      │                          │
│            │ - pending      │                          │
│            │ - flush()      │                          │
│            │ - scheduleFlush│                          │
│            └────────────────┘                          │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

### Public Interface

```javascript
// Entity lifecycle (called by Entities)
stateSync.onEntityCreated(entity)      // New entity added locally
stateSync.onEntityUpdated(entity, changes)  // Entity modified locally
stateSync.onEntityDestroyed(entityId)  // Entity removed locally

// Remote state updates (called by ClientNetwork)
stateSync.onRemoteSnapshot(snapshot)   // Full state from server
stateSync.onRemoteUpdate(update)       // Delta update from remote

// Lifecycle
stateSync.dispose()                    // Cleanup

// Helper methods (used during refactor)
stateSync.flush()                      // Send pending changes immediately
stateSync.getState()                   // Debug: current pending state
```

### Internal Methods

```javascript
// Snapshot/delta application
applySnapshot(snapshot)                // Deserialize and apply full state
applyUpdate(update)                    // Apply single entity update
applyEntityAdded(data)                 // Create entity from remote
applyEntityModified(entityId, changes) // Apply changes to entity
applyEntityRemoved(entityId)           // Remove entity locally

// Batch management
scheduleFlush()                        // Queue flush at next interval
scheduleImmediateFlush()               // Flush ASAP (for critical ops)

// Validation & consistency
validateEntityData(data)               // Check entity structure
validateChanges(entityId, changes)    // Check modification validity
detectInconsistency(localState, remoteState)  // Find divergence

// Helpers
getPendingChanges()                    // List pending modifications
getLastSyncTime()                      // When was last sync
```

### State Tracking

```javascript
this.pendingChanges = new Map([
  [entityId, {
    type: 'create' | 'update' | 'destroy',
    entity?: {...},        // For create
    entityId?: 'id',       // For update/destroy
    changes?: {...},       // For update
    timestamp: number,
    retries: 0,
    error?: string
  }]
])

this.syncState = {
  lastFlush: number,
  lastSnapshot: object,
  remoteState: Map[entityId → lastKnownData],
  inconsistencies: Array[{type, entityId, reason}]
}
```

### Integration Points

#### With Entities System
```javascript
// Current: Entities directly notifies network
entity.markDirty() → network.markDirty(id)

// New: Entities notifies StateSync
Entities lifecycle manager calls:
  - stateSync.onEntityCreated(entity)
  - stateSync.onEntityUpdated(entity, changes)
  - stateSync.onEntityDestroyed(entityId)

StateSync then:
  - Queues change for network transmission
  - Notifies Entities if snapshot received (reverse sync)
```

#### With ServerNetwork
```javascript
// Current: ServerNetwork directly broadcasts changes
onEntityAdded(socket, data) → broadcast to other clients

// New: ServerNetwork delegates to StateSync
ServerNetwork.onEntityAdded(socket, data)
  → stateSync.onRemoteUpdate({type: 'entityAdded', data})
  → stateSync updates internal state
  → stateSync broadcasts to other clients via serverNetwork

StateSync orchestrates multi-client notification
```

#### With ClientNetwork
```javascript
// Current: ClientNetwork routes packets directly to handlers
onSnapshot(data) → snapshotProcessor → entities.deserialize()
onEntityModified(data) → entity.modify()

// New: ClientNetwork delegates to StateSync
ClientNetwork.onSnapshot(data)
  → stateSync.onRemoteSnapshot(data)
  → stateSync deserializes and applies
  → stateSync notifies Entities of new state

ClientNetwork.onEntityModified(data)
  → stateSync.onRemoteUpdate({type: 'entityModified', ...data})
  → stateSync applies change
  → stateSync notifies Entities
```

## Implementation Roadmap

### Phase 1: Create StateSync (No Integration)
- Create `src/core/systems/StateSync.js`
- Implement basic lifecycle methods
- Add snapshot/delta application logic
- Add change batching and flushing
- Add validation layer
- **Result**: New system exists but unused

### Phase 2: Integrate with Entities
- Update EntitySpawner to call stateSync.onEntityCreated()
- Update EntityLifecycle.remove() to call stateSync.onEntityDestroyed()
- Update BaseEntity.markDirty() to call stateSync.onEntityUpdated()
- Keep network.markDirty() calls as fallback (gradual deprecation)
- **Result**: All local changes flow through StateSync

### Phase 3: Integrate with ServerNetwork
- Update ServerNetwork message handlers to call stateSync
- Update ServerNetwork broadcast to use stateSync for coordination
- Update dirty tracking to use StateSync state
- **Result**: Server-side changes coordinated through StateSync

### Phase 4: Integrate with ClientNetwork
- Update ClientNetwork.onSnapshot() to call stateSync
- Update ClientPacketHandlers to call stateSync
- Update SnapshotProcessor to use StateSync
- **Result**: All remote updates applied through StateSync

### Phase 5: Cleanup & Deprecation
- Remove direct network.markDirty() calls from entities
- Remove circular entity/network notifications
- Remove stale event emission paths
- Update tests and documentation
- **Result**: StateSync becomes single source of truth

## Benefits of Abstraction

### Maintainability
- Single place to understand state sync logic
- Clear responsibility boundaries
- Easier to debug state inconsistencies

### Testability
- StateSync can be tested independently
- Mock server/client behaviors
- Test error recovery paths

### Extensibility
- Add new entity types without modifying network
- Implement conflict resolution at StateSync level
- Add state validation/transformation middleware

### Reliability
- Centralized inconsistency detection
- Coordinated retry logic
- Graceful degradation strategies

### Performance
- Batch multiple changes into single flush
- Control flush timing (immediate vs batched)
- Cache remote state for delta computation

## Risk Mitigation

### Risk 1: Circular Dependencies in Event Emission
**Mitigation**: Track change origin (local vs remote) to prevent echo-back

### Risk 2: State Divergence During Refactor
**Mitigation**: Keep both old and new paths active during transition, gradually deprecate

### Risk 3: Loss of Existing Functionality
**Mitigation**: Comprehensive integration tests before removing old code

### Risk 4: Performance Regression
**Mitigation**: Profile state sync operations, benchmark before/after

### Risk 5: Protocol Changes
**Mitigation**: Design StateSync to be protocol-agnostic, adapt to existing format
