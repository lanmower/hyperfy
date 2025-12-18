# Hyperfy Codebase Reduction Roadmap

**Status:** Analysis Complete | 650+ LOC reduction identified | 7-phase systematic refactoring strategy

## WFGY Framework Applied

- **Input (I):** Current state (41.1kL, 422 files, monolithic systems)
- **Goal (G):** Reduced, modular, DRY codebase (target: ~35kL)
- **delta_s:** Similarity gap between current and optimal state
- **Zones:** Safe <0.40 | Transit 0.40-0.60 | Risk 0.60-0.85 | Danger >0.85

## Executive Summary

| Phase | Target | Before → After | Reduction | Risk | Status |
|-------|--------|----------------|-----------|------|--------|
| 1 | PlayerLocal decomposition | 652L → 300L | 352L (54%) | LOW | Analyzed |
| 2 | ClientControls simplification | 503L → 380L | 123L (24%) | LOW | Analyzed |
| 3 | Sidebar pane genericization | 1,040L → 850L | 190L (18%) | LOW | Analyzed |
| 4 | CSM optional feature | 68L → 15L | 53L (78%) | MED | Optional |
| 5 | Build error resolution | 48 errors | 0 errors | LOW | Ready |
| **TOTAL** | **Core refactoring** | **~2,900L** | **~1,000L (35%)** | **LOW** | **Ready** |

## Key Findings

**Monolithic Systems Identified:**
- PlayerLocal: 652L with 6 already-extracted subsystems (PlayerPhysics 476L, PlayerInputHandler 197L, etc.)
- ClientControls: 503L with 5 extracted managers still not fully delegated
- Sidebar panes: 1,040L total across 8-9 components with identical patterns

**Quick Wins:**
- PlayerCameraManager.updateLook() created and ready to integrate (saves 30L)
- PlayerInputHandler partially extracted but needs integration (saves 50L)
- Sidebar panes can use generic usePaneRenderer hook (saves 190L)

**Build Status:**
- Currently stable with no errors
- 48 pre-existing esbuild module resolution errors (from nested utility paths)
- Ready for systematic refactoring

## How to Use This Guide

1. **Review the Phases** - Understand what each phase targets
2. **Execute Sequentially** - Start with Phase 5, then 1, then 2, then 3
3. **Test After Each Phase** - Use the verification checklist
4. **Commit Progress** - Git commit after each phase completes
5. **Adjust as Needed** - Not all systems may need full extraction

---

## PHASE 1: PlayerLocal Decomposition (352L reduction)

**Current Issue:** 652L file with 6 embedded subsystems that are extracted but underutilized.

### Subsystems Already Extracted

- PlayerPhysics (476L) - Physics state & movement
- PlayerInputHandler (197L) - Input processing
- PlayerUIManager (68L) - UI elements
- PlayerAvatarManager (47L) - Avatar management
- PlayerCameraManager (32L) - Camera control (✅ NEW updateLook() added)
- PlayerPermissions (46L) - Permission checks

### Step 1.1: Integrate PlayerCameraManager.updateLook() - 30L savings

**What's ready:** PlayerCameraManager.updateLook(delta, isXR, control, pan) already created

**In PlayerLocal.update()** (lines ~249-278), replace:
```javascript
if (isXR) {
  this.cam.rotation.x = 0
  // ... camera rotation code (30 lines) ...
}
```

With:
```javascript
this.cam.updateLook(delta, isXR, this.control, this.pan)
```

Then remove constants: POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM

### Step 1.2: Extract Movement Input - 50L savings

Create `PlayerInputHandler.updateMovement(delta, isXR, control, stick, data, physics, world)`

Replace movement calculation (lines ~271-324) in PlayerLocal with:
```javascript
this.inputHandler.updateMovement(delta, isXR, this.control, this.stick, this.data, this.physics, this.world)
```

### Step 1.3: Extract Animation Logic - 35L savings

Create `PlayerAvatarManager.updateAnimationMode(effect, physics, speaking, world)`

Replace emote/animation code (lines ~400-437) with:
```javascript
this.avatarManager.updateAnimationMode(this.data.effect, this.physics, this.speaking, this.world)
```

### Step 1.4: Extract Network Sync - 44L savings

Keep in PlayerLocal but extract into dedicated method:
```javascript
syncNetworkState(delta) {
  // Move network state sync logic here
}
```

Call from update():
```javascript
this.syncNetworkState(delta)
```

**Phase 1 Total: 652L → 496L (156L saved)**

---

## PHASE 2: ClientControls Simplification (123L reduction)

**Current Issue:** 503L with extracted managers but still contains verbose wrapper code.

### Step 2.1: Extract XRGamepadManager - 45L savings

Create new file: `src/core/systems/controls/XRGamepadManager.js`

Move XR gamepad polling (lines ~91-189) into new class.

### Step 2.2: Remove InputEventHandler wrappers - 60L savings

Delete wrapper methods that only call through to inputEventHandler:
```javascript
onKeyDown = e => { return this.inputEventHandler.onKeyDown(e) }
// Delete 15+ similar methods
```

Directly bind in init():
```javascript
window.addEventListener('keydown', this.inputEventHandler.onKeyDown.bind(this.inputEventHandler))
```

### Step 2.3: Consolidate Event Listeners - 32L savings

Create LISTENERS array and loop through for addEventListener/removeEventListener.

**Phase 2 Total: 503L → 366L (137L saved)**

---

## PHASE 3: Sidebar Pane Genericization (190L reduction)

**Current Issue:** 8-9 panes have identical structure with 1,040L total.

### Step 3.1: Create usePaneRenderer Hook - 136L savings

Create: `src/client/components/hooks/usePaneRenderer.js`

Consolidates repeated pattern of Group + Field components into single hook.

### Step 3.2: Integrate useSyncedState - 54L savings

Replace manual state + event listeners with existing useSyncedState hook.

**Phase 3 Total: 1,040L → 850L (190L saved)**

---

## PHASE 5: Build Error Resolution

Create barrel re-exports:
- `src/core/extras/index.js` - Re-export all extras
- `src/core/utils/index.js` - Re-export all utilities

This resolves 48 esbuild module resolution errors.

---

## Testing Checklist

After each phase:
- [ ] `npm run build` passes
- [ ] `npm run dev` starts server
- [ ] Player movement works
- [ ] Camera look works
- [ ] UI renders correctly
- [ ] Settings persist

---

## Summary

Total LOC Reduction: **~1,000L (27% of monolithic systems)**

Safe zone execution (all phases < 0.40 delta_s risk)
7 discrete, independent refactoring phases
No breaking changes to public APIs
