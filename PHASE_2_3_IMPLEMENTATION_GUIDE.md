# Phase 2-3 Implementation Guide: Framework Patterns & File Modularization

## Current Status
- **Phase 1**: ✓ Complete (3,893 LOC removed)
- **Phase 2-3**: 50% started (ActionConfigs extracted, 45 LOC saved)
- **Total Progress**: 3,938 LOC removed (5.4% of codebase)

---

## Phase 2: Framework & Dynamic Patterns (1,500+ LOC savings)

### 2.1: Asset Handler Registry ✓ STARTED
**Status**: Framework created, integration pending
**File**: `src/core/systems/AssetHandlerRegistry.js` (created)

**Next Steps**:
1. Register all 9 asset types in ClientLoader.start():
```javascript
this.registry = new AssetHandlerRegistry()
this.registry.register('video', {
  parse: (url, file, key, ctx) => this.handleVideo(url),
  insert: (localUrl, url, file, key, ctx) => this.handleVideoInsert(localUrl)
})
// ... repeat for hdr, image, texture, model, emote, avatar, script, audio
```

2. Refactor load() and insert() methods to use registry
3. Remove individual handleX() methods (saves ~150 LOC)
4. Test: Load all asset types (video, model, avatar, emote, etc.)

**Risk**: Medium (delta_s 0.58) - Requires thorough asset loading tests

---

### 2.2: Property Schema System (700-800 LOC savings)
**Status**: Framework ready to build
**Planned File**: `src/core/schema/PropertySchemaRegistry.js`

**Implementation Pattern**:
```javascript
class PropertySchemaRegistry {
  register(nodeType, config) { /* ... */ }
  generate(nodeType, properties) { /* ... */ }
}

// Usage in node files:
const CONFIG = {
  presets: ['transform', 'visibility'],
  properties: {
    type: { default: 'box', validate: isGeometryType, triggers: ['rebuild'] },
    width: { default: 1, triggers: ['rebuild'], condition: n => n.type === 'box' }
  }
}
this.propertySchema = registry.generate('Mesh', CONFIG)
```

**Files to Modify** (by type):
- **Mesh nodes**: Mesh.js, Box.js, Sphere.js, etc.
- **Media nodes**: Audio.js, Video.js, Image.js
- **UI nodes**: UIView.js, UIText.js, UIImage.js
- **Particle nodes**: Emitter.js

**Reduction**: ~100-150 LOC per node file × 15+ files = 600-800 LOC savings

---

### 2.3: UI Property Handlers (170-220 LOC savings)
**Status**: Ready to implement
**Planned File**: `src/core/schema/YogaPropertyMapper.js`

**Key Insight**: Replace repetitive yoga property setters with mapper:
- Instead of: 20+ manual setters in UINodeBase
- Use: YogaPropertyMapper with declarative config

**Files to Modify**:
- UINodeBase.js (remove createYogaPropertyHandlers, use mapper)
- UIView.js, UIText.js, UIImage.js

---

### 2.4: System Initialization (50-100 LOC savings)
**Status**: Ready to implement
**File**: `src/core/systems/SystemRegistry.js` (enhance existing)

**Add**:
- Lazy loading for optional systems (CSM, XR, LiveKit)
- Auto-dependency resolution from static DEPS
- Topological sort for initialization order

---

## Phase 3: File Modularization (2,561 LOC reduction)

### 3.1: ClientBuilder.js (811 LOC reduction) ✓ PARTIALLY DONE
**Current**: 1111 LOC
**Target**: 300 LOC
**Completed**: ActionConfigs extracted (45 LOC)

**Remaining Extractions**:

#### 3.1a: ModeManager (85 LOC)
**Extract Methods**:
- getMode(), setMode()
- getSpaceLabel(), toggleSpace()
- getModeLabel()

**Location**: `src/core/systems/builder/ModeManager.js`

#### 3.1b: GizmoManager (180 LOC)
**Extract Methods**:
- attachGizmo(), detachGizmo()
- enableRotationSnap(), disableRotationSnap()
- isGizmoActive()

**Location**: `src/core/systems/builder/GizmoManager.js`

#### 3.1c: UndoManager (90 LOC)
**Extract Methods**:
- addUndo(), undo()
- Undo state management

**Location**: `src/core/systems/builder/UndoManager.js`

#### 3.1d: FileDropHandler (170 LOC)
**Extract Methods**:
- onDragOver(), onDragEnter(), onDragLeave(), onDrop()
- _extractFileFromDrop(), _getAsString()
- addApp(), addModel(), addAvatar()

**Location**: `src/core/systems/builder/FileDropHandler.js`

---

### 3.2: particles.js (638 LOC reduction)
**Current**: 888 LOC
**Target**: 250 LOC

**Extractions**:

#### 3.2a: Shape Modules (305 LOC → 7 files)
- `shapes/PointShape.js` (15L)
- `shapes/SphereShape.js` (25L)
- `shapes/HemisphereShape.js` (30L)
- `shapes/ConeShape.js` (35L)
- `shapes/BoxShape.js` (130L)
- `shapes/CircleShape.js` (30L)
- `shapes/RectangleShape.js` (40L)
- `shapes/index.js` (shape factory)

#### 3.2b: CurveInterpolators (55 LOC)
- createNumberCurve(), createColorCurve()

#### 3.2c: ValueStarters (110 LOC)
- createNumericStarter(), createColorStarter()

#### 3.2d: SpritesheetManager (45 LOC)
- UV calculation logic

---

### 3.3: ClientControls.js (428 LOC reduction)
**Current**: 728 LOC
**Target**: 300 LOC

**Extractions**:
- XRInputHandler (180 LOC) - gamepad input logic
- TouchHandler (85 LOC) - touch event handling
- ControlFactories (85 LOC) - control type creators

---

### 3.4: PlayerLocal.js (339 LOC reduction)
**Current**: 689 LOC
**Target**: 350 LOC

**Extractions**:
- PlayerInputProcessor (120 LOC)
- PlayerAvatarManager (60 LOC)
- PlayerChatBubble (45 LOC)
- PlayerNetworkSync (75 LOC)

---

### 3.5: ServerNetwork.js (345 LOC reduction)
**Current**: 595 LOC
**Target**: 250 LOC

**Extractions**:
- FileUploadHandler (80 LOC)
- PlayerConnectionManager (110 LOC)
- ErrorHandlingService (95 LOC)
- WorldSaveManager (75 LOC)

---

## Implementation Strategy

### Quick Wins (Low Risk)
1. ✓ ActionConfigs (done) - 45 LOC
2. **Extract constants/configs** from all files (est. 50-100 LOC)
3. **Split shape modules** from particles.js (est. 300 LOC) - mechanical, clear boundaries

### Medium Complexity (Medium Risk)
1. **Extract mode/gizmo managers** from ClientBuilder
2. **Extract input handlers** from ClientControls
3. **Extract avatar/chat logic** from PlayerLocal

### High Value, Higher Complexity (Higher Risk)
1. **Asset Handler Registry** - consolidate 9 handler methods
2. **Property Schema System** - 15+ node files
3. **UI Property Handlers** - yoga integration

---

## Testing Checklist

### After Each Extraction
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors on startup
- [ ] Hot reload works
- [ ] Specific feature still functional

### Critical Tests by Module
- **ClientBuilder**: Builder mode, gizmo controls, drag-drop
- **particles.js**: All particle types render correctly
- **ClientControls**: XR, touch, keyboard input work
- **PlayerLocal**: Player movement, avatar loading, chat
- **ServerNetwork**: Player connections, file uploads, world saving

---

## WFGY Progress Tracking

```javascript
// After Phase 1
const phase1 = {
  delta_s: 0.35,  // SAFE
  loc_removed: 3893,
  status: "COMPLETE"
}

// Current Phase 2-3 start
const phase2_3_start = {
  delta_s: 0.50,  // TRANSIT
  loc_removed: 3938,
  frameworks_created: 1,  // AssetHandlerRegistry
  frameworks_to_create: 3  // PropertySchema, YogaMapper, SystemMgr
}

// Expected Phase 2-3 complete
const phase2_3_complete = {
  delta_s: 0.42,  // TRANSIT
  loc_removed: 8500,  // 3938 + 4562 from phases 2-3
  modules_created: 22,
  status: "EXPECTED"
}
```

---

## File Dependency Graph

**Safe to Extract** (no circular deps):
- ActionConfigs ✓
- Mode/Gizmo logic from ClientBuilder
- Shape modules from particles.js
- Upload/Connection logic from ServerNetwork

**Requires Care** (some interdependencies):
- UndoManager (uses gizmo state)
- PlayerInputProcessor (uses physics state)
- Asset handlers (interdependent loaders)

---

## Recommendation for Continuation

**Option 1: Continue Systematically**
- Do 3.2 (particle shapes) next - mechanical, safe
- Then 3.1b,c,d (remaining ClientBuilder) - clear boundaries
- Then 2.1 (Asset registry) - higher complexity but high value

**Option 2: Focus on Quick Wins**
- Complete 3.1 (ClientBuilder) - see immediate 800+ LOC reduction
- Do 3.2 (particles) - another 600+ LOC
- Batch Phase 2 frameworks after major file reductions visible

**Option 3: Hybrid Approach**
- Finish current Phase 3 extractions (3.1, 3.2, 3.3, 3.4, 3.5)
- Creates 22 modules, saves 2,561 LOC
- Then circle back to Phase 2 frameworks
- Leaves codebase cleaner for framework integration

---

## Success Criteria for Completion

**Phase 2 Complete**:
- ✓ AssetHandlerRegistry consolidates all asset types
- ✓ PropertySchemaRegistry reduces node files by 600+ LOC
- ✓ YogaPropertyMapper simplifies UI nodes
- ✓ SystemRegistry with lazy loading and auto-deps
- ✓ All assets load correctly
- ✓ All properties update correctly

**Phase 3 Complete**:
- ✓ All large files modularized
- ✓ 22+ focused modules created
- ✓ 2,561 LOC reduction achieved
- ✓ All features still functional
- ✓ Code more maintainable and testable

**Total Achievement**:
- 8,500+ LOC removed (11% of codebase)
- 40+ modules created
- Foundation built for further 50% reduction
- Code ready for Phase 4 (feature reduction)
