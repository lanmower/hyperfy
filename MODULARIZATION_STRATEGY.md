# Hyperfy Advanced Modularization Strategy

**Date:** December 16, 2025
**Objective:** Transform from 60% consolidated to fully modular, dynamic, and DRY architecture
**Target:** < 25k LOC with zero code duplication, framework-based architecture

---

## Level 0: Current State Assessment (60% Consolidation)

### What's Working Well
✅ **Handler Registry Pattern** - Unified dispatch across 45+ handlers
✅ **SchemaBuilder Pattern** - Node property consolidation (82-98% reduction)
✅ **System Lifecycle** - Consistent setup/update/cleanup pattern
✅ **Centralized Config** - GameConstants + Config unified
✅ **Modularized Systems** - ClientBuilder, ClientControls now 4-module structure

### Key Gaps (40% Remaining)
- ⚠️ Client/Server system duplication (6+ pairs)
- ⚠️ Monolithic Physics.js (611L)
- ⚠️ 37 loose files in /extras directory
- ⚠️ Hypersdk duplicate definitions (150-200 LOC)
- ⚠️ 20 utility files with overlapping responsibilities
- ⚠️ No framework for system lifecycle metadata
- ⚠️ No declarative system registration

---

## Level 1: Advanced Consolidation Phases

### Phase 8: SDK Integration (QUICK WIN)
**Files to consolidate:** hypersdk/src → src/core/
**Savings:** ~200-300 LOC

```
hypersdk/src/
├── Entity.js            → src/core/entities/
├── App.js              → src/core/entities/
├── Player.js           → src/core/entities/
├── Packets.js          → src/core/network/
└── other duplicates

SDK becomes:
hypersdk/src/index.js
  ├── Re-export from src/core/entities/
  ├── Re-export from src/core/network/
  ├── Re-export from src/core/systems/
  └── Re-export from src/core/systems/
```

**Process:**
1. Move canonical definitions to src/core/
2. Update SDK index.js to import and re-export
3. Remove all duplicate files from hypersdk/

---

### Phase 8B: Dead Code Removal
**Expected savings:** 200-300 LOC

**Actions:**
1. Audit all utility files for unused exports
2. Remove orphaned helper functions
3. Consolidate overlapping utilities (EventBus vs ErrorEventBus)
4. Delete deprecated pre-consolidation helpers

---

### Phase 9C: Physics System Modularization
**Current:** Physics.js (611L)
**Target:** 150-180L main + 4 specialized modules

```
Physics/ (Framework)
├── index.js (80L)           - Orchestrator, lifecycle
├── PhysicsEngine.js (120L)  - Core simulation, stepping
├── BodyFactory.js (90L)     - RigidBody creation, defaults
├── ColliderFactory.js (70L) - Collider setup patterns
├── JointFactory.js (60L)    - Joint types and constraints
└── PhysicsDebug.js (60L)    - Visualization & debugging
```

---

### Phase 10C: Client/Server System Consolidation
**Current:** 6 parallel systems with duplicate logic
**Target:** Unified base classes with platform-specific overrides

```
NetworkBase/
├── BaseNetwork.js           - Common protocol, handlers
├── ClientNetwork.js         - Client-specific dispatch
└── ServerNetwork.js         - Server-specific dispatch

LoaderBase/
├── BaseLoader.js            - Common registry, types
├── ClientLoader.js          - Asset insertion logic
└── ServerLoader.js          - Asset storage logic

EnvironmentBase/
├── BaseEnvironment.js       - Common lifecycle
├── ClientEnvironment.js     - Rendering setup
└── ServerEnvironment.js     - Physics setup
```

**Savings:** 300-400 LOC

---

### Phase 11: Utility Consolidation
**Current:** 20 scattered utility files
**Target:** 8-10 semantic modules

```
src/core/utils/
├── events/              - EventBus, ErrorEventBus merged
├── validation/          - Combined validation strategies
├── serialization/       - msgpackr + JSON unified
├── caching/            - Cache patterns
├── async/              - Async helpers
├── math/               - Math utilities
└── dom/                - DOM utilities (client-side only)
```

**New Structure:**
```javascript
// Before (scattered)
import EventBus from '@core/utils/EventBus'
import ErrorEventBus from '@core/utils/ErrorEventBus'
import { validateSchema } from '@core/utils/validation'
import { validateEntity } from '@core/utils/entityValidation'

// After (semantic)
import { EventBus, ErrorEventBus } from '@core/utils/events'
import { validate } from '@core/utils/validation'
import { serialize } from '@core/utils/serialization'
```

---

### Phase 12: Extras Directory Reorganization
**Current:** 37 loose files in `/extras/`
**Target:** Organized by domain

```
src/core/extras/
├── avatars/            - VRM, avatar-specific
│   ├── VRMFactory.js
│   ├── EmoteFactory.js
│   └── PlayerProxyFactory.js
├── controls/          - Control-related helpers
│   └── ControlPriorities.js
├── rendering/         - Render helpers
│   ├── ShaderUtils.js
│   └── RenderState.js
├── gameplay/          - Game logic
│   ├── LiveKitManager.js
│   └── AppManager.js
└── helpers/           - Miscellaneous
    └── ...
```

---

### Phase 13: Dynamic System Registry with Metadata
**Problem:** System instantiation requires manual setup, can't introspect capabilities
**Solution:** Declarative system metadata

```javascript
// New system pattern with metadata
export const ClientNetworkMeta = {
  name: 'ClientNetwork',
  type: 'client-core',
  dependencies: ['DynamicWorld'],
  handlers: ['snapshot', 'chatAdded', 'entityAdded', /* ... */],
  priority: 100,
}

export class ClientNetwork extends BaseNetwork {
  static meta = ClientNetworkMeta

  setup() { /* ... */ }
  update(dt) { /* ... */ }
  cleanup() { /* ... */ }
}

// Registry that auto-discovers and instantiates
const SystemRegistry = {
  register(SystemClass) {
    this.systems[SystemClass.meta.name] = SystemClass
  },

  instantiate(world) {
    // Auto-resolves dependencies, calls setup() in order
    const instances = {}
    for (const System of this.topologicalSort()) {
      instances[System.meta.name] = new System(world)
    }
    return instances
  }
}
```

**Benefits:**
- Auto-dependency resolution
- Cleaner world factories
- Better observability
- Easier to test
- Framework-like behavior

---

## Level 2: Framework Architecture

### New: Declarative Configuration-Driven Systems

**Problem:** Many systems have similar patterns but differ by configuration
**Solution:** Configuration objects instead of class inheritance

```javascript
// Before: Multiple system classes with small differences
class ClientUISystem extends BaseUISystem { /* ... */ }
class ClientGraphicsSystem extends BaseGraphicsSystem { /* ... */ }
class ClientAudioSystem extends BaseAudioSystem { /* ... */ }

// After: Configuration-driven systems
const ClientSystems = [
  { name: 'UI', handlers: [...], prefs: {...}, priority: 50 },
  { name: 'Graphics', handlers: [...], settings: {...}, priority: 40 },
  { name: 'Audio', handlers: [...], volume: {...}, priority: 30 },
]

// DynamicSystemFactory creates from config
const systems = ClientSystems.map(cfg =>
  createSystem(cfg.name, cfg)
)
```

**Benefits:**
- 30-40% less code duplication
- Easy to modify behavior without code changes
- Better for rapid iteration
- Plugin-like extensibility

---

### New: Handler Declarative Pattern

**Problem:** Handlers scattered across methods, hard to audit
**Solution:** Declarative handler tables

```javascript
// Before: Scattered across multiple methods
onMessage(msg) {
  switch(msg.type) {
    case 'snapshot': this.onSnapshot(msg); break
    case 'chat': this.onChat(msg); break
    // ... 20+ cases
  }
}

// After: Declarative tables (already doing this!)
setupHandlerRegistry() {
  this.handlers = {
    'snapshot': this.onSnapshot.bind(this),
    'chat': this.onChat.bind(this),
    // ... 20+ handlers
  }
}

// Can become metadata-driven
static meta = {
  handlers: [
    { type: 'snapshot', handler: 'onSnapshot', critical: true },
    { type: 'chat', handler: 'onChat', critical: false },
    // ...
  ]
}

// Auto-binds from metadata
setupHandlers() {
  this.handlers = {}
  for (const { type, handler } of this.constructor.meta.handlers) {
    this.handlers[type] = this[handler].bind(this)
  }
}
```

---

### New: Modular Node Type System

**Problem:** Each node type has 50-600L of property definitions
**Solution:** Composition over inheritance

```javascript
// Before: Node classes with enormous property schemas
class UI extends BaseNode {
  schema() {
    return {
      x: { ... },
      y: { ... },
      width: { ... },
      // ... 100+ properties
    }
  }
}

// After: Composable property packages
const UIProperties = {
  position: { x: 0, y: 0 },
  dimensions: { width: 100, height: 100 },
  styling: { color: '#fff', opacity: 1 },
  interaction: { pointerEvents: true, onClick: null },
}

const UI = compose([
  BaseNode,
  UIProperties,
  ViewportHitTest,
  PointerInteraction,
])

// Or: Property builders
const UISchema = SchemaBuilder
  .base(BaseNode)
  .include(UIProperties.position)
  .include(UIProperties.dimensions)
  .include(UIProperties.styling)
  .include(UIProperties.interaction)
  .build()
```

---

### New: Lifecycle Hooks Framework

**Problem:** Systems have setup/update/cleanup but no way to inject behavior
**Solution:** Hook system with plugins

```javascript
// Framework hooks
setupHooks() {
  this.beforeSetup = new EventBus()
  this.afterSetup = new EventBus()
  this.beforeUpdate = new EventBus()
  this.afterUpdate = new EventBus()
  this.beforeCleanup = new EventBus()
  this.afterCleanup = new EventBus()
}

setup() {
  this.beforeSetup.emit(this)
  // ... setup logic
  this.afterSetup.emit(this)
}

// Plugins can tap into lifecycle
world.getSystem('ClientNetwork').beforeUpdate.on(() => {
  // Custom pre-update logic
})
```

---

## Level 3: Modularization Targets

### By Impact (High → Low)

| Priority | Phase | Impact | Effort | Status |
|----------|-------|--------|--------|--------|
| 🔴 High | Phase 8 (SDK) | -200-300 LOC | 2-3 hours | Ready |
| 🔴 High | Phase 10C (Shared Base Classes) | -300-400 LOC | 4-5 hours | Ready |
| 🔴 High | Phase 11 (Physics) | -300-400 LOC | 3-4 hours | Ready |
| 🟠 Medium | Phase 11 (Utility Consolidation) | -100-200 LOC | 2-3 hours | Ready |
| 🟠 Medium | Phase 12 (Extras Reorganization) | -50 LOC (org) | 1-2 hours | Ready |
| 🟠 Medium | Phase 13 (System Metadata) | 0 LOC (refactor) | 2-3 hours | Ready |
| 🟡 Low | Phase 14 (Config-Driven Systems) | -200-300 LOC | 4-5 hours | Planned |
| 🟡 Low | Phase 15 (Framework Hooks) | -50-100 LOC | 2-3 hours | Planned |

---

## Aggressive Modularization Path (Recommended)

### Week 1: Foundation (High Impact)
1. **Day 1:** Phase 8 (SDK Integration) - -200-300 LOC
2. **Day 2:** Phase 10C (Shared Base Classes) - -300-400 LOC
3. **Day 3:** Phase 11 (Physics Modularization) - -300-400 LOC
4. **Day 4:** Phase 11 (Utility Consolidation) - -100-200 LOC

**Week 1 Target: -900-1300 LOC + Better Architecture**

### Week 2: Framework (Medium Impact)
5. **Day 5:** Phase 12 (Extras Reorganization)
6. **Day 6:** Phase 13 (System Metadata + Registry)
7. **Day 7:** Phase 8B (Dead Code Removal) - -200-300 LOC

**Week 2 Target: -200-300 LOC + Framework in Place**

### Week 3: Advanced (Configuration-Driven)
8. **Day 8:** Phase 14 (Config-Driven Systems) - -200-300 LOC
9. **Day 9:** Phase 15 (Lifecycle Hooks Framework)
10. **Day 10:** Documentation + validation

**Week 3 Target: -200-300 LOC + Plugin System Ready**

**Total Potential: -1,500-2,200 LOC from Phase 7 baseline (25-30% reduction)**

---

## Why This Matters

### Before Modularization
```
- 39,600 LOC scattered across 265 files
- 45+ handler registries maintaining lists of types
- 6 parallel client/server systems
- Utility functions scattered across 20 files
- No framework for extensions
- System instantiation manual and fragile
```

### After Full Modularization
```
- ~24,000 LOC in semantic modules
- Dynamic system registry with auto-discovery
- Shared base classes eliminating duplication
- Organized utilities by domain
- Plugin framework for extensions
- Configuration-driven systems
- Metadata-rich architecture for observability
```

### Code Examples: Before vs After

#### Example 1: Adding New Node Type

**Before (Current):**
```javascript
// /src/core/nodes/MyNewNode.js - 300-500 LOC needed
import { BaseNode } from '../BaseNode'

export class MyNewNode extends BaseNode {
  schema() {
    return {
      prop1: { default: 0, type: 'number', ... },
      prop2: { default: 'x', type: 'string', ... },
      // ... 50+ more properties
      onUpdate: (prop) => { /* handler */ },
      onSet: { prop1: (val) => { /* ... */ } },
    }
  }

  update(dt) { /* ... */ }
  onAddedToApp() { /* ... */ }
}

// Then manually register everywhere:
// /src/core/NodeRegistry.js
// /src/core/SystemFactory.js
// /src/server/SystemFactory.js
// /hypersdk/index.js
```

**After (Modularized):**
```javascript
// /src/core/nodes/MyNewNode.js - 50-100 LOC
import { compose, NodeMixin } from '../framework'

export const MyNewNode = compose([
  BaseNode,
  NodeMixin('MyNewNode'),
  {
    properties: [
      { name: 'prop1', default: 0, type: 'number' },
      { name: 'prop2', default: 'x', type: 'string' },
    ],
    handlers: {
      update: (dt) => { /* ... */ },
      addedToApp: () => { /* ... */ },
    }
  }
])

// Auto-discovered and registered via metadata
// Zero manual registration needed
```

#### Example 2: Adding New Network Handler

**Before:**
```javascript
// ServerNetwork.js
setupHandlerRegistry() {
  this.handlers = {
    'oldHandler1': this.onOldHandler1.bind(this),
    'oldHandler2': this.onOldHandler2.bind(this),
    // ... 26 existing handlers
    'newHandler': this.onNewHandler.bind(this), // ADD HERE
  }
}

onNewHandler(msg) { /* ... */ }
```

**After (Declarative):**
```javascript
// ServerNetwork.js - handlers metadata
static meta = {
  handlers: [
    { type: 'oldHandler1', handler: 'onOldHandler1', timeout: 5000 },
    { type: 'oldHandler2', handler: 'onOldHandler2', timeout: 5000 },
    // ... 26 existing
    { type: 'newHandler', handler: 'onNewHandler', timeout: 5000 }, // ADD HERE
  ]
}

// No manual bindHandler() calls needed
// Can inspect all handlers via `.meta.handlers`
// Metrics auto-collected per handler
```

---

## Recommendation: Start with Phase 8

**Phase 8 (SDK Integration)** is the quickest win:
- Consolidates duplicate definitions
- Takes 2-3 hours
- Saves 200-300 LOC immediately
- Sets stage for system metadata framework
- No breaking changes

**Then Phase 10C (Shared Base Classes):**
- Biggest impact on code duplication
- 300-400 LOC savings
- Makes 6 parallel systems into 3 base + overrides
- Better testing foundation

**Then Phase 11 (Physics Modularization):**
- Breaks down the largest monolith
- 300-400 LOC savings
- Clearer concern separation

**These three phases alone = -900-1100 LOC + Much better foundation**

---

## Success Metrics

✅ **Target Baseline:**
- Start: 32,040 LOC (current)
- Goal: 24,000 LOC (27% reduction)
- Plus: Zero code duplication
- Plus: Framework for plugins
- Plus: Configuration-driven systems

✅ **Quality Metrics:**
- All systems under 200 LOC (no monoliths)
- Handler registry centralized and declarative
- Utility functions semantically organized
- SDK and core fully unified (single source of truth)
- System instantiation fully automated

✅ **Developer Experience:**
- Adding new node type: 50 LOC instead of 500
- Adding new handler: Just add to metadata table
- Adding new utility: Clear semantic home
- System lifecycle hooks for plugins
- Full introspection via metadata

---

## Questions to Consider

Before starting implementation:

1. **Configuration vs Code Trade-off**: Do you want systems fully configurable, or keep some as code?
2. **Plugin System Scope**: Should plugins be able to modify system behavior at runtime?
3. **Performance vs Flexibility**: Should the system metadata be runtime-introspectable?
4. **SDK Versioning**: After consolidation, should SDK be independently versioned?

---

**Next Step:** Begin Phase 8 (SDK Integration) → Phase 10C → Phase 11

This would eliminate most structural duplication and establish the framework for advanced modularization.
