# StateSync: Coupling Analysis & Resolution

## Current Coupling Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────────┐      ┌──────────────────────┐   │
│  │   BaseEntity             │      │  ServerNetwork       │   │
│  │                          │      │                      │   │
│  │  constructor():          │◀─────│  markDirty(id)       │   │
│  │    network.send(         │  1   │  broadcastDelta()    │   │
│  │      'entityAdded'       │      │  trackDirty()        │   │
│  │    )                     │      │                      │   │
│  │                          │      │  dirtyApps Set       │   │
│  │  markDirty():            │      │  dirtyBlueprints Set │   │
│  │    network.markDirty(    │──────┐                      │   │
│  │      this.id             │  2   │  protocol.flush()    │   │
│  │    )                     │      │                      │   │
│  │                          │      │                      │   │
│  │  modify(updates):        │◀─────│  onEntityModified()  │   │
│  │    this.data[key] =      │  3   │  onEntityRemoved()   │   │
│  │      updates[key]        │      │  onEntityAdded()     │   │
│  │    markDirty()           │      │                      │   │
│  │                          │      │                      │   │
│  └──────────────────────────┘      └──────────────────────┘   │
│           ▲                                                     │
│           │ 4                                                   │
│           │                                                     │
│  ┌────────┴─────────────────┐      ┌──────────────────────┐   │
│  │   Entities               │      │  ClientNetwork       │   │
│  │                          │      │                      │   │
│  │  items Map[id→entity]    │      │  onSnapshot(data)    │   │
│  │  players Map             │◀─────│    snapshotProcessor │   │
│  │                          │  5   │      .process()      │   │
│  │  add(data, local=T/F)    │      │                      │   │
│  │    EntitySpawner.spawn() │      │  onEntityAdded(data) │   │
│  │    entity.constructor()  │      │    entities.add()    │   │
│  │                          │  ┌───│                      │   │
│  │  remove(id)              │  │ 6 │  onEntityModified()  │   │
│  │    items.delete()        │  │   │    entity.modify()   │   │
│  │    Lifecycle.remove()    │  │   │                      │   │
│  │                          │  │   │  onEntityRemoved()   │   │
│  │  deserialize(datas)      │  │   │    entities.remove() │   │
│  │    add(data) for each    │  │   │                      │   │
│  │                          │  │   │  packetHandlers      │   │
│  │  events.emit()           │  │   │    handleEntity...() │   │
│  │    entity.added          │──┘   │                      │   │
│  │    entity.removed        │      └──────────────────────┘   │
│  │                          │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
│  LEGEND:                                                        │
│  1. Entity notifies network on creation (bidirectional!)        │
│  2. Entity marks dirty, network tracks in sets                  │
│  3. Network broadcasts changes, entity receives and modifies    │
│  4. Entities emit events on create/remove                       │
│  5. Network sends snapshot, entities deserialize                │
│  6. Network packets routed directly to entity methods           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Specific Coupling Issues

### Issue 1: Bidirectional Entity-Network Notifications

#### Current Code Flow
```javascript
// File: src/core/entities/BaseEntity.js (lines 18-20)
if (local && world?.network) {
  world.network.send('entityAdded', this.data)
}

// File: src/core/systems/ServerNetwork.js (lines 126-128)
onEntityAdded = (socket, data) => {
  return this.builderCommandHandler.onEntityAdded(socket, data)
}

// Calls BuilderCommandHandler which broadcasts to all clients
// Clients then receive and call:
// File: src/core/systems/network/ClientPacketHandlers.js (lines 26-28)
handleEntityAdded(data) {
  this.network.entities.add(data)
}

// Which calls back to BaseEntity constructor, starting cycle again!
```

#### Problem
- Entity constructor couples to network existence
- Network must exist for entity creation
- If network is unavailable, entity creation fails silently
- Creates "ghost" entities that aren't synced
- Testing entities requires mocking network

#### How StateSync Fixes It
```javascript
// Entity creation is decoupled from network
constructor(world, data) {
  super(world, data)
  // No network.send() here!
}

// Entity notifies StateSync instead
EntitySpawner.spawn(data, local) {
  const entity = new Entity(world, data, local)
  if (local) {
    stateSync.onEntityCreated(entity)  // ← StateSync handles sync
  }
  return entity
}

// StateSync owns when/how to send to network
StateSync.onEntityCreated(entity) {
  this.pendingChanges.set(entity.id, {
    type: 'create',
    entityData: entity.serialize(),
    timestamp: Date.now()
  })
  this.scheduleFlush()
}

StateSync.flush() {
  // Send all pending changes at once
  this.serverNetwork.broadcastStateChanges(changes)
}

// When client receives broadcast:
ClientNetwork.onEntityAdded(data) {
  // Doesn't call entity constructor directly
  stateSync.onRemoteUpdate({type: 'entityAdded', data})
}

StateSync.onRemoteUpdate({type: 'entityAdded', data}) {
  this.entities.add(data, local=false)  // ← Entities adds, not network
}
```

**Key Change**: Entity creation is now decoupled from network synchronization through StateSync.

---

### Issue 2: Dirty Tracking Spread Across Systems

#### Current Code Flow
```javascript
// File: src/core/entities/BaseEntity.js (lines 46-50)
markDirty() {
  if (this.world?.network?.markDirty) {
    this.world.network.markDirty(this.id)
  }
}

// File: src/core/systems/ServerNetwork.js (no markDirty method shown)
// Presumably has dirty tracking in protocol/managers
// But implementation is spread across multiple files

// File: src/core/systems/network/SnapshotCodec.js
// Encodes full entity state, not deltas
static encode(network) {
  return {
    entities: network.entities.serialize(),  // Full serialization
    ...
  }
}

// File: src/core/systems/network/DeltaCodec.js (lines 49-66)
// Separate codec for computing deltas
static encodeEntityDelta(entity, previousState) {
  const delta = { id: entity.id }
  let hasChanges = false

  for (const [key, value] of Object.entries(entity.data)) {
    if (key === 'id') continue
    if (!this.equals(value, previousState[key])) {
      delta[key] = value
      hasChanges = true
    }
  }

  return hasChanges ? delta : null
}
```

#### Problem
- Three places track changes: BaseEntity.markDirty(), ServerNetwork dirty sets, DeltaCodec comparison
- No single source of truth for what changed
- Dirty tracking is unclear - ServerNetwork has sets but usage is scattered
- DeltaCodec duplicates entity comparison logic
- Can't replay changes or understand change history
- Difficult to add features like conflict resolution or change validation

#### How StateSync Fixes It
```javascript
// Single place tracks all pending changes
this.pendingChanges = new Map([
  ['entity-id', {
    type: 'create' | 'update' | 'destroy',
    entityId: 'entity-id',
    changes: {position: [...], quaternion: [...]},
    timestamp: 1234567890,
    retries: 0
  }]
])

// Entity calls StateSync on any modification
BaseEntity.markDirty() {
  if (this.world?.stateSync) {
    // Compute actual changes vs previous
    const changes = this.getChangedProperties()
    this.world.stateSync.onEntityUpdated(this, changes)
  }
}

// StateSync has full picture
StateSync.onEntityUpdated(entity, changes) {
  const existing = this.pendingChanges.get(entity.id)
  if (existing?.type === 'update') {
    // Merge with existing changes
    existing.changes = {...existing.changes, ...changes}
  } else {
    // New update
    this.pendingChanges.set(entity.id, {
      type: 'update',
      entityId: entity.id,
      changes: changes,
      timestamp: Date.now()
    })
  }
  this.scheduleFlush()
}

// Single flush point
StateSync.flush() {
  const toSend = Array.from(this.pendingChanges.values())
  this.serverNetwork.sendStateChanges(toSend)
  this.pendingChanges.clear()
}
```

**Key Change**: All dirty/change tracking centralized in StateSync.pendingChanges Map.

---

### Issue 3: Snapshot vs Delta Inconsistency

#### Current Code Flow
```javascript
// File: src/core/systems/network/SnapshotCodec.js (lines 36-44)
// Full snapshot deserialization
static deserializeState(data, network) {
  network.collections.deserialize(data.collections)
  network.settings.deserialize(data.settings)
  network.chat.deserialize(data.chat)
  network.blueprints.deserialize(data.blueprints)
  network.entities.deserialize(data.entities)    // ← Full entity list
  network.livekit?.deserialize(data.livekit)
}

// File: src/core/systems/Entities.js (lines 62-66)
deserialize(datas) {
  for (const data of datas) {
    this.add(data)                                // ← Calls add() for each
  }
}

// File: src/core/systems/network/ClientPacketHandlers.js (lines 26-34)
// Delta update deserialization
handleEntityAdded(data) {
  this.network.entities.add(data)                // ← Direct add()
}

handleEntityModified(data) {
  const entity = this.network.entities.get(data.id)
  if (!entity) return console.error('no entity found', data)
  entity.modify(data)                            // ← Direct modify()
}

handleEntityRemoved(id) {
  this.network.entities.remove(id)              // ← Direct remove()
}
```

#### Problem
- Snapshot uses Entities.deserialize() (calls add() for each)
- Deltas use entity.modify() (applies properties directly)
- Both paths lead to entity state changes but differently
- If modify() has side effects, full snapshot won't trigger them
- Can't change state application logic without updating both paths
- No validation on deltas vs snapshots
- No consistency check between applied state and canonical state

#### How StateSync Fixes It
```javascript
// Single state application logic
StateSync.applySnapshot(snapshot) {
  // Clear remote tracking
  this.remoteState.clear()

  // Apply all entities through same path
  for (const entityData of snapshot.entities) {
    const entity = this.entities.get(entityData.id)
    if (entity) {
      // Use applyEntityModified for consistency
      this.applyEntityModified(entityData.id, entityData)
    } else {
      // Use applyEntityAdded for consistency
      this.applyEntityAdded(entityData)
    }

    // Track remote state
    this.remoteState.set(entityData.id, {
      lastSyncTime: Date.now(),
      lastData: entityData
    })
  }

  // Remove entities not in snapshot
  const snapshotIds = new Set(snapshot.entities.map(e => e.id))
  for (const [id] of this.entities.items) {
    if (!snapshotIds.has(id)) {
      this.applyEntityRemoved(id)
    }
  }
}

// All deltas use same application path
StateSync.onRemoteUpdate(update) {
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

// Single implementation
applyEntityModified(entityId, changes) {
  const entity = this.entities.get(entityId)
  if (!entity) {
    console.warn(`Entity not found: ${entityId}`)
    return
  }

  entity.modify(changes)

  // Always track what we know about this entity
  this.remoteState.set(entityId, {
    lastSyncTime: Date.now(),
    lastData: { ...this.remoteState.get(entityId)?.lastData, ...changes }
  })
}
```

**Key Change**: Snapshot and delta both use StateSync application methods for consistency.

---

### Issue 4: Validation Inconsistency

#### Current Code Flow
```javascript
// File: src/core/systems/entities/EntitySpawner.js (lines 72-119)
// Comprehensive validation on spawn
validateEntityData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid entity data type' }
  }

  if (!data.id || typeof data.id !== 'string') {
    return { valid: false, error: 'Invalid entity id' }
  }

  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, error: 'Invalid entity type' }
  }

  // Validates position, quaternion, scale
  const posValidation = validateVector3(data.position, 'position')
  if (!posValidation.valid) {
    return posValidation
  }

  return { valid: true }
}

// File: src/core/systems/network/ClientPacketHandlers.js (lines 26-34)
// NO VALIDATION on remote updates!
handleEntityAdded(data) {
  this.network.entities.add(data)              // ← No validation
}

handleEntityModified(data) {
  const entity = this.network.entities.get(data.id)
  if (!entity) return console.error('onEntityModified: no entity found', data)
  entity.modify(data)                          // ← No validation
}

handleEntityRemoved(id) {
  this.network.entities.remove(id)             // ← No validation
}
```

#### Problem
- EntitySpawner validates on creation
- ClientPacketHandlers don't validate on remote updates
- Malformed/malicious data from network can create invalid entities
- Client/server can diverge on what's valid
- Security risk: invalid entity data could crash client code
- No audit trail of validation decisions

#### How StateSync Fixes It
```javascript
// Centralized validation
StateSync.applyEntityAdded(data) {
  // Validate before creating
  const validation = this.validateEntityData(data)
  if (!validation.valid) {
    console.error(`[StateSync] Invalid entity rejected: ${validation.error}`)
    this.recordInconsistency({
      type: 'invalidEntity',
      entityId: data.id,
      reason: validation.error,
      timestamp: Date.now()
    })
    return
  }

  // Now safe to create
  const entity = this.entities.add(data, local=false)
  if (entity) {
    this.remoteState.set(data.id, {
      lastSyncTime: Date.now(),
      lastData: data
    })
  }
}

StateSync.applyEntityModified(entityId, changes) {
  const entity = this.entities.get(entityId)
  if (!entity) {
    this.recordInconsistency({
      type: 'entityNotFound',
      entityId: entityId,
      timestamp: Date.now()
    })
    return
  }

  // Validate changes
  const validation = this.validateChanges(entityId, changes)
  if (!validation.valid) {
    console.warn(`[StateSync] Invalid changes rejected: ${validation.error}`)
    this.recordInconsistency({
      type: 'invalidChanges',
      entityId: entityId,
      reason: validation.error,
      timestamp: Date.now()
    })
    return
  }

  // Apply validated changes
  entity.modify(changes)

  this.remoteState.set(entityId, {
    lastSyncTime: Date.now(),
    lastData: { ...this.remoteState.get(entityId)?.lastData, ...changes }
  })
}

validateEntityData(data) {
  // Same validation as EntitySpawner
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid type' }
  }

  if (!data.id || typeof data.id !== 'string') {
    return { valid: false, error: 'Invalid id' }
  }

  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, error: 'Invalid type' }
  }

  return { valid: true }
}

validateChanges(entityId, changes) {
  // Validate that changes are for known entity
  if (changes.type && !['app', 'playerLocal', 'playerRemote'].includes(changes.type)) {
    return { valid: false, error: 'Invalid type change' }
  }

  // Validate position/quaternion if present
  if (changes.position) {
    const validation = validateVector3(changes.position, 'position')
    if (!validation.valid) return validation
  }

  return { valid: true }
}

recordInconsistency(inconsistency) {
  if (!this.inconsistencies) this.inconsistencies = []
  this.inconsistencies.push(inconsistency)

  // Could trigger recovery: request full snapshot, reject changes, etc.
  if (this.inconsistencies.length > 10) {
    console.error('[StateSync] Too many inconsistencies, requesting full snapshot')
    this.serverNetwork.requestFullSnapshot()
  }
}
```

**Key Change**: All state application goes through StateSync validation layer.

---

### Issue 5: No Error Recovery

#### Current Code Flow
```javascript
// Connection drops
// ClientNetwork.onClose() fires
// But no mechanism to:
//   - Detect state divergence
//   - Verify consistency
//   - Request state validation
//   - Replay changes

// If server changes entity while client offline:
// - Changes are lost when reconnect
// - Full snapshot overwrites local state
// - Unpersisted local changes are lost
```

#### Problem
- No heartbeat to detect divergence
- No checksums to verify state consistency
- No change log for conflict resolution
- Lost changes on disconnect/reconnect
- Silent data loss possible

#### How StateSync Fixes It
```javascript
// Track remote state for comparison
this.remoteState = new Map([
  ['entity-id', {
    lastSyncTime: 1234567890,
    lastData: {id, position: [...], quaternion: [...], ...}
  }]
])

// Can detect inconsistencies
StateSync.detectInconsistency(entityId) {
  const local = this.entities.get(entityId)
  const remote = this.remoteState.get(entityId)

  if (!local && remote) {
    return {
      type: 'missingLocal',
      reason: 'Local entity missing but server has it',
      recover: 'createFromRemote'
    }
  }

  if (local && !remote) {
    return {
      type: 'orphanedLocal',
      reason: 'Local entity exists but server deleted it',
      recover: 'deleteLocal'
    }
  }

  if (local && remote) {
    // Check if data diverged
    if (!this.equals(local.data, remote.lastData)) {
      return {
        type: 'dataConflict',
        reason: 'Local and remote data diverged',
        local: local.data,
        remote: remote.lastData,
        recover: 'requestSnapshot'
      }
    }
  }

  return null
}

// Recover on reconnect
ClientNetwork.onReconnect() {
  this.stateSync.detectAllInconsistencies()
  this.stateSync.requestFullSnapshot()
}

StateSync.detectAllInconsistencies() {
  const issues = []

  for (const [entityId] of this.entities.items) {
    const issue = this.detectInconsistency(entityId)
    if (issue) issues.push({entityId, ...issue})
  }

  for (const [entityId] of this.remoteState) {
    if (!this.entities.items.has(entityId)) {
      issues.push({
        entityId,
        type: 'missingLocal',
        recover: 'createFromRemote'
      })
    }
  }

  console.log('[StateSync] Detected inconsistencies:', issues)
  return issues
}
```

**Key Change**: StateSync maintains remote state snapshot for consistency verification.

---

## Summary of Coupling Resolutions

| Issue | Current Problem | StateSync Solution |
|-------|-----------------|-------------------|
| **Bidirectional Notifications** | Entity constructor calls network.send() | StateSync owns sync timing, entity creation decoupled |
| **Dirty Tracking Spread** | Marked in entity, tracked in server, computed in codec | Single Map in StateSync tracks all changes |
| **Snapshot vs Delta Paths** | Two different application paths | Both use StateSync.applyEntity* methods |
| **Validation Inconsistency** | Only on creation, not on remote updates | StateSync validates all state before applying |
| **No Error Recovery** | Silent data loss on disconnect | StateSync maintains remote cache for consistency checks |
| **Event Emission Timing** | Events emitted in spawner/lifecycle | StateSync owns when events are emitted |
| **Testing Difficulty** | Network required for entity tests | StateSync testable in isolation, network mocked |
| **Change History** | No audit trail | StateSync.pendingChanges provides change log |

## Result

StateSync becomes the **single coordinator** for all state synchronization, eliminating the coupling between:
- Entities and ServerNetwork
- Entities and ClientNetwork
- SnapshotCodec and DeltaCodec
- Local state and network transmission

All three systems remain but become **independent**, communicating only through StateSync's clean API.
