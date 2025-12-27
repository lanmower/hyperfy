# Mover State Machine Analysis & Verification Report

## PART 1: Current Mover State Machine

### State Definition
- **mover = null**: Model is placed, unowned, can be selected by any player
- **mover = player.networkId**: Model is selected and being transformed by specific player
- Transitions: `null → networkId → null`

### Key Files Involved
1. `src/core/systems/builder/StateTransitionHandler.js` - Handles selection/deselection
2. `src/core/systems/builder/SelectionManager.js` - UI selection delegation
3. `src/core/systems/builder/TransformHandler.js` - Transform updates during edit
4. `src/core/entities/app/AppNetworkSync.js` - Network sync logic
5. `src/core/entities/app/AppPropertyHandlers.js` - Property update handlers
6. `src/core/systems/ClientBuilder.js` - Main builder system

---

## PART 2: Mover Assignment Locations

### Location 1: StateTransitionHandler.select() - SELECTION
**File**: `src/core/systems/builder/StateTransitionHandler.js` (lines 56-117)

```javascript
select(app) {
  if (this.parent.selected === app) return  // Prevent double-select

  // DESELECT PREVIOUS
  if (this.parent.selected && this.parent.selected !== app) {
    if (!this.parent.selected.dead && this.parent.selected.data.mover === this.parent.network.id) {
      const selected = this.parent.selected
      selected.data.mover = null  // ← SET MOVER TO NULL
      // ... send entityModified with mover: null
      selected.build()
    }
    this.parent.selected = null
  }

  // SELECT NEW
  if (app) {
    if (app.data.mover !== this.parent.network.id) {
      app.data.mover = this.parent.network.id  // ← SET MOVER TO NETWORK ID
      app.build()
      this.parent.network.send('entityModified', { id: app.data.id, mover: app.data.mover })
    }
    this.parent.selected = app
    // ... attach gizmo, etc
  }
}
```

**Flow**:
1. Check if selecting the same app → return (idempotent)
2. If deselecting previous: set `mover = null` before deselecting
3. If selecting new: set `mover = networkId` after deselecting previous
4. Call `app.build()` to trigger rebuild
5. Send network message

### Location 2: StateTransitionHandler.select() - DESELECTION via select(null)
**File**: `src/core/systems/builder/StateTransitionHandler.js` (lines 56-76)

When called with `select(null)`:
```javascript
if (this.parent.selected && this.parent.selected !== app) {  // app === null here
  if (!this.parent.selected.dead && this.parent.selected.data.mover === this.parent.network.id) {
    const selected = this.parent.selected
    selected.data.mover = null  // ← CLEARS MOVER
    // ... full entityModified with position, quaternion, scale, state
    this.parent.network.send('entityModified', {
      id: selected.data.id,
      mover: null,
      position: selected.data.position,
      quaternion: selected.data.quaternion,
      scale: selected.data.scale,
      state: selected.data.state,
    })
    selected.build()
  }
  this.parent.selected = null
}
```

### Location 3: TransformHandler.sendSelectedUpdates() - TRANSFORM UPDATES
**File**: `src/core/systems/builder/TransformHandler.js` (lines 92-106)

```javascript
sendSelectedUpdates(delta) {
  const app = this.clientBuilder.selected
  if (!app) return

  this.lastMoveSendTime += delta
  if (this.lastMoveSendTime > this.clientBuilder.networkRate) {
    this.clientBuilder.network.send('entityModified', {
      id: app.data.id,
      position: app.root.position.toArray(),
      quaternion: app.root.quaternion.toArray(),
      scale: app.root.scale.toArray(),
    })
    // ← NOTE: Does NOT send mover field during transforms
    this.lastMoveSendTime = 0
  }
}
```

**Critical Observation**: Transform updates do NOT send `mover` field. This is intentional - mover only changes on select/deselect.

### Location 4: AppPropertyHandlers - NETWORK RECEPTION
**File**: `src/core/entities/app/AppPropertyHandlers.js` (lines 19-21)

```javascript
mover: (value) => {
  p.data.mover = value  // ← Simple assignment on network update
  return true           // ← Triggers rebuild
}
```

When network receives `entityModified` with `mover` field, this handler:
1. Updates `p.data.mover`
2. Returns `true` to trigger `app.build()`

### Location 5: App.build() - STATE DETERMINATION
**File**: `src/core/entities/App.js` (lines 77-78)

```javascript
if (this.data.mover) this.mode = Modes.MOVING
if (this.data.uploader && this.data.uploader !== this.world.network.id) this.mode = Modes.LOADING
```

### Location 6: ClientBuilder.update() - GUARD CHECK
**File**: `src/core/systems/ClientBuilder.js` (lines 84-86)

```javascript
if (this.selected && this.selected?.data.mover !== this.network.id) {
  this.select(null)  // ← Auto-deselect if mover changed
}
```

---

## PART 3: Full Workflow Trace

### Happy Path: Select → Drag → Deselect

```
STEP 1: Player clicks on model (SelectionManager.handleSelection)
  → Calls: SelectionManager.select(app)
  → Calls: StateTransitionHandler.select(app)

STEP 2: StateTransitionHandler.select(app) executes
  ✓ Check: app.data.mover !== this.parent.network.id
  ✓ Set: app.data.mover = this.parent.network.id
  ✓ Call: app.build()  [updates mode to MOVING]
  ✓ Send: 'entityModified' { id, mover: networkId }
  ✓ Set: this.parent.selected = app
  ✓ Attach gizmo

STEP 3: Player drags gizmo (during update cycle)
  → TransformHandler.handleModeUpdates(delta, mode) updates position/quaternion
  → TransformHandler.sendSelectedUpdates(delta) every ~100ms
  ✓ Send: 'entityModified' { id, position, quaternion, scale }
  ✗ Does NOT send mover field (intentional - mover doesn't change)

STEP 4: Player releases mouse (clicks to place)
  → SelectionManager.handleSelection detects click
  → Calls: SelectionManager.select(null)
  → Calls: StateTransitionHandler.select(null)

STEP 5: StateTransitionHandler.select(null) executes
  ✓ Check: this.parent.selected exists
  ✓ Check: this.parent.selected.data.mover === this.parent.network.id
  ✓ Set: selected.data.mover = null
  ✓ Call: selected.build()  [updates mode back to ACTIVE]
  ✓ Send: 'entityModified' { id, mover: null, position, quaternion, scale, state }
  ✓ Set: this.parent.selected = null

STEP 6: Network message arrives at this client
  → AppPropertyHandlers.modify(data, networkSync)
  → mover handler sets: p.data.mover = value
  → Returns true → triggers p.build()
  → Mode updates based on new mover value
```

---

## PART 4: Identified Race Conditions

### Race Condition 1: Double-Selection Before Network ACK
**Scenario**:
1. Player clicks model A at time T0
2. SELECT sent: `{ id: A, mover: networkId }`
3. StateTransitionHandler.select(A) sets `A.data.mover = networkId` locally
4. Player clicks model B at time T0+10ms (before model A network ACK arrives)

**Current Code Analysis**:
```javascript
// In StateTransitionHandler.select(newApp)
if (this.parent.selected === app) return  // ← Idempotent check prevents re-select

// But then:
if (this.parent.selected && this.parent.selected !== app) {
  // Deselects previous
}
if (app) {
  if (app.data.mover !== this.parent.network.id) {  // ← GUARD: only sets if not already mover
    app.data.mover = this.parent.network.id
  }
}
```

**Status**: SAFE - Guard checks before setting mover

---

### Race Condition 2: Network Message During Transform
**Scenario**:
1. Player has model selected: `mover = networkId`
2. Another player sends deselect: `entityModified { id, mover: null }`
3. At same time, local player drags gizmo: `TransformHandler.sendSelectedUpdates()`

**Current Code Analysis**:
```javascript
// ClientBuilder.update() line 84-86
if (this.selected && this.selected?.data.mover !== this.network.id) {
  this.select(null)  // ← Auto-deselect if ownership lost
}

// This check happens BEFORE transforms are sent
// So deselect message will clear mover before next sendSelectedUpdates
```

**Status**: SAFE - Guard prevents sending updates for non-owned models

---

### Race Condition 3: Rapid Select/Deselect Spamming
**Scenario**:
1. Player rapidly clicks: select A, deselect, select A, deselect, etc.
2. Multiple 'entityModified' messages queued

**Current Code Analysis**:
```javascript
// StateTransitionHandler.select(app)
if (this.parent.selected === app) return  // ← Idempotent
```

**Status**: SAFE - Idempotent check prevents redundant operations

---

### Race Condition 4: Mover Cleared Before Final Transform Sent
**Scenario**:
1. Player holding click, dragging model
2. At exact moment of click release, network is sending transform update
3. Deselect message queued but hasn't processed yet

**Current Flow**:
```
Time T0:   TransformHandler sends position update (mover still owned)
Time T1:   SelectionManager detects click release
Time T2:   StateTransitionHandler.select(null) executes
           Sets mover = null, sends entityModified with mover: null
Time T3:   Other clients receive position update (mover is still set locally during lerp)
Time T4:   Other clients receive deselect message (mover = null)
```

**Status**: SAFE - Transform updates don't include mover, so receiving old transform with current ownership state is correct

---

### Race Condition 5: Incoming Mover Update While Selecting
**Scenario**:
1. Local player selects model: `this.selected = app`
2. Same time, another client sends: `entityModified { id: same_app, mover: other_networkId }`
3. App rebuild triggered before or after local selection complete?

**Current Code Analysis**:
```javascript
// StateTransitionHandler.select(app) line 96-100
if (app.data.mover !== this.parent.network.id) {
  app.data.mover = this.parent.network.id
  app.build()
  this.parent.network.send('entityModified', { id: app.data.id, mover: app.data.mover })
}
this.parent.selected = app  // ← Set AFTER mover updated

// Meanwhile, network update might arrive and:
// AppPropertyHandlers.mover sets p.data.mover = otherNetworkId
// Then calls p.build()
// This rebuilds WHILE StateTransitionHandler.select is still executing
```

**Potential Issue**: App.build() called twice in quick succession, possible state corruption.

**Status**: POTENTIAL RACE - Need synchronization

---

## PART 5: Test Scenarios

### Scenario 1: Basic Selection
```
Expected:
- Select model: mover = networkId
- Gizmo shows
- mode = MOVING

Verification:
- app.data.mover === networkId
- app.mode === 'moving'
- gizmo visible
```

### Scenario 2: Basic Deselection
```
Expected:
- Deselect: mover = null
- Gizmo hides
- mode = ACTIVE

Verification:
- app.data.mover === null
- app.mode === 'active'
- gizmo invisible
- Network send includes full state
```

### Scenario 3: Rapid Select/Deselect
```
Expected:
- Spam select/deselect: no state corruption
- Final state correct

Verification:
- No errors in console
- Final app.data.mover matches intended state
```

### Scenario 4: Network Lag (100ms)
```
Expected:
- Select locally completes
- Network message delayed 100ms
- Other clients still see correct ownership transition

Verification:
- Other clients' mover value matches after delay
```

### Scenario 5: Multiple Clients Simultaneous Select
```
Expected:
- Only first to send 'entityModified' wins
- Others auto-deselect when they receive conflicting update

Verification:
- Only one player's selected === app
- Others have selected === null
```

---

## PART 6: Fix Recommendations

### Issue Found: Race Condition #5 (Incoming Mover During Selection)

**Problem**:
When local StateTransitionHandler.select() is setting mover and calling build(), a network update with a different mover can arrive and call build() again, causing double-rebuild and potential state confusion.

**Proposed Fix**:
Add a guard in AppPropertyHandlers to prevent rebuilding if we're the mover (local selection in progress).

**Fix Location**: `src/core/entities/app/AppPropertyHandlers.js`

```javascript
mover: (value) => {
  // If we're selecting this model, ignore incoming mover updates
  // The local selection will complete first
  if (value === p.data.mover) return false  // No rebuild if unchanged

  p.data.mover = value
  return true  // Rebuild on actual change
}
```

---

## Summary

### Current State Machine Health: **MOSTLY SAFE**

**Safe Areas**:
- ✓ Idempotent select/deselect checks prevent double-operations
- ✓ Guard checks prevent setting mover when already owned
- ✓ Auto-deselect guard prevents transforms on non-owned models
- ✓ Transform updates don't send mover field (no redundancy)

**Improvements Needed**:
- ⚠ Add guard in mover property handler for unchanged state
- ⚠ Consider locking app state during select/deselect sequence
- ⚠ Add timestamp validation to prevent old updates overwriting new ones

**Recommended Actions**:
1. Implement mover handler guard for unchanged state
2. Test all 5 scenarios with network lag simulation
3. Add debug logging for mover state transitions
4. Monitor for double-build edge cases in production
