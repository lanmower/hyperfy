# StateSync Implementation Guide

## Quick Reference

**New File**: `src/core/systems/StateSync.js` (≈300-400 LOC)

**Core Methods**:
```javascript
// Entity lifecycle (called by Entities system)
onEntityCreated(entity)           // New entity spawned
onEntityUpdated(entity, changes)  // Entity modified
onEntityDestroyed(entityId)       // Entity removed

// Remote updates (called by ClientNetwork)
onRemoteSnapshot(snapshot)        // Full state from server
onRemoteUpdate(update)            // Single entity delta

// Lifecycle
dispose()                         // Cleanup
```

**Key Properties**:
```javascript
this.pendingChanges = new Map()   // Queued changes [entityId → change]
this.remoteState = new Map()      // [entityId → {lastSyncTime, lastData}]
this.lastFlushTime = 0            // Timestamp of last flush
this.flushIntervalMs = 50         // Batch window
```

---

## File Structure

### Import & Class Definition
```javascript
// src/core/systems/StateSync.js

export class StateSync {
  constructor(world) {
    this.world = world
    this.serverNetwork = world.serverNetwork
    this.entities = world.entities
    this.events = world.events

    this.pendingChanges = new Map()
    this.remoteState = new Map()
    this.lastFlushTime = 0
    this.flushIntervalMs = 50
    this.flushTimerId = null

    console.log('[StateSync] Initialized')
  }

  // ... methods follow
}
```

### Public API Section

```javascript
// ============================================================================
// PUBLIC API: Entity Lifecycle Events
// Called by Entities system when entities are created, updated, or destroyed
// ============================================================================

onEntityCreated(entity) {
  if (!entity || !entity.data || !entity.data.id) {
    console.warn('[StateSync] onEntityCreated: invalid entity')
    return
  }

  console.log('[StateSync] Entity created:', entity.data.id)

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
  if (!entity || !entity.data || !entity.data.id) {
    console.warn('[StateSync] onEntityUpdated: invalid entity')
    return
  }

  if (!changes || Object.keys(changes).length === 0) {
    return  // No actual changes
  }

  console.log('[StateSync] Entity updated:', entity.data.id, Object.keys(changes))

  const existing = this.pendingChanges.get(entity.data.id)

  if (existing) {
    if (existing.type === 'create') {
      // Still pending creation, merge changes into creation data
      existing.entityData = { ...existing.entityData, ...changes }
    } else if (existing.type === 'update') {
      // Merge with existing update
      existing.changes = { ...existing.changes, ...changes }
    }
    // If type === 'destroy', don't add updates (entity being removed)
  } else {
    // New update to existing entity
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
  if (!entityId) {
    console.warn('[StateSync] onEntityDestroyed: invalid entityId')
    return
  }

  console.log('[StateSync] Entity destroyed:', entityId)

  const change = {
    type: 'destroy',
    entityId: entityId,
    timestamp: Date.now()
  }

  this.pendingChanges.set(entityId, change)
  this.remoteState.delete(entityId)
  this.flush()  // Destroy is immediate, not batched
}
```

### Remote Update Section

```javascript
// ============================================================================
// PUBLIC API: Remote State Updates
// Called by ClientNetwork when receiving snapshots or deltas
// ============================================================================

onRemoteSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.entities)) {
    console.warn('[StateSync] Invalid snapshot')
    return
  }

  console.log('[StateSync] Received snapshot with', snapshot.entities.length, 'entities')
  this.applySnapshot(snapshot)
}

onRemoteUpdate(update) {
  if (!update || !update.type) {
    console.warn('[StateSync] Invalid update')
    return
  }

  console.log('[StateSync] Received update:', update.type)

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
    default:
      console.warn('[StateSync] Unknown update type:', update.type)
  }
}
```

### State Application Section

```javascript
// ============================================================================
// INTERNAL: State Application & Consistency
// Applies snapshots and deltas to local state
// ============================================================================

applySnapshot(snapshot) {
  console.log('[StateSync] Applying snapshot...')

  // Clear remote state tracking
  this.remoteState.clear()

  // Apply each entity from snapshot
  const entityIds = new Set()
  for (const entityData of snapshot.entities) {
    entityIds.add(entityData.id)

    const validation = this.validateEntityData(entityData)
    if (!validation.valid) {
      console.warn(`[StateSync] Snapshot entity rejected: ${validation.error}`)
      continue
    }

    const entity = this.entities.get(entityData.id)
    if (entity) {
      // Update existing entity
      entity.deserialize(entityData)
    } else {
      // Create new entity
      this.entities.add(entityData, false)
    }

    // Track remote state
    this.remoteState.set(entityData.id, {
      lastSyncTime: Date.now(),
      lastData: { ...entityData }
    })
  }

  // Remove entities not in snapshot
  const toRemove = []
  for (const [id] of this.entities.items) {
    if (!entityIds.has(id)) {
      toRemove.push(id)
    }
  }

  for (const id of toRemove) {
    this.entities.remove(id)
    this.remoteState.delete(id)
  }

  console.log('[StateSync] Snapshot applied. Entities: local=',
    this.entities.items.size, 'remote=', this.remoteState.size)
}

applyEntityAdded(data) {
  if (!data || !data.id) {
    console.warn('[StateSync] Invalid entity data in applyEntityAdded')
    return
  }

  console.log('[StateSync] Applying entity added:', data.id)

  const validation = this.validateEntityData(data)
  if (!validation.valid) {
    console.error(`[StateSync] Entity rejected: ${validation.error}`)
    return
  }

  // Don't recreate if already exists
  if (this.entities.get(data.id)) {
    console.warn('[StateSync] Entity already exists:', data.id)
    return
  }

  const entity = this.entities.add(data, false)
  if (entity) {
    this.remoteState.set(data.id, {
      lastSyncTime: Date.now(),
      lastData: { ...data }
    })
  }
}

applyEntityModified(entityId, changes) {
  if (!entityId || !changes) {
    console.warn('[StateSync] Invalid parameters in applyEntityModified')
    return
  }

  console.log('[StateSync] Applying entity modified:', entityId)

  const entity = this.entities.get(entityId)
  if (!entity) {
    console.warn(`[StateSync] Entity not found in applyEntityModified: ${entityId}`)
    return
  }

  const validation = this.validateChanges(entityId, changes)
  if (!validation.valid) {
    console.warn(`[StateSync] Changes rejected: ${validation.error}`)
    return
  }

  entity.modify(changes)

  // Update remote state cache
  const cached = this.remoteState.get(entityId) || { lastData: {} }
  this.remoteState.set(entityId, {
    lastSyncTime: Date.now(),
    lastData: { ...cached.lastData, ...changes }
  })
}

applyEntityRemoved(entityId) {
  if (!entityId) {
    console.warn('[StateSync] Invalid entityId in applyEntityRemoved')
    return
  }

  console.log('[StateSync] Applying entity removed:', entityId)

  const entity = this.entities.get(entityId)
  if (entity) {
    this.entities.remove(entityId)
  }

  this.remoteState.delete(entityId)
}
```

### Validation Section

```javascript
// ============================================================================
// INTERNAL: Validation
// ============================================================================

validateEntityData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Not an object' }
  }

  if (!data.id || typeof data.id !== 'string') {
    return { valid: false, error: 'Missing or invalid id' }
  }

  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, error: 'Missing or invalid type' }
  }

  const validTypes = ['app', 'playerLocal', 'playerRemote', 'player']
  if (!validTypes.includes(data.type)) {
    return { valid: false, error: `Unknown type: ${data.type}` }
  }

  return { valid: true }
}

validateChanges(entityId, changes) {
  if (!changes || typeof changes !== 'object') {
    return { valid: false, error: 'Changes not an object' }
  }

  // Validate position if present
  if ('position' in changes) {
    if (!Array.isArray(changes.position) || changes.position.length !== 3) {
      return { valid: false, error: 'Invalid position' }
    }
  }

  // Validate quaternion if present
  if ('quaternion' in changes) {
    if (!Array.isArray(changes.quaternion) || changes.quaternion.length !== 4) {
      return { valid: false, error: 'Invalid quaternion' }
    }
  }

  return { valid: true }
}
```

### Flush Management Section

```javascript
// ============================================================================
// INTERNAL: Flush Management
// ============================================================================

scheduleFlush() {
  // Already scheduled?
  if (this.flushTimerId !== null) {
    return
  }

  // Schedule flush for next batch window
  this.flushTimerId = setTimeout(() => {
    this.flush()
    this.flushTimerId = null
  }, this.flushIntervalMs)
}

flush() {
  // Clear any pending flush timer
  if (this.flushTimerId !== null) {
    clearTimeout(this.flushTimerId)
    this.flushTimerId = null
  }

  // Nothing to send?
  if (this.pendingChanges.size === 0) {
    return
  }

  console.log('[StateSync] Flushing', this.pendingChanges.size, 'changes')

  // Collect all pending changes
  const changes = Array.from(this.pendingChanges.values())
  this.pendingChanges.clear()

  // Send to network
  // This will differ based on isServer vs isClient
  if (this.serverNetwork.isServer) {
    // Server broadcasts to all clients
    this.broadcastStateChanges(changes)
  } else {
    // Client sends to server
    this.sendStateChanges(changes)
  }

  this.lastFlushTime = Date.now()
}

broadcastStateChanges(changes) {
  // Server implementation: broadcast to all connected clients
  // This is called by ServerNetwork
  console.log('[StateSync] Broadcasting', changes.length, 'changes to clients')

  // Depends on ServerNetwork implementation
  if (this.serverNetwork.send) {
    this.serverNetwork.send('stateChanges', { changes })
  }
}

sendStateChanges(changes) {
  // Client implementation: send to server
  console.log('[StateSync] Sending', changes.length, 'changes to server')

  if (this.serverNetwork.send) {
    this.serverNetwork.send('stateChanges', { changes })
  }
}
```

### Lifecycle Section

```javascript
// ============================================================================
// INTERNAL: Lifecycle
// ============================================================================

dispose() {
  // Clear pending flush
  if (this.flushTimerId !== null) {
    clearTimeout(this.flushTimerId)
    this.flushTimerId = null
  }

  // Clear pending changes
  this.pendingChanges.clear()

  // Clear remote state cache
  this.remoteState.clear()

  console.log('[StateSync] Disposed')
}
```

### Debug/Utility Section

```javascript
// ============================================================================
// DEBUG: State Inspection
// ============================================================================

getState() {
  return {
    pendingChangesCount: this.pendingChanges.size,
    pendingChanges: Array.from(this.pendingChanges.values()).map(c => ({
      type: c.type,
      entityId: c.entityId,
      timestamp: c.timestamp
    })),
    remoteStateCount: this.remoteState.size,
    lastFlushTime: this.lastFlushTime,
    flushScheduled: this.flushTimerId !== null,
    flushIntervalMs: this.flushIntervalMs
  }
}

getPendingChanges() {
  return Array.from(this.pendingChanges.values())
}

getRemoteState(entityId) {
  return this.remoteState.get(entityId) || null
}

// Default export
export default StateSync
```

---

## Integration Checklist

### Phase 1: Create StateSync
- [ ] Create `src/core/systems/StateSync.js`
- [ ] Register StateSync in World initialization
- [ ] Write unit tests for StateSync
- [ ] Verify all methods work in isolation

### Phase 2: Integrate with Entities
- [ ] Update `EntitySpawner.spawn()` to call `stateSync.onEntityCreated()`
- [ ] Update `EntityLifecycle.remove()` to call `stateSync.onEntityDestroyed()`
- [ ] Update `BaseEntity.markDirty()` to call `stateSync.onEntityUpdated()`
- [ ] Test entity creation/modification/removal flow

### Phase 3: Integrate with ClientNetwork
- [ ] Update `ClientNetwork.onSnapshot()` to call `stateSync.onRemoteSnapshot()`
- [ ] Update `ClientPacketHandlers` to call `stateSync.onRemoteUpdate()`
- [ ] Test snapshot and delta reception

### Phase 4: Integrate with ServerNetwork
- [ ] Update ServerNetwork message handlers to call StateSync
- [ ] Update ServerNetwork broadcast to use StateSync
- [ ] Test server-side state changes

### Phase 5: Cleanup
- [ ] Remove direct `network.markDirty()` calls
- [ ] Remove circular notifications
- [ ] Update tests
- [ ] Document integration

---

## Testing Strategy

### Unit Tests
```javascript
describe('StateSync', () => {
  describe('onEntityCreated', () => {
    test('queues creation change', () => {
      const entity = {id: 'test', data: {id: 'test'}, serialize: () => ({id: 'test'})}
      stateSync.onEntityCreated(entity)
      expect(stateSync.pendingChanges.size).toBe(1)
      expect(stateSync.pendingChanges.get('test').type).toBe('create')
    })

    test('schedules flush', () => {
      const entity = {id: 'test', data: {id: 'test'}, serialize: () => ({id: 'test'})}
      stateSync.onEntityCreated(entity)
      expect(stateSync.flushTimerId).not.toBeNull()
    })
  })

  describe('onEntityUpdated', () => {
    test('queues update change', () => {
      const entity = {id: 'test', data: {id: 'test'}}
      stateSync.pendingChanges.set('test', {type: 'update', entityId: 'test', changes: {}})
      stateSync.onEntityUpdated(entity, {position: [1, 2, 3]})
      expect(stateSync.pendingChanges.get('test').changes.position).toEqual([1, 2, 3])
    })

    test('merges with pending create', () => {
      const entity = {id: 'test', data: {id: 'test'}}
      stateSync.pendingChanges.set('test', {type: 'create', entityId: 'test', entityData: {}})
      stateSync.onEntityUpdated(entity, {position: [1, 2, 3]})
      expect(stateSync.pendingChanges.get('test').entityData.position).toEqual([1, 2, 3])
    })
  })

  describe('applySnapshot', () => {
    test('creates entities from snapshot', () => {
      const entities = {add: jest.fn()}
      stateSync.entities = entities
      stateSync.applySnapshot({
        entities: [{id: 'test', type: 'app'}]
      })
      expect(entities.add).toHaveBeenCalledWith({id: 'test', type: 'app'}, false)
    })

    test('removes entities not in snapshot', () => {
      const entities = {
        items: new Map([['test', {}]]),
        get: jest.fn(),
        remove: jest.fn()
      }
      stateSync.entities = entities
      stateSync.applySnapshot({entities: []})
      expect(entities.remove).toHaveBeenCalledWith('test')
    })
  })

  describe('flush', () => {
    test('clears pending changes', () => {
      stateSync.pendingChanges.set('test', {type: 'create'})
      stateSync.flush()
      expect(stateSync.pendingChanges.size).toBe(0)
    })

    test('calls network send', () => {
      stateSync.serverNetwork.send = jest.fn()
      stateSync.pendingChanges.set('test', {type: 'create'})
      stateSync.flush()
      expect(stateSync.serverNetwork.send).toHaveBeenCalled()
    })
  })
})
```

---

## Common Patterns

### Handling Change Merging
```javascript
onEntityUpdated(entity, changes) {
  const existing = this.pendingChanges.get(entity.data.id)

  if (existing?.type === 'create') {
    // Merge into creation
    existing.entityData = {...existing.entityData, ...changes}
  } else if (existing?.type === 'update') {
    // Merge updates
    existing.changes = {...existing.changes, ...changes}
  } else {
    // New update
    this.pendingChanges.set(entity.data.id, {
      type: 'update',
      entityId: entity.data.id,
      changes,
      timestamp: Date.now()
    })
  }
}
```

### Validation Before Application
```javascript
applyEntityAdded(data) {
  const validation = this.validateEntityData(data)
  if (!validation.valid) {
    console.error(`[StateSync] Entity rejected: ${validation.error}`)
    return
  }
  // Safe to create now
  this.entities.add(data, false)
}
```

### Remote State Caching
```javascript
applyEntityModified(entityId, changes) {
  const entity = this.entities.get(entityId)
  entity.modify(changes)

  // Cache what we know about remote state
  const cached = this.remoteState.get(entityId) || {lastData: {}}
  this.remoteState.set(entityId, {
    lastSyncTime: Date.now(),
    lastData: {...cached.lastData, ...changes}
  })
}
```

---

## Troubleshooting

### Changes Not Flushing
- Check: Is `world.stateSync` initialized?
- Check: Is `stateSync.flushIntervalMs` too large?
- Check: Is network available? (check `world.serverNetwork.isConnected`)

### Entities Not Syncing
- Check: Are lifecycle calls being made? (`onEntityCreated`, `onEntityUpdated`)
- Check: Is `scheduleFlush()` being called?
- Check: Are pending changes being cleared? (check `stateSync.pendingChanges`)

### Validation Failing
- Check: Entity data structure (needs `id` and `type`)
- Check: Position/quaternion format (must be arrays)
- Check: Entity type is valid ('app', 'playerLocal', 'playerRemote')

### Memory Leaks
- Check: Is `dispose()` being called on shutdown?
- Check: Is flush timer cleared? (check `flushTimerId`)
- Check: Remote state cache growing unbounded? (limit size if needed)

---

## Next Steps

1. Read the full architecture analysis at `STATESYNC_ARCHITECTURE_ANALYSIS.md`
2. Review coupling analysis at `STATESYNC_COUPLING_ANALYSIS.md`
3. Implement Phase 1 (create StateSync.js)
4. Write comprehensive unit tests
5. Proceed with integration phases
