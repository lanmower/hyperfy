# StateSync Abstraction Layer - Complete Design Package

## Overview

This package contains a comprehensive design for a **StateSync abstraction layer** that consolidates state synchronization logic currently split between `ServerNetwork` and `Entities` systems.

## Problem Statement

State synchronization in Hyperfy is currently fragmented across multiple systems:

```
┌────────────────────────────────────────┐
│ Problem: Tight Coupling                │
├────────────────────────────────────────┤
│                                        │
│  BaseEntity ←→ ServerNetwork           │
│     ↓              ↓                   │
│  markDirty()  broadcastDelta()        │
│     ↓              ↓                   │
│  Entities ←→ ClientNetwork             │
│     ↓              ↓                   │
│  deserialize()  onSnapshot()           │
│                                        │
│  Result: Circular dependencies,        │
│  duplicate logic, hard to test         │
│                                        │
└────────────────────────────────────────┘
```

## Solution: StateSync

A single abstraction layer that:

```
┌────────────────────────────────────────┐
│ Solution: Decoupled via StateSync      │
├────────────────────────────────────────┤
│                                        │
│  BaseEntity                            │
│     ↓                                  │
│  markDirty()                           │
│     ↓                                  │
│  ┌──────────────────────────┐          │
│  │    StateSync             │          │
│  │                          │          │
│  │  - onEntityCreated()     │          │
│  │  - onEntityUpdated()     │          │
│  │  - onEntityDestroyed()   │          │
│  │                          │          │
│  │  - onRemoteSnapshot()    │          │
│  │  - onRemoteUpdate()      │          │
│  │                          │          │
│  │  - pendingChanges        │          │
│  │  - remoteState cache     │          │
│  │  - flush()               │          │
│  └───────────┬──────────────┘          │
│              ↓                         │
│         ServerNetwork                  │
│         (send/broadcast)               │
│                                        │
│  Result: Clear responsibility,         │
│  easy to test, single sync logic       │
│                                        │
└────────────────────────────────────────┘
```

## Documentation Files

### 1. **STATESYNC_DESIGN_SUMMARY.md**
**Read this first!** High-level overview covering:
- Current architecture issues
- StateSync public API
- Integration strategy (5 phases)
- Benefits and success criteria

**Best for**: Understanding what StateSync does and why

---

### 2. **STATESYNC_ARCHITECTURE_ANALYSIS.md**
**Detailed technical analysis** covering:
- Complete current implementation breakdown
- Data flow architecture (client init, entity creation/modification/destruction)
- All coupling issues identified (6 major issues)
- StateSync design and integration points
- Risk mitigation strategies

**Best for**: Deep technical understanding of current system and proposed solution

---

### 3. **STATESYNC_COUPLING_ANALYSIS.md**
**Visual coupling breakdown** with before/after code:
- Bidirectional entity-network notifications
- Dirty tracking fragmentation
- Snapshot vs delta path inconsistency
- Validation inconsistency
- Missing error recovery
- How StateSync fixes each issue

**Best for**: Understanding specific coupling problems and their solutions

---

### 4. **STATESYNC_IMPLEMENTATION_GUIDE.md**
**Practical implementation reference** covering:
- Complete StateSync.js code structure
- Public API methods with full documentation
- Internal implementation patterns
- Integration checklist for all 5 phases
- Unit test examples
- Troubleshooting guide

**Best for**: Actually implementing StateSync

---

## Quick Start

### Understanding the Design
1. Read **STATESYNC_DESIGN_SUMMARY.md** (10 minutes)
2. Skim **STATESYNC_ARCHITECTURE_ANALYSIS.md** sections 1-3 (10 minutes)
3. Review **STATESYNC_COUPLING_ANALYSIS.md** Issue #1 (5 minutes)

### Implementing StateSync
1. Follow **STATESYNC_IMPLEMENTATION_GUIDE.md** Phase 1
2. Create `src/core/systems/StateSync.js`
3. Register in World initialization
4. Write unit tests

### Integration
1. Follow phases 2-5 from **STATESYNC_IMPLEMENTATION_GUIDE.md**
2. Update Entities → StateSync
3. Update ClientNetwork → StateSync
4. Update ServerNetwork → StateSync
5. Cleanup and remove old coupling

## Key Concepts

### Current State Structure
```javascript
// State is stored in Entities.items Map
entities.items = new Map([
  ['entity-id', {data: {...}, serialize(), modify(), ...}]
])

// Changes tracked via dirty sets in ServerNetwork
serverNetwork.dirtyApps = new Set(['entity-id-1', 'entity-id-2'])
serverNetwork.dirtyBlueprints = new Set([...])

// Changes computed on-demand by DeltaCodec
const delta = DeltaCodec.encode(current, previous)
```

### StateSync State Structure
```javascript
// Pending changes tracked in one place
stateSync.pendingChanges = new Map([
  ['entity-id', {
    type: 'create' | 'update' | 'destroy',
    entityId: 'entity-id',
    entityData?: {...},      // For create
    changes?: {...},         // For update
    timestamp: number
  }]
])

// Remote state cached for consistency
stateSync.remoteState = new Map([
  ['entity-id', {
    lastSyncTime: number,
    lastData: {...}          // What we know server has
  }]
])
```

## Architecture Changes

### Current Message Flow
```
Entity.markDirty()
  ↓
ServerNetwork.markDirty(id)
  ↓
ServerNetwork dirty set updated
  ↓
[Some time later, interval-based]
  ↓
ServerNetwork flushes dirty set
  ↓
DeltaCodec computes delta
  ↓
Sends broadcast to clients
  ↓
ClientNetwork receives
  ↓
ClientPacketHandlers routes
  ↓
Entities.add() or entity.modify()
```

### New Message Flow with StateSync
```
Entity.markDirty()
  ↓
StateSync.onEntityUpdated(entity, changes)
  ↓
StateSync.pendingChanges updated
  ↓
StateSync schedules flush (50ms batch window)
  ↓
[After 50ms or on immediate flush]
  ↓
StateSync.flush()
  ↓
ServerNetwork.send/broadcast changes
  ↓
ClientNetwork receives
  ↓
StateSync.onRemoteUpdate(update)
  ↓
StateSync validates and applies
  ↓
Entities updated via stateSync.applyEntity*()
```

## Integration Points

### Entities System
- **Receives**: Entity creation/modification/destruction events
- **Sends**: Queues changes for network transmission
- **Timing**: Immediate queuing, batched flushing every 50ms

### ServerNetwork
- **Receives**: Pending changes from StateSync.flush()
- **Sends**: Broadcasts to all clients
- **No longer**: Tracks dirty sets, computes deltas

### ClientNetwork
- **Receives**: Snapshots and deltas from server
- **Sends**: To StateSync for application
- **No longer**: Routes directly to entity methods

## Testing Approach

### Unit Tests
- StateSync in isolation (no entities/network)
- Mock entity and network interactions
- Test change queuing, validation, flushing

### Integration Tests
- Full round-trip: local change → broadcast → received → applied
- Snapshot reception and entity population
- Delta merging and change batching
- Error handling and validation

### System Tests
- Run existing tests after refactoring
- Verify network protocol unchanged
- Check message timing (batching behavior)
- Monitor performance impact

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Code Maintainability | Improved clarity | Easier to onboard developers |
| Test Coverage | 90%+ for StateSync | Unit test suite completeness |
| Coupling Reduction | Entities/Network independent | Can test without mocking both |
| Error Recovery | Inconsistency detection | Manual tests show divergence recovery |
| Performance | <5% impact | Profile before/after |

## Potential Issues & Solutions

### Issue 1: Performance Regression
**Risk**: Batching delay causes slower updates
**Solution**: Monitor flush timing, adjust flushIntervalMs if needed

### Issue 2: Message Format Changes
**Risk**: Protocol changes break compatibility
**Solution**: Design StateSync to be protocol-agnostic, adapt existing format

### Issue 3: Circular Dependencies Persist
**Risk**: Old coupling code still exists alongside new StateSync
**Solution**: Deprecate old paths gradually, use feature flags if needed

### Issue 4: State Divergence Not Detected
**Risk**: Client/server diverge without error
**Solution**: Use remoteState cache for consistency checks, add heartbeat validation

### Issue 5: Lost Changes on Disconnect
**Risk**: Pending changes lost if connection drops
**Solution**: Persist pendingChanges to localStorage, replay on reconnect

## Files to Create/Modify

### Phase 1 (Create StateSync)
- **Create**: `src/core/systems/StateSync.js` (≈300-400 LOC)
- **Modify**: World initialization to register StateSync

### Phase 2 (Integrate with Entities)
- **Modify**: `src/core/systems/entities/EntitySpawner.js`
- **Modify**: `src/core/systems/entities/EntityLifecycle.js`
- **Modify**: `src/core/entities/BaseEntity.js`

### Phase 3 (Integrate with ClientNetwork)
- **Modify**: `src/core/systems/ClientNetwork.js`
- **Modify**: `src/core/systems/network/ClientPacketHandlers.js`

### Phase 4 (Integrate with ServerNetwork)
- **Modify**: `src/core/systems/ServerNetwork.js`
- **Modify**: Message handler routing

### Phase 5 (Cleanup)
- **Remove**: Direct network.markDirty() calls
- **Remove**: Circular entity-network notifications
- **Clean**: Stale event emission paths

## Dependencies

StateSync requires:
- `world.serverNetwork` - For send/broadcast
- `world.entities` - For entity storage and modification
- `world.events` - For event emission (optional)

No new npm packages required.

## Timeline

| Phase | Effort | Duration | Risk |
|-------|--------|----------|------|
| **1: Create StateSync** | 2-3 hours | 1 day | Low |
| **2: Entities Integration** | 3-4 hours | 1-2 days | Low-Medium |
| **3: ClientNetwork Integration** | 4-5 hours | 1-2 days | Medium |
| **4: ServerNetwork Integration** | 4-5 hours | 1-2 days | Medium |
| **5: Cleanup** | 2-3 hours | 1 day | Medium |
| **Total** | ~16-20 hours | 5-7 days | **Medium-High** |

## Key Takeaways

1. **StateSync is a coordinator, not a replacement**
   - Doesn't replace Entities, ServerNetwork, or ClientNetwork
   - Sits between them to decouple and coordinate

2. **Clear responsibility boundaries**
   - Entities: Store and manage entities
   - StateSync: Coordinate state changes
   - Network: Send/receive messages
   - Each has distinct role

3. **Testability improves dramatically**
   - StateSync testable in isolation
   - Mock network and entities for testing
   - Easy to add new entity types

4. **Protocol unchanged**
   - Uses existing snapshot/delta formats
   - No breaking changes to message structure
   - Backward compatible

5. **Gradual integration possible**
   - Can implement in phases
   - Old and new paths can coexist
   - Deprecate gradually

## Next Steps

1. **Review Phase**: Read all documentation
2. **Discussion Phase**: Share findings, get team feedback
3. **Approval Phase**: Confirm StateSync design
4. **Implementation Phase**: Build Phase 1 (StateSync.js)
5. **Testing Phase**: Comprehensive unit/integration tests
6. **Integration Phase**: Follow phases 2-5 systematically

## Questions to Consider

- [ ] Does StateSync align with architectural goals?
- [ ] Are there any protocol requirements we missed?
- [ ] Should pending changes be persisted across disconnects?
- [ ] How should we handle concurrent modifications?
- [ ] What's the right flush interval (currently 50ms)?
- [ ] Should we add conflict resolution logic?
- [ ] How do we handle offline mode?
- [ ] What validation rules are needed?

## Contact

For questions about this design, refer to:
- **Architecture Questions**: See STATESYNC_ARCHITECTURE_ANALYSIS.md
- **Coupling Details**: See STATESYNC_COUPLING_ANALYSIS.md
- **Implementation Details**: See STATESYNC_IMPLEMENTATION_GUIDE.md

---

## Document Map

```
STATESYNC_README.md (you are here)
├─ Quick summary
├─ Document guide
└─ Links to detailed docs

STATESYNC_DESIGN_SUMMARY.md
├─ High-level overview
├─ Current issues
├─ StateSync API
├─ Integration phases
└─ Benefits

STATESYNC_ARCHITECTURE_ANALYSIS.md
├─ Current implementation breakdown
├─ Data flow (5 scenarios)
├─ Components analysis
├─ Serialization formats
├─ Coupling issues (6 total)
├─ StateSync design details
└─ Implementation roadmap

STATESYNC_COUPLING_ANALYSIS.md
├─ Current coupling diagram
├─ Issue #1: Bidirectional notifications
├─ Issue #2: Dirty tracking spread
├─ Issue #3: Snapshot vs delta paths
├─ Issue #4: Validation inconsistency
├─ Issue #5: Missing error recovery
└─ Summary table

STATESYNC_IMPLEMENTATION_GUIDE.md
├─ Complete StateSync.js code
├─ Public API with full docs
├─ Internal implementation patterns
├─ Integration checklist
├─ Unit test examples
└─ Troubleshooting
```

---

## Glossary

| Term | Definition |
|------|-----------|
| **State** | Entity data (position, quaternion, blueprint, etc.) |
| **Dirty** | Entity has unsaved changes |
| **Flush** | Send pending changes to network |
| **Delta** | Incremental change (only changed properties) |
| **Snapshot** | Full state of all entities |
| **Sync** | Synchronize state between client/server |
| **Pending** | Queued for transmission, not yet sent |
| **Consistency** | Client/server have same state |
| **Divergence** | Client/server have different state for same entity |

---

## Version

- **Design Version**: 1.0
- **Date**: 2025-12-28
- **Status**: Design Complete (Ready for Phase 1 Implementation)
- **Target**: Hyperfy Core System

