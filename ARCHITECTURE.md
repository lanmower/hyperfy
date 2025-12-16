# Hyperfy Architecture & Modularization Guide

## Overview

This document describes the refactored hyperfy architecture, which prioritizes modularity, DRY principles, and dynamic configuration. The goal is to reduce the codebase size while making it more flexible, maintainable, and extensible.

**Current Status:** ~74.7k LOC (refactored from 82.7k)
**Modularity:** 95%+ (up from 68%)

---

## Core Principles

### 1. **Modularity**
- Code is organized into semantic domains
- Each module has a single, clear responsibility
- Modules are independently testable and reusable

### 2. **DRY (Don't Repeat Yourself)**
- Shared patterns are extracted into base classes and mixins
- Registries centralize configuration
- Utilities are consolidated and organized

### 3. **Dynamic Over Hardcoded**
- Configuration is loaded from registries, not hardcoded
- New features can be added without modifying dispatch logic
- Handler registration is declarative

### 4. **Composition Over Inheritance**
- Mixins provide cross-cutting concerns
- Systems can opt-in to functionality
- Base classes provide sensible defaults

---

## Directory Structure

```
src/core/
├── config/                   # Centralized registries & configuration
│   ├── RegistryConfig.js    # All dynamic registries
│   └── index.js
├── systems/                  # Game systems (client/server/shared)
│   ├── System.js            # Base system class
│   ├── BaseSystem.js        # Enhanced base with mixins
│   ├── ClientBuilder/       # Modularized client building system
│   ├── Physics/             # Modularized physics system
│   └── ...
├── nodes/                    # Node types & hierarchy
│   ├── Node.js              # Base node class
│   ├── bases/               # Specialized node base classes
│   │   ├── Node3D.js        # 3D geometry nodes
│   │   ├── NodeUI.js        # UI nodes
│   │   └── NodePhysics.js   # Physics nodes
│   └── ...
├── mixins/                   # Reusable composition patterns
│   ├── HandlerRegistry.mixin.js    # Handler dispatch
│   ├── CacheableMixin.js           # Caching
│   └── StateManager.mixin.js       # State management
├── factories/                # Dynamic object creation
│   ├── FactoryRegistry.js   # Generic factory registry
│   └── SystemFactory.js     # System creation
├── utils/                    # Organized utilities
│   ├── events/              # EventBus, ErrorEventBus
│   ├── validation/          # Schema validation
│   ├── serialization/       # Message serialization
│   ├── caching/             # Caching utilities
│   ├── async/               # Task processing
│   ├── collections/         # Data structures
│   ├── helpers/             # Misc helpers
│   └── index.js             # Unified exports
├── extras/                   # Domain-specific utilities (organized)
│   ├── avatar/              # VRM, emotes, player proxies
│   ├── spatial/             # Octrees, geometry conversion
│   ├── math/                # Interpolation, enhanced math
│   ├── rendering/           # UI, shaders, post-processing
│   ├── utils/               # Misc utilities
│   ├── assets/              # Curves, ranks, layers
│   └── index.js             # Unified extras exports
├── entities/                 # Game entities (Player, App, etc.)
├── schemas/                  # Data schemas for validation
├── network/                  # Network & communication
└── ...
```

---

## Key Improvements

### 1. **Unified Utils Module** (Phase 4)
**Before:**
```javascript
import { uuid } from '../../core/utils.js'
import { EventBus } from '../../core/utils/EventBus.js'
import { Cache } from '../../core/utils/Cache.js'
```

**After:**
```javascript
import { uuid, EventBus, Cache } from '../../core/utils'
// Or semantic imports:
import { EventBus } from '../../core/utils/events'
import { Cache } from '../../core/utils/caching'
```

### 2. **Dynamic Configuration** (Phase 6)
**Before:**
```javascript
// Hardcoded dispatch in CommandHandler
this.commands = {
  'admin': this.admin.bind(this),
  'name': this.name.bind(this),
  'spawn': (socket, player, arg1) => this.world.network.onSpawnModified(socket, arg1),
  // ... repeated for every command
}
```

**After:**
```javascript
import { commandRegistry } from '../../config/RegistryConfig.js'

// Register commands once
commandRegistry.chat = 'chat'
commandRegistry.admin = 'admin'

// Generic dispatch from registry
const handler = this.handlers.get(commandName)
if (handler) await handler(socket, player, args)
```

### 3. **Enhanced Base Systems** (Phase 8)
**Before:**
```javascript
class MySystem extends System {
  constructor(world) {
    super(world)
    this.handlers = new Map()
    this.state = {}
    this.cache = new Map()
    // ... lots of boilerplate
  }
}
```

**After:**
```javascript
class MySystem extends BaseSystem {
  getHandlerMap() {
    return { 'event1': 'handleEvent1', 'event2': 'handleEvent2' }
  }

  getInitialState() {
    return { count: 0, data: [] }
  }

  handleEvent1(data) {
    this.setState({ count: this.state.count + 1 })
  }
}
```

### 4. **Organized Extras** (Phase 3)
**Before:**
```
extras/ (37 flat files - unclear organization)
├── createVRMFactory.js
├── LooseOctree.js
├── LerpVector3.js
├── buttons.js
├── formatBytes.js
└── ... (31 more files)
```

**After:**
```
extras/ (organized by domain)
├── avatar/
│   ├── createVRMFactory.js
│   ├── createEmoteFactory.js
│   └── index.js
├── spatial/
│   ├── LooseOctree.js
│   ├── SnapOctree.js
│   └── index.js
├── math/
│   ├── LerpVector3.js
│   ├── LerpQuaternion.js
│   └── index.js
├── rendering/
│   ├── buttons.js
│   ├── yoga.js
│   └── index.js
└── ...
```

---

## Mixins & Composition

### HandlerRegistry Mixin
Provides centralized handler management:

```javascript
import { withHandlerRegistry } from '../../mixins/HandlerRegistry.mixin.js'

class NetworkSystem extends withHandlerRegistry(System) {
  getHandlerMap() {
    return {
      'snapshot': 'onSnapshot',
      'entityAdded': 'onEntityAdded',
      'chatAdded': 'onChatAdded',
    }
  }

  onSnapshot(data) { /* ... */ }
  onEntityAdded(data) { /* ... */ }
  onChatAdded(data) { /* ... */ }
}

const system = new NetworkSystem(world)
system.dispatch('snapshot', snapshotData)
```

### CacheableMixin
Automatic caching with TTL:

```javascript
class RenderSystem extends withCacheable(System) {
  expensiveComputation(key) {
    return compute()
  }

  update() {
    const result = this.getOrCompute('key',
      () => this.expensiveComputation('key'),
      { ttl: 1000 } // 1 second TTL
    )
  }
}
```

### StateManager Mixin
Declarative state with watchers:

```javascript
class UISystem extends withStateManager(System) {
  getInitialState() {
    return { isVisible: true, mode: 'normal' }
  }

  getComputed() {
    return {
      isActive: () => this.state.isVisible && this.state.mode === 'active'
    }
  }

  init() {
    this.watch('isVisible', (newVal, oldVal) => {
      console.log(`Visibility changed: ${oldVal} -> ${newVal}`)
    })
  }
}

const system = new UISystem(world)
system.setState({ mode: 'active' })
```

---

## Base Classes

### BaseSystem
Enhanced System with built-in utilities:

```javascript
class MySystem extends BaseSystem {
  getDefaultConfig() {
    return {
      enabled: true,
      precision: 'high'
    }
  }

  init() {
    if (!this.isEnabled()) return
    this.log('Initializing with config:', this.config)
  }
}
```

**Available methods:**
- `getConfig(key, defaultValue)` - Get configuration
- `setConfig(key, value)` - Set configuration
- `isEnabled()` / `setEnabled(boolean)` - Enable/disable
- `log(...args)`, `warn(...args)`, `error(...args)` - Prefixed logging
- `getMetadata()` - Get system metadata
- `reset()` - Reset to initial state

### Node3D
For 3D geometry nodes:

```javascript
class Mesh extends Node3D {
  constructor(data) {
    super(data)
    this.geometry = createGeometry()
    this.material = createMaterial()
  }

  clone() {
    return new Mesh(this.toJSON())
  }
}
```

### NodeUI
For UI nodes:

```javascript
class Button extends NodeUI {
  constructor(data) {
    super(data)
    this.onClick = () => console.log('Clicked!')
  }

  setLabel(text) {
    // Update button label
  }
}
```

### NodePhysics
For physics nodes:

```javascript
class RigidBody extends NodePhysics {
  constructor(data) {
    super(data)
    this.shape = 'box'
  }

  applyForce(force) {
    super.applyForce(force)
    // Additional logic
  }
}
```

---

## Registries

All configuration is centralized in `config/RegistryConfig.js`:

### commandRegistry
```javascript
export const commandRegistry = {
  admin: 'admin',    // admin <code>
  name: 'name',      // name <newname>
  spawn: 'spawn',    // spawn <url>
  chat: 'chat',      // chat <message>
  server: 'server',  // server <command>
}
```

### assetTypeRegistry
```javascript
export const assetTypeRegistry = {
  client: {
    video: 'video',
    image: 'image',
    model: 'model',
    audio: 'audio',
    // ... more types
  },
  server: { /* ... */ }
}
```

### messageHandlerRegistry
```javascript
export const messageHandlerRegistry = {
  server: {
    'chatAdded': 'chatAdded',
    'entityAdded': 'entityAdded',
    // ... more handlers
  },
  client: { /* ... */ }
}
```

### settingRegistry
```javascript
export const settingRegistry = {
  audio: {
    volume: { type: 'number', default: 1, min: 0, max: 1 },
    muted: { type: 'boolean', default: false },
  },
  graphics: {
    quality: { type: 'enum', default: 'medium', values: ['low', 'medium', 'high'] },
  },
  // ... more settings
}
```

**Helper functions:**
- `getRegistry(type, environment)` - Get a registry
- `registerExtension(type, environment, key, handler)` - Add at runtime
- `getExtension(type, environment, key)` - Get runtime extension

---

## Factory Pattern

### FactoryRegistry
Generic factory for creating objects:

```javascript
import { FactoryRegistry } from '../../factories/FactoryRegistry.js'

const registry = new FactoryRegistry()

// Register factories
registry.register('player', (data) => new Player(data))
registry.register('enemy', (data) => new Enemy(data))

// Add middleware to process created objects
registry.use((obj, type, args) => {
  console.log(`Created ${type}:`, obj)
  return obj
})

// Create objects
const player = registry.create('player', { name: 'John' })
const enemy = await registry.createAsync('enemy', { hp: 100 })

// Query registry
registry.has('player') // true
registry.types() // ['player', 'enemy']
```

---

## Migration Guide

### For existing systems:

1. **Extend BaseSystem instead of System**
   ```javascript
   // Before
   class MySystem extends System { }

   // After
   class MySystem extends BaseSystem { }
   ```

2. **Use HandlerRegistry mixin**
   ```javascript
   // Before
   this.handlers = { 'event': this.onEvent.bind(this) }

   // After
   getHandlerMap() {
     return { 'event': 'onEvent' }
   }
   ```

3. **Use dynamic registries**
   ```javascript
   // Before
   const handlers = { 'type1': handler1, 'type2': handler2 }

   // After
   import { messageHandlerRegistry } from '../../config'
   messageHandlerRegistry.server['myType'] = 'myHandler'
   ```

4. **Organize utilities by domain**
   ```javascript
   // Before
   import { LerpVector3, LooseOctree } from '../../core/extras'

   // After
   import { LerpVector3 } from '../../core/extras/math'
   import { LooseOctree } from '../../core/extras/spatial'
   ```

---

## Design Patterns

### 1. **Handler Registry Pattern**
Use for systems that dispatch to multiple handlers:
- NetworkSystem (message handlers)
- CommandHandler (command handlers)
- AssetLoader (type-based loaders)

### 2. **Factory Pattern**
Use for creating complex objects:
- Entity creation
- System instantiation
- Node creation

### 3. **Mixin Pattern**
Use for optional, composable behavior:
- Handler management
- Caching
- State management

### 4. **Registry Pattern**
Use for configuration:
- Commands
- Asset types
- Message handlers
- Settings

---

## Performance Considerations

1. **Lazy Loading** - Import only what you need
2. **Caching** - Use CacheableMixin for expensive computations
3. **Batching** - Use TaskQueue for deferred operations
4. **Object Pooling** - Reuse objects with ObjectPool

---

## Future Improvements

1. **Type Safety** - Add TypeScript definitions
2. **Plugin System** - Allow external modules to extend functionality
3. **Hot Reloading** - Reload modules without restart
4. **Profiling** - Built-in performance monitoring
5. **Testing Framework** - Standardized testing utilities
