# ClientBuilder Modularization Plan

## Current Structure (1,029 lines)
- `constructor()` - Setup
- `init()` - Initialization
- `checkLocalPlayer()` - ~420 lines (MASSIVE)
- `setMode()` - Mode management (~130 lines)
- `getEntityAtReticle/Pointer/Hit()` - Picking logic (~40 lines total)
- `onDragOver/Enter/Leave/Drop()` - Drag/drop handling (~80 lines total)
- `addApp/Model/Avatar()` - Entity creation (~150 lines total)
- `getSpawnTransform()` - Spawn point calculation (~30 lines)

## Extraction Strategy

### 1. **BuilderEntityCreator.js** (~200 lines)
Extract:
- `addApp()` - App creation from files (52 lines)
- `addModel()` - Model loading and placement (52 lines)
- `addAvatar()` - Avatar loading and placement (88 lines)
- `getSpawnTransform()` - Spawn point calculation (30 lines)

Result: Clear, focused entity creation module

### 2. **BuilderEntityPicker.js** (~50 lines)
Extract:
- `getEntityAtReticle()` - Center screen picking
- `getEntityAtPointer()` - Mouse position picking
- `getHitAtReticle()` - Physics raycast

Result: Reusable picking logic

### 3. **BuilderFileHandler.js** (~100 lines)
Extract:
- `onDragOver()` - Drag event handling
- `onDragEnter()` - Drag enter
- `onDragLeave()` - Drag leave
- `onDrop()` - File drop and import

Result: Clean file upload handling

### 4. **BuilderModeManager.js** (~150 lines)
Extract from `setMode()`:
- Mode state management
- Mode transition logic
- UI updates per mode
- Enable/disable interactions per mode

Result: Centralized mode handling

### 5. **ClientBuilder.js** (~400 lines)
Reduced to:
- `constructor()` - Setup and dependency injection
- `init()` - Initialize sub-modules
- `checkLocalPlayer()` - Orchestration of updates
- Delegate to sub-modules

## Expected Outcome
**ClientBuilder: 1,029 → ~400 lines (-61%)**
- EntityCreator: 200 lines
- ModeManager: 150 lines
- FileHandler: 100 lines
- EntityPicker: 50 lines
- ClientBuilder: 400 lines (orchestrator)

All modules independently testable and reusable.
