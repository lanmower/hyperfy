# Actionable Fixes: Specific Files & Locations

## Completed Fixes (Committed in 5dc2e90)

### ✅ 1. Gizmo Transform Sync Race Condition
- **File**: `src/core/systems/builder/TransformHandler.js`
- **Lines**: 44-79
- **Fix**: Added null checks before gizmo access
- **Status**: DONE ✅

### ✅ 2. ErrorMonitor Initialization Race
- **File**: `src/client/world-client.js`
- **Lines**: 40-51
- **Fix**: Moved setupDebugGlobals() before world.init()
- **Status**: DONE ✅

### ✅ 3. Duplicate GizmoManager Code
- **Files**: `src/core/systems/builder/BuilderComposer.js`, `SelectionManager.js`
- **Fix**: Removed dead GizmoManager, consolidated to GizmoController
- **Status**: DONE ✅

### ✅ 4. Script onLoad() Error Handling
- **File**: `src/core/entities/app/ScriptExecutor.js`
- **Lines**: 125-133
- **Fix**: Added return false to stop execution on onLoad error
- **Status**: DONE ✅

### ✅ 5. Avatar Position Sync Robustness
- **File**: `src/core/entities/PlayerLocal.js`
- **Lines**: 273-283
- **Fix**: Added explicit null checks and error handling
- **Status**: DONE ✅

---

## Next Critical Fixes Needed (Priority Order)

### 🔴 CRITICAL #1: Implement PlayerLocal.destroy()
- **File**: `src/core/entities/PlayerLocal.js`
- **Current State**: No destroy() method exists
- **What's Needed**:
  ```javascript
  destroy() {
    // 1. Unregister all event listeners (from init)
    this.world.controls?.unbind(this.control)
    // 2. Cancel pending animations
    if (this.effectTimeout) clearTimeout(this.effectTimeout)
    // 3. Remove from scene
    if (this.base) this.world.stage?.scene.remove(this.base)
    if (this.aura) this.world.stage?.scene.remove(this.aura)
    // 4. Call subsystem cleanup
    this.physics?.destroy()
    this.camera?.destroy()
    this.avatar?.destroy()
    // 5. Remove physics body
    if (this.physicsHandle) {
      this.world.physics?.removeActor(this.physicsHandle)
    }
  }
  ```
- **Effort**: 4-6 hours
- **Impact**: Prevents memory leaks on player disconnect

### 🔴 CRITICAL #2: Verify Scene Graph Cleanup
- **Files**:
  - `src/core/entities/App.js` - Check add/remove of nodes
  - `src/core/nodes/Group.js` - Check add/remove of children
  - `src/core/nodes/Mesh.js` - Check geometry/material disposal
  - `src/core/nodes/Node.js` - Check mount/unmount cleanup
- **What's Missing**:
  - [ ] Verify `geometry.dispose()` is called on remove
  - [ ] Verify `material.dispose()` is called on remove
  - [ ] Verify nodes are detached from parent before removal
  - [ ] Verify no orphaned nodes remain in scene
- **Search For**:
  ```javascript
  // Should exist:
  scene.remove(node)
  geometry.dispose()
  material.dispose()
  // Check if missing:
  grep -r "scene.remove" src/core/entities/
  grep -r "dispose()" src/core/nodes/
  ```
- **Effort**: 2-3 hours
- **Impact**: Prevents memory buildup from unreleased Three.js objects

### 🔴 CRITICAL #3: Fix Animation State Machine
- **Files**:
  - `src/core/entities/PlayerLocal.js` - mode property
  - `src/core/entities/player/AnimationController.js` - updateAnimationMode()
  - `src/core/constants/AnimationModes.js` - Modes enum
- **What's Missing**:
  - [ ] Verify `this.mode` is updated every frame
  - [ ] Verify AnimationController.updateAnimationMode() is called in update()
  - [ ] Verify mode values are consistent (0=idle, 1=walk, 2=run)
  - [ ] Add fallback if mode is undefined
- **Search For**:
  ```javascript
  // In AnimationController.update():
  updateAnimationMode() // Should be called every frame

  // Should exist in PlayerLocal.update():
  this.physics?.moving  // triggers walk/run
  ```
- **Effort**: 3-4 hours
- **Impact**: Prevents animation glitches and state corruption

### 🔴 CRITICAL #4: Fix Configuration Hardcoding
- **Main File**: `src/core/config/SystemConfig.js`
- **What To Verify**:
  - [ ] GRAVITY = 9.81 (used everywhere)
  - [ ] WALK_SPEED = 4.0 (check PlayerPhysicsState.js line 80)
  - [ ] RUN_SPEED = 7.0 (check PlayerPhysicsState.js line 80)
  - [ ] GROUND_DETECTION_RADIUS = 0.35 (check PlayerPhysics.js)
  - [ ] CAPSULE_HEIGHT = 1.8 (check PlayerLocal.js)
  - [ ] CAPSULE_RADIUS = 0.3 (check PlayerLocal.js)
  - [ ] MASS = 70 (check PlayerLocal.js)
  - [ ] JUMP_HEIGHT = 1.5 (check PlayerPhysicsState.js)
- **Search For Hardcoded Values**:
  ```bash
  grep -r "4\.0\|7\.0\|9\.81\|20\|0\.29\|0\.35\|0\.3\|1\.5\|1\.8\|70" \
    src/core/entities/player/ src/core/systems/physics/
  ```
- **Effort**: 2-3 hours
- **Impact**: Makes configuration actually work (environment variables can override)

### 🔴 CRITICAL #5: Test Network Mover State
- **Files**:
  - `src/core/systems/builder/StateTransitionHandler.js` - mover assignment
  - `src/core/systems/network/AppNetworkSync.js` - mover sync
  - `src/core/systems/builder/TransformHandler.js` - mover usage
- **Test Scenarios**:
  - [ ] Select model: verify mover = player.networkId
  - [ ] Deselect model: verify mover = null
  - [ ] Rapid select/deselect: verify no state corruption
  - [ ] Network lag during placement: verify final state correct
  - [ ] Multiple clients placing same location: verify conflict handling
- **Effort**: 4-6 hours (mostly testing)
- **Impact**: Prevents model ownership corruption

---

## High-Priority Fixes

### 🟠 HIGH #1: Implement Proper Error Boundaries
- **Files**: All systems that create entities
- **Pattern**: Wrap async operations in try-catch
- **Locations**:
  - `src/core/entities/app/BlueprintLoader.js` - Model loading
  - `src/core/entities/app/ScriptExecutor.js` - Already partially done
  - `src/core/systems/Entities.js` - Entity creation
- **Effort**: 3-4 hours
- **Impact**: Prevents cascading failures

### 🟠 HIGH #2: Handle WebSocket Disconnection
- **File**: `src/core/systems/network/WebSocketManager.js`
- **Needs**:
  - [ ] Reconnection with backoff
  - [ ] State sync on reconnect
  - [ ] Stale entity filtering
  - [ ] Late-join handling
- **Effort**: 5-7 hours
- **Impact**: Production reliability

### 🟠 HIGH #3: Add Input Validation Enforcement
- **Files**: AppAPIConfig.js, WorldAPIConfig.js (already have framework)
- **Missing**: Actually call validation in methods
- **Search For**: Methods without validation calls
- **Effort**: 2-3 hours
- **Impact**: Prevents silent failures

### 🟠 HIGH #4: Fix Memory Leaks
- **Areas to Check**:
  - [ ] Event listener cleanup in PlayerLocal
  - [ ] Circular reference cleanup in App
  - [ ] Three.js texture/material disposal
  - [ ] Physics body cleanup
- **Tools**: Chrome DevTools Memory tab
- **Effort**: 4-5 hours (includes profiling)
- **Impact**: Stability over long sessions

---

## Dead Code to Remove

### 🗑️ Delete These Files
1. `src/core/systems/builder/GizmoManager.js` - Replaced by GizmoController
2. Check for other unused imports and commented code

---

## Testing Checklist (After Fixes)

### Unit Tests
- [ ] PlayerLocal.destroy() properly cleans up
- [ ] Scene graph nodes are removed
- [ ] Configuration values are used
- [ ] Error handling stops execution
- [ ] Avatar position syncs correctly

### Integration Tests
- [ ] Player join → place model → disconnect → no leaks
- [ ] Model placement with network lag
- [ ] Rapid animations during movement
- [ ] Error in one script doesn't crash world
- [ ] Late join with 100+ entities

### Performance Tests
- [ ] Memory stable over 1 hour
- [ ] Frame time < 16.67ms (60fps)
- [ ] Physics simulation < 5ms
- [ ] No garbage collection spikes

---

## Effort Estimation

| Task | Duration | Priority |
|------|----------|----------|
| PlayerLocal.destroy() | 4-6h | CRITICAL |
| Scene graph cleanup | 2-3h | CRITICAL |
| Animation state machine | 3-4h | CRITICAL |
| Config hardcoding | 2-3h | CRITICAL |
| Network mover testing | 4-6h | CRITICAL |
| **CRITICAL TOTAL** | **15-22h** | **3-4 days** |
| Error boundaries | 3-4h | HIGH |
| WebSocket handling | 5-7h | HIGH |
| Input validation | 2-3h | HIGH |
| Memory leaks | 4-5h | HIGH |
| **HIGH TOTAL** | **14-19h** | **2-3 days** |
| Code cleanup | 1-2h | LOW |
| Testing | 1 week | MEDIUM |

**Total to production-ready: 3-4 weeks**

---

## How to Track Progress

1. Update todo list as items are completed
2. Create branch for each critical fix
3. Test after each fix
4. Commit with specific issue number
5. Update COMPREHENSIVE_TODO_LIST.md

---

## References

- COMPREHENSIVE_TODO_LIST.md - Full checklist
- CURRENT_STATUS_AND_FINDINGS.md - Status overview
- Previous fixes: Commit 5dc2e90

