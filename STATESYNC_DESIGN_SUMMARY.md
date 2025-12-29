# StateSync Abstraction Layer - Design Summary

## Current Architecture Issues

### Problem Overview
State synchronization is split across multiple systems with overlapping responsibilities:

| System | Responsibility | Location |
|--------|-----------------|----------|
| **ServerNetwork** | Network transmission, message routing, entity tracking | `src/core/systems/ServerNetwork.js` |
| **ClientNetwork** | Snapshot reception, packet decoding, offline mode | `src/core/systems/ClientNetwork.js` |
| **Entities** | Entity storage, lifecycle management, serialization | `src/core/systems/Entities.js` |
| **BaseEntity** | Entity-level state, property tracking, marking dirty | `src/core/entities/BaseEntity.js` |
| **SnapshotCodec** | Full state encoding/decoding | `src/core/systems/network/SnapshotCodec.js` |
| **DeltaCodec** | Incremental change encoding/decoding | `src/core/systems/network/DeltaCodec.js` |
| **ClientPacketHandlers** | Incoming message routing | `src/core/systems/network/ClientPacketHandlers.js` |

### Key Coupling Issues

1. **Bidirectional Notification Loop**
   - Entity sends `network.send('entityAdded')` on creation
   - ServerNetwork broadcasts to clients
   - ClientNetwork creates entity and calls `network.send('entityAdded')` again
   - No clear ownership of state change

2. **Dirty Tracking Fragmentation**
   - Entity calls `markDirty()` → `network.markDirty(id)`
   - ServerNetwork tracks in `dirtyApps`/`dirtyBlueprints` sets
   - Flushes changes via protocol
   - No single place where "dirty" state is managed

3. **Snapshot vs Delta Inconsistency**
   - Full snapshots applied via `SnapshotCodec.deserializeState()`
   - Deltas applied via `entity.modify()`
   - Two different code paths for same operation (state application)
   - Can lead to divergence in how state is applied

4. **Validation Spread**
   - EntitySpawner validates with `validateEntityData()`
   - ClientPacketHandlers have no validation
   - Client/server can diverge on what's valid
   - Risk of inconsistent state creation

5. **Error Recovery Missing**
   - No mechanism to detect state divergence
   - No retry logic for failed updates
   - No heartbeat/checksum verification
   - Connection loss = potential desync

6. **Event Emission Timing Unclear**
   - EVENT.entity.added emitted on creation
   - EVENT.entity.removed emitted on removal
   - No event for modifications
   - Listeners don't know what changed

## StateSync Design

### Core Concept
Single abstraction layer that coordinates all state synchronization:
- Receives lifecycle events from **Entities** (created, updated, destroyed)
- Receives remote updates from **ClientNetwork** (snapshots, deltas)
- Queues changes and flushes to network
- Validates state consistency
- Handles error recovery

### Public API

```javascript
export class StateSync {
  constructor(world)

  // Entity lifecycle (called by Entities system)
  onEntityCreated(entity)              // New entity spawned locally
  onEntityUpdated(entity, changes)     // Entity modified locally
  onEntityDestroyed(entityId)          // Entity removed locally

  // Remote state updates (called by ClientNetwork)
  onRemoteSnapshot(snapshot)           // Full state from server
  onRemoteUpdate(update)               // Single entity update from remote

  // Lifecycle management
  dispose()                            // Cleanup pending changes

  // Internal methods (for debugging/testing)
  flush()                              // Send pending changes immediately
  getState()                           // Get current pending state
  getPendingChanges()                  // List queued changes
}
```

### Internal Architecture

```javascript
class StateSync {
  constructor(world) {
    this.world = world
    this.serverNetwork = world.serverNetwork
    this.entities = world.entities
    this.events = world.events

    // State tracking
    this.pendingChanges = new Map()    // [entityId] → {type, data, timestamp}
    this.remoteState = new Map()       // [entityId] → {lastSyncTime, lastData}
    this.lastFlushTime = 0
    this.flushIntervalMs = 50          // Batch changes every 50ms

    // Flush scheduling
    this.flushTimerId = null
  }

  // Public lifecycle methods
  onEntityCreated(entity) {
    const change = {
      type: 'create',
      entityId: entity.data.id,
      entityData: entity.serialize(),
      timestamp: Date.now()
    }
    this.pendingChanges.set(entity.data.id, change)
    this.scheduleFlush()
  }

  onEntityUpdated(entity, changes) {
    if (this.pendingChanges.has(entity.data.id)) {
      const existing = this.pendingChanges.get(entity.data.id)
      if (existing.type === 'create') {
        // Still creating, merge changes into creation data
        existing.entityData = { ...existing.entityData, ...changes }
      } else {
        // Update existing change
        existing.changes = { ...existing.changes, ...changes }
      }
    } else {
      this.pendingChanges.set(entity.data.id, {
        type: 'update',
        entityId: entity.data.id,
        changes: changes,
        timestamp: Date.now()
      })
    }
    this.scheduleFlush()
  }

  onEntityDestroyed(entityId) {
    const change = {
      type: 'destroy',
      entityId: entityId,
      timestamp: Date.now()
    }
    this.pendingChanges.set(entityId, change)
    this.flush()  // Destroy is immediate, not batched
  }

  // Public remote update methods
  onRemoteSnapshot(snapshot) {
    this.applySnapshot(snapshot)
  }

  onRemoteUpdate(update) {
    switch (update.type) {
      case 'entityAdded':
        this.applyEntityAdded(update.data)
        break
      case 'entityModified':
        this.applyEntityModified(update.data.id, update.data)
        break
      case 'entityRemoved':
        this.applyEntityRemoved(update.data)
        break
    }
  }

  // Internal snapshot/delta application
  applySnapshot(snapshot) {
    // Clear remote state to receive full update
    this.remoteState.clear()

    // Deserialize all entity data
    for (const entityData of snapshot.entities) {
      const entity = this.entities.get(entityData.id)
      if (entity) {
        // Update existing
        entity.deserialize(entityData)
        this.remoteState.set(entityData.id, {
          lastSyncTime: Date.now(),
          lastData: entityData
        })
      } else {
        // Create new
        this.entities.add(entityData, local: false)
        this.remoteState.set(entityData.id, {
          lastSyncTime: Date.now(),
          lastData: entityData
        })
      }
    }

    // Remove entities not in snapshot
    const snapshotIds = new Set(snapshot.entities.map(e => e.id))
    for (const [id] of this.entities.items) {
      if (!snapshotIds.has(id)) {
        this.entities.remove(id)
        this.remoteState.delete(id)
      }
    }
  }

  applyEntityAdded(data) {
    const entity = this.entities.add(data, local: false)
    if (entity) {
      this.remoteState.set(data.id, {
        lastSyncTime: Date.now(),
        lastData: data
      })
    }
  }

  applyEntityModified(entityId, changes) {
    const entity = this.entities.get(entityId)
    if (!entity) {
      console.warn(`[StateSync] Tried to modify non-existent entity: ${entityId}`)
      return
    }

    entity.modify(changes)
    this.remoteState.set(entityId, {
      lastSyncTime: Date.now(),
      lastData: { ...this.remoteState.get(entityId)?.lastData, ...changes }
    })
  }

  applyEntityRemoved(entityId) {
    this.entities.remove(entityId)
    this.remoteState.delete(entityId)
  }

  // Flush management
  scheduleFlush() {
    if (this.flushTimerId) return  // Already scheduled

    this.flushTimerId = setTimeout(() => {
      this.flush()
      this.flushTimerId = null
    }, this.flushIntervalMs)
  }

  flush() {
    if (this.flushTimerId) {
      clearTimeout(this.flushTimerId)
      this.flushTimerId = null
    }

    if (this.pendingChanges.size === 0) return

    const changes = Array.from(this.pendingChanges.values())
    this.pendingChanges.clear()

    // Send via network (implementation depends on isServer/isClient)
    if (this.serverNetwork.isServer) {
      this.serverNetwork.broadcastStateChanges(changes)
    } else {
      this.serverNetwork.send('stateChanges', changes)
    }

    this.lastFlushTime = Date.now()
  }

  dispose() {
    if (this.flushTimerId) {
      clearTimeout(this.flushTimerId)
      this.flushTimerId = null
    }
    this.pendingChanges.clear()
    this.remoteState.clear()
  }

  // Debugging methods
  getState() {
    return {
      pendingChanges: Array.from(this.pendingChanges.values()),
      remoteStateSize: this.remoteState.size,
      lastFlushTime: this.lastFlushTime,
      flushScheduled: this.flushTimerId !== null
    }
  }

  getPendingChanges() {
    return Array.from(this.pendingChanges.values())
  }
}
```

## Integration Strategy

### Phase 1: Creation (No Breaking Changes)
Create `src/core/systems/StateSync.js` as new system without modifying existing code.

### Phase 2: Entities Integration
Update entity lifecycle to notify StateSync:
- EntitySpawner.spawn() → call stateSync.onEntityCreated()
- EntityLifecycle.remove() → call stateSync.onEntityDestroyed()
- BaseEntity.markDirty() → call stateSync.onEntityUpdated()

### Phase 3: ClientNetwork Integration
Route incoming updates through StateSync:
- ClientNetwork.onSnapshot() → stateSync.onRemoteSnapshot()
- ClientPacketHandlers methods → stateSync.onRemoteUpdate()

### Phase 4: ServerNetwork Integration
Route outgoing updates through StateSync:
- ServerNetwork message handlers → stateSync.onRemoteUpdate()
- Dirty tracking → StateSync pending changes

### Phase 5: Cleanup
- Remove direct network.markDirty() calls
- Remove circular entity/network notifications
- Remove stale event emission paths

## Data Flow with StateSync

### Client Creation Example
```
User creates entity:
  ↓
entities.add(data, local=true)
  ↓
EntitySpawner.spawn(data, local=true)
  ↓
entity.markDirty()
  ↓ [NEW]
StateSync.onEntityCreated(entity)
  ↓
Queues: {type: 'create', entityId, entityData, timestamp}
  ↓
[After 50ms batch window]
StateSync.flush()
  ↓
serverNetwork.send('entityAdded', {id, ...data})
  ↓
ServerNetwork receives and broadcasts to all clients
  ↓
ClientNetwork.onEntityAdded(data)
  ↓ [NEW]
StateSync.onRemoteUpdate({type: 'entityAdded', data})
  ↓
StateSync.applyEntityAdded(data)
  ↓
entities.add(data, local=false) [updates remote state cache]
```

### Server Modification Example
```
Server modifies entity:
  ↓
entity.position = newPos
  ↓ [NEW]
StateSync.onEntityUpdated(entity, {position: newPos})
  ↓
Queues: {type: 'update', entityId, changes, timestamp}
  ↓
StateSync.flush()
  ↓
serverNetwork.broadcastStateChanges([change])
  ↓
All clients receive onEntityModified
  ↓ [NEW]
StateSync.onRemoteUpdate({type: 'entityModified', data})
  ↓
StateSync.applyEntityModified(entityId, changes)
  ↓
entity.modify(changes)
```

## Benefits

| Benefit | How StateSync Helps |
|---------|-------------------|
| **Single Source of Truth** | All state changes coordinated in one place |
| **Clear Protocol** | Explicit methods for every state operation |
| **Decoupling** | Entities and Network don't call each other directly |
| **Validation** | Centralized validation before applying state |
| **Error Recovery** | Can implement retry/rollback at StateSync level |
| **Observability** | Track all state changes for debugging |
| **Testability** | StateSync can be unit tested independently |
| **Maintainability** | New state patterns added to one place |
| **Performance** | Batch changes, control flush timing |
| **Consistency** | Remote state cache prevents divergence |

## Files to Create/Modify

### New Files
- `src/core/systems/StateSync.js` - Main abstraction (≈300 LOC)

### Files to Refactor (later phases)
- `src/core/systems/Entities.js` - Remove circular network calls
- `src/core/systems/entities/EntitySpawner.js` - Call stateSync.onEntityCreated()
- `src/core/systems/entities/EntityLifecycle.js` - Call stateSync.onEntityDestroyed()
- `src/core/entities/BaseEntity.js` - Call stateSync.onEntityUpdated()
- `src/core/systems/ClientNetwork.js` - Route through stateSync
- `src/core/systems/ServerNetwork.js` - Route through stateSync
- `src/core/systems/network/ClientPacketHandlers.js` - Use stateSync

### No Changes Needed
- `src/core/systems/network/SnapshotCodec.js` - Still used for serialization format
- `src/core/systems/network/DeltaCodec.js` - Still used for delta computation
- Network transport layer - Protocols unchanged

## Testing Strategy

### Unit Tests for StateSync
- Create → queue, flush → network called
- Update → batch with same window, merge changes
- Destroy → immediate flush
- Remote snapshot → entities updated, remote state cache populated
- Remote delta → apply changes, update cache
- Conflict detection → different versions
- Offline → pending changes preserved

### Integration Tests
- Full round-trip: local create → broadcast → received → applied
- Modification cycle: local change → queued → broadcast → received
- Concurrent changes: multiple entities changing simultaneously
- Network disconnect: changes queued, resume on reconnect
- State consistency: client/server state matches after operations

## Success Criteria

1. **All existing functionality works unchanged**
   - Entities created/destroyed/modified
   - Updates broadcast correctly
   - Snapshots apply correctly
   - No network protocol changes

2. **StateSync becomes central coordinator**
   - All state changes flow through StateSync
   - Clear flow from Entities → StateSync → Network

3. **Code clarity improves**
   - Easier to understand state sync flow
   - Clear separation of concerns
   - Reduced coupling between systems

4. **Error handling improves**
   - Inconsistencies detected
   - Retry logic implemented
   - Graceful degradation strategies

5. **Testability improves**
   - StateSync testable in isolation
   - Mock network/entities for testing
   - Easier to add new state patterns

## Next Steps

1. Review this design document
2. Implement Phase 1: Create StateSync.js
3. Write comprehensive unit tests
4. Implement Phase 2: Entities integration
5. Implement Phase 3: ClientNetwork integration
6. Implement Phase 4: ServerNetwork integration
7. Phase 5: Cleanup and deprecate old paths
