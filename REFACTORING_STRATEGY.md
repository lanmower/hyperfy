# Hyperfy Modularization & DRY Refactoring Strategy

## Overview
This document outlines a comprehensive refactoring initiative to reduce codebase size, improve modularity, increase dynamism, establish consistent frameworks, and eliminate duplication across the hyperfy codebase.

**Current Status:** ~82.7k LOC with 68% consolidation complete
**Target:** Reduce to ~70-75k LOC with 95%+ modularity
**Approach:** 10-phase implementation with zero backwards compatibility constraints

---

## Phase 1: Audit & Documentation
**Goal:** Identify all duplication patterns and create baseline metrics

### Tasks:
- [ ] Map all duplicate code patterns (Client/Server, repeating logic)
- [ ] Catalog all utility files and identify consolidation opportunities
- [ ] Create dependency graph for circular dependency detection
- [ ] Document all hardcoded values and magic strings
- [ ] Generate LOC distribution report before/after

---

## Phase 2: Modularize Monolithic Systems

### 2A. ClientBuilder (1,029 LOC → ~4 modules)
**Current Structure:** Single file with multiple concerns

**Target Structure:**
```
systems/ClientBuilder/
├── index.js          (70 LOC) - Exports & entry
├── BuilderCore.js    (300 LOC) - Main build logic
├── BuilderMesh.js    (250 LOC) - Mesh building
├── BuilderUI.js      (200 LOC) - UI rendering
└── BuilderCache.js   (150 LOC) - Caching layer
```

### 2B. ClientControls (756 LOC → ~3 modules)
**Current Structure:** Already has InputHandler & XRHandler submodules

**Target Structure:**
```
systems/ClientControls/
├── index.js              (60 LOC) - Main dispatcher
├── InputHandler.js       (300 LOC) - Keyboard/mouse
├── XRHandler.js          (250 LOC) - VR/AR controls
└── ControlMappings.js    (100 LOC) - Configurable key maps
```

### 2C. Physics (611 LOC → ~6 modules)
**Current Structure:** Monolithic

**Target Structure:**
```
systems/Physics/
├── index.js                (80 LOC) - System entry
├── PhysicsEngine.js        (150 LOC) - Core simulation
├── BodyFactory.js          (80 LOC) - RigidBody creation
├── ColliderFactory.js      (80 LOC) - Collider creation
├── JointFactory.js         (70 LOC) - Joint/constraint creation
└── PhysicsDebug.js         (100 LOC) - Debug visualization
```

**Expected Savings:** ~150-200 LOC through removal of duplicated factory logic

### 2D. ServerNetwork (now 352 LOC after Phase 10C)
**Target:** Split into handler modules

**Target Structure:**
```
systems/ServerNetwork/
├── index.js                (80 LOC) - System entry
├── ChatHandlers.js         (100 LOC) - Chat messages
├── EntityHandlers.js       (150 LOC) - Entity operations
└── AdminHandlers.js        (80 LOC) - Admin/moderation
```

---

## Phase 3: Reorganize Extras Directory

### Current Problem:
37 files in flat `src/core/extras/` directory, ~156k LOC of specialized but unorganized logic

### Target Structure:
```
src/core/
├── avatar/          (VRM, emote, player proxy)
│   ├── VRMFactory.js
│   ├── EmoteFactory.js
│   └── PlayerProxy.js
├── spatial/         (Octrees, mesh conversion)
│   ├── LooseOctree.js
│   ├── SnapOctree.js
│   └── GeometryConverter.js
├── math/            (Interpolation, enhanced math)
│   ├── LerpVector3.js
│   ├── LerpQuaternion.js
│   └── BufferedInterpolation.js
├── rendering/       (UI, post-processing, shaders)
│   ├── UIBuilder.js
│   ├── RoundRect.js
│   ├── YogaLayout.js
│   └── CurveRenderer.js
├── utils/           (Misc helpers, reorganized below)
│   ├── formatting.js
│   ├── download.js
│   └── rotation.js
└── assets/          (Presets, curves, templates)
    ├── presets.js
    ├── curves.js
    └── materialsPerp.js
```

---

## Phase 4: Unified Utility Module Structure

### Current Problem:
20+ scattered utility files with no semantic organization

### Target Structure:
```
src/core/utils/
├── index.js              (auto-exports all)
├── events/
│   ├── EventBus.js       (1.2k LOC)
│   └── ErrorEventBus.js  (4.3k LOC) - Merge with EventBus
├── validation/
│   ├── schema.js         (from createNodeSchema.js)
│   └── validate.js       (from validation.js)
├── serialization/
│   ├── packets.js        (unified packet format)
│   └── serialize.js      (from serialization.js)
├── caching/
│   ├── Cache.js
│   ├── ObjectPool.js
│   └── LRU.js
├── async/
│   ├── TaskQueue.js
│   └── BatchProcessor.js
├── collections/
│   ├── Collections.js
│   └── NodeConstants.js
└── helpers/
    ├── math.js           (Vector3Enhanced, etc.)
    └── misc.js           (formatBytes, downloadFile, etc.)
```

### Benefits:
- ✅ Single entry point: `import * as utils from '@/core/utils'`
- ✅ Clear semantic organization
- ✅ Easier to find and reuse utility functions
- ✅ Consolidated EventBus eliminates duplication

---

## Phase 5: Eliminate Hypersdk Duplication

### Current Problem:
Entity.js, App.js, Player.js duplicated in both:
- `src/core/entities/`
- `hypersdk/src/`

### Solution:
```javascript
// hypersdk/src/index.js (NEW)
export { default as Entity } from '../../../src/core/entities/Entity.js'
export { default as App } from '../../../src/core/entities/App.js'
export { default as Player } from '../../../src/core/entities/Player.js'
// ... re-export all 23+ systems and types
```

### Result:
- Single source of truth
- Eliminates ~200 LOC of duplication
- Easier to maintain - changes propagate automatically

---

## Phase 6: Dynamic Configuration System

### Current Problem:
Hardcoded values throughout codebase:
- Network message types (45+ handlers with string literals)
- Asset type dispatch (9 client, 5 server types)
- Command names & aliases
- Setting keys (audio, graphics preferences)

### Target Solution:

```javascript
// src/core/config/RegistryConfig.js
export const assetTypeRegistry = {
  client: {
    video: VideoLoader,
    hdr: HDRLoader,
    image: ImageLoader,
    // ...
  },
  server: {
    model: ModelProcessor,
    script: ScriptValidator,
    // ...
  }
}

export const commandRegistry = {
  '/admin': AdminCommand,
  '/name': NameCommand,
  '/spawn': SpawnCommand,
  // ...
}

export const messageHandlerRegistry = {
  server: {
    chatAdded: handleChatAdded,
    entityModified: handleEntityModified,
    // ...
  },
  client: {
    snapshot: handleSnapshot,
    chatAdded: handleChatAdded,
    // ...
  }
}

export const settingRegistry = {
  audio: {
    volume: { type: 'number', min: 0, max: 1 },
    spatialAudio: { type: 'boolean' },
  },
  graphics: {
    quality: { type: 'enum', values: ['low', 'medium', 'high'] },
    enablePostProcessing: { type: 'boolean' },
  }
}
```

### Benefits:
- ✅ Single source of truth for all registries
- ✅ Easy to add new assets, commands, handlers without touching dispatch logic
- ✅ Can be visualized/managed dynamically
- ✅ Removes ~300-400 LOC of hardcoded dispatch logic

---

## Phase 7: Metaprogramming Framework

### Problem:
Boilerplate repeated across systems, nodes, and services

### Solution: Create framework abstractions

#### 7A. Handler Registry Mixin
```javascript
// utils/mixins/HandlerRegistry.mixin.js
export const withHandlerRegistry = (Base) => class extends Base {
  constructor() {
    super()
    this.handlers = new Map()
    this.registerHandlers(this.getHandlerMap())
  }

  registerHandlers(map) {
    for (const [name, handler] of Object.entries(map)) {
      this.handlers.set(name, handler.bind(this))
    }
  }

  getHandlerMap() { return {} } // Override in subclass

  dispatchHandler(name, ...args) {
    return this.handlers.get(name)?.(...args)
  }
}
```

#### 7B. Schema Builder Helper
```javascript
// utils/SchemaBuilder.js
export class SchemaBuilder {
  static fromObject(obj) {
    return Object.entries(obj).reduce((schema, [key, value]) => {
      schema.properties[key] = this.inferType(value)
      return schema
    }, { properties: {} })
  }

  static withValidation(schema, validator) {
    return { ...schema, validate: validator }
  }
}
```

#### 7C. Factory Registry
```javascript
// utils/FactoryRegistry.js
export class FactoryRegistry {
  constructor() {
    this.factories = new Map()
  }

  register(type, factory) {
    this.factories.set(type, factory)
  }

  create(type, ...args) {
    const factory = this.factories.get(type)
    if (!factory) throw new Error(`No factory for type: ${type}`)
    return factory(...args)
  }

  has(type) {
    return this.factories.has(type)
  }
}
```

---

## Phase 8: Consolidate Patterns into Base Classes

### 8A. Enhanced BaseSystem
```javascript
// core/BaseSystem.js (extends from existing System.js)
export class BaseSystem extends System {
  // Lifecycle hooks (existing)
  init() {}
  preTick() {}
  preFixedUpdate() {}
  fixedUpdate() {}
  postFixedUpdate() {}
  preUpdate() {}
  update() {}
  postUpdate() {}
  lateUpdate() {}
  postLateUpdate() {}
  commit() {}
  destroy() {}

  // NEW: Declarative initialization
  getInitialState() { return {} }
  getDefaultConfig() { return {} }

  constructor(world, config = {}) {
    super(world)
    this.config = { ...this.getDefaultConfig(), ...config }
    this.state = this.getInitialState()
  }
}
```

### 8B. Create NodeBase Hierarchy
```
core/nodes/
├── NodeBase.js       (Ultimate parent - 50 LOC)
├── Node3D.js         (extends NodeBase - 80 LOC)
├── NodeUI.js         (extends NodeBase - 60 LOC)
├── NodeInteractive.js (extends NodeBase - 40 LOC)
└── [Specific implementations extend these]
```

### 8C. Loader Base Pattern (Already done in Phase 10C)
```javascript
// Consolidate all {Type}Loader.js files
export class BaseLoader extends System {
  getAssetTypeHandlers() { return {} } // Override
  getTypeHandlers() { return {} } // Override
}
```

---

## Phase 9: Documentation & Guidelines

### Create:
1. **MODULE_STRUCTURE.md** - How to add new systems, nodes, utilities
2. **PATTERNS.md** - Documented patterns: handlers, factories, schemas
3. **ARCHITECTURE.md** - High-level system interactions & data flow
4. **GUIDELINES.md** - DRY principles, naming conventions, code style

### Key Guidelines:
- All systems extend `BaseSystem` (not just `System`)
- All nodes inherit from appropriate `Node*` base class
- All dispatchers use `HandlerRegistry` mixin
- All registries go into `config/RegistryConfig.js`
- All utilities go into semantic `utils/` subdirectories
- No hardcoded magic strings outside of `config/`

---

## Phase 10: Commit & Push

### Final deliverables:
- [ ] All refactored code committed with clear message
- [ ] Updated CONSOLIDATION_PLAN.md with completion status
- [ ] New REFACTORING_STRATEGY.md (this file)
- [ ] Updated MODULE_STRUCTURE.md documentation
- [ ] All tests passing (if applicable)
- [ ] Pushed to `claude/refactor-modular-architecture-E5gum`

---

## Expected Outcomes

### Size Reductions:
| Component | Before | After | Saved |
|-----------|--------|-------|-------|
| Monolithic Systems | 2,396 | 1,900 | 496 |
| Duplicated Utilities | 8,200 | 4,500 | 3,700 |
| Hypersdk Duplication | 1,200 | 200 | 1,000 |
| Extras Organization | 156k | Same | (Clarity, not size) |
| **TOTAL** | 82.7k | **~74.7k** | **~8k LOC** |

### Quality Improvements:
✅ 95%+ modularity (vs 68% currently)
✅ Single source of truth for all registries
✅ Zero duplicated business logic
✅ Consistent framework patterns
✅ Reduced cognitive load for maintenance
✅ Easier to add new features (templates provided)

---

## Implementation Order
1. Phase 1: Audit & Documentation
2. Phase 4: Create utility structure (foundational)
3. Phase 5: Eliminate hypersdk duplication (easy win)
4. Phase 6: Dynamic configuration system (high impact)
5. Phase 3: Reorganize extras (structural)
6. Phase 2: Modularize systems (bulk of work)
7. Phase 7: Metaprogramming framework (enables 2)
8. Phase 8: Consolidate base classes (final cleanup)
9. Phase 9: Documentation
10. Phase 10: Commit & Push

**Estimated total LOC touched:** ~15,000-20,000
**Estimated files modified:** ~120-150
