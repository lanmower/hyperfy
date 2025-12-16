# Phase 10C: Shared Base Classes Design
## Client/Server System Consolidation

**Date:** December 16, 2025
**Objective:** Eliminate structural duplication between Client and Server systems via shared base classes
**Target Savings:** 300-400 LOC
**Affected Systems:** Network, Loader, Environment, LiveKit (4 pairs)

---

## Current Duplication Analysis

### 1. Network Systems (ClientNetwork ↔ ServerNetwork)

#### ClientNetwork (279 LOC)
- Handler registry with 19 message types
- Protocol instance management
- WebSocket connection handling (client-specific)
- File upload via fetch (client-specific)
- Packet sending to server
- Pre-fixed update for protocol flush

#### ServerNetwork (649 LOC)
- Handler registry with 26 message types
- Protocol instance management
- Multi-socket broadcast system (server-specific)
- File upload server-side handling (server-specific)
- Connection/disconnection management (server-specific)
- Persistence integration (server-specific)
- Spawn/teleport/push handling (server-specific)

#### Common Logic (70-90 LOC)
```javascript
- Protocol setup and initialization
- Handler registry pattern (setupHandlerRegistry)
- Handler binding boilerplate (Object.entries -> bind)
- Protocol flush in preFixedUpdate
- Abstract send/enqueue methods
- getTime() delegation to protocol
```

#### Duplication Pattern
**Before (Current):**
```javascript
// ClientNetwork.js (279L)
class ClientNetwork extends System {
  constructor(world) {
    super(world)
    this.ws = null
    this.protocol = new NetworkProtocol('ClientNetwork')
    this.protocol.isClient = true
    this.setupHandlerRegistry()
  }

  setupHandlerRegistry() {
    const handlers = {
      'snapshot': this.onSnapshot,
      'chatAdded': this.onChatAdded,
      // ... 19 handlers
    }
    for (const [name, handler] of Object.entries(handlers)) {
      this.protocol.register(name, handler.bind(this))
    }
  }

  preFixedUpdate() {
    this.protocol.flush()
  }
}

// ServerNetwork.js (649L)
class ServerNetwork extends System {
  constructor(world) {
    super(world)
    this.sockets = new Map()
    this.protocol = new NetworkProtocol('ServerNetwork')
    this.protocol.isServer = true
    this.setupHandlerRegistry()
  }

  setupHandlerRegistry() {
    const handlers = {
      'chatAdded': this.onChatAdded,
      'command': this.onCommand,
      // ... 26 handlers
    }
    for (const [name, handler] of Object.entries(handlers)) {
      this.protocol.register(name, handler.bind(this))
    }
  }

  preFixedUpdate() {
    this.protocol.flush()
  }
}
```

**After (Proposed):**
```javascript
// BaseNetwork.js (120L) - NEW
export class BaseNetwork extends System {
  constructor(world) {
    super(world)
    this.protocol = new NetworkProtocol(this.constructor.name)
    this.setupHandlerRegistry()
  }

  setupHandlerRegistry() {
    const handlers = this.getMessageHandlers() // Override in subclass
    for (const [name, handler] of Object.entries(handlers)) {
      this.protocol.register(name, handler.bind(this))
    }
  }

  // Override to define platform-specific handlers
  getMessageHandlers() {
    return {}
  }

  preFixedUpdate() {
    this.protocol.flush()
  }

  getTime() {
    return this.protocol.getTime()
  }

  // Abstract methods subclasses must implement
  send(name, data) {
    throw new Error('send() must be implemented by subclass')
  }

  enqueue(socket, method, data) {
    throw new Error('enqueue() must be implemented by subclass')
  }
}

// ClientNetwork.js (100L) - REDUCED from 279L
export class ClientNetwork extends BaseNetwork {
  constructor(world) {
    super(world)
    this.ws = null
    this.apiUrl = null
    this.id = null
    this.protocol.isClient = true
    this.protocol.flushTarget = this
  }

  getMessageHandlers() {
    return {
      'snapshot': this.onSnapshot,
      'chatAdded': this.onChatAdded,
      // ... 19 handlers (same as before)
    }
  }

  init({ wsUrl, name, avatar }) { /* ... */ }
  send(name, data) { /* ... */ }
  async upload(file) { /* ... */ }
  enqueue(method, data) { /* ... */ }
  // ... message handlers
}

// ServerNetwork.js (350L) - REDUCED from 649L
export class ServerNetwork extends BaseNetwork {
  constructor(world) {
    super(world)
    this.sockets = new Map()
    this.socketIntervalId = setInterval(() => this.checkSockets(), PING_RATE * 1000)
    this.protocol.isServer = true
    this.protocol.isConnected = true
    this.protocol.flushTarget = this
    this.setupHotReload()
  }

  getMessageHandlers() {
    return {
      'chatAdded': this.onChatAdded,
      'command': this.onCommand,
      // ... 26 handlers (same as before)
    }
  }

  init({ db, assetsDir }) { /* ... */ }
  send(name, data, ignoreSocketId) { /* ... */ }
  enqueue(socket, method, data) { /* ... */ }
  // ... message handlers
}
```

**Savings:** -180 LOC (base class consolidates setup, registry, lifecycle)
**Result:** -379L combined (ClientNetwork + ServerNetwork consolidated)

---

### 2. Loader Systems (ClientLoader ↔ ServerLoader)

#### ClientLoader (195 LOC after Phase 5 consolidation)
- Type registry with 9 asset types
- Cache management (promises, results)
- Preloading system
- File type handlers (video, hdr, image, texture, model, emote, avatar, script, audio)
- Browser-specific APIs (File, Image, fetch)

#### ServerLoader (215 LOC)
- Type registry with 5 asset types
- Cache management (promises, results)
- Preloading system
- File type handlers (model, emote, avatar, script, audio)
- Server-specific APIs (fs, http fetch)

#### Common Logic (60-80 LOC)
```javascript
- Cache management (promises, results Maps)
- Preloading queue system
- Type registry pattern (setupTypeRegistry)
- load(type, url) dispatch logic
- has(type, url) / get(type, url) lookups
- execPreload() promise coordination
```

#### Duplication Pattern
**Before (Current):**
```javascript
// Both have identical patterns:
class ClientLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.preloadItems = []
    this.setupTypeRegistry()
  }

  setupTypeRegistry() {
    this.typeHandlers = {
      'video': (url, file, key) => { /* ... */ },
      'hdr': (url, file, key) => { /* ... */ },
      // ... 9 handlers
    }
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }
    url = this.world.resolveURL(url)
    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return Promise.resolve(null)
    }
    const promise = handler(url).then(result => {
      this.results.set(key, result)
      return result
    })
    this.promises.set(key, promise)
    return promise
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises)
  }
}
```

**After (Proposed):**
```javascript
// BaseLoader.js (110L) - NEW
export class BaseLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.preloadItems = []
    this.setupTypeRegistry()
  }

  setupTypeRegistry() {
    this.typeHandlers = this.getTypeHandlers() // Override in subclass
  }

  // Override to define platform-specific handlers
  getTypeHandlers() {
    return {}
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }
    url = this.world.resolveURL(url, this.isServer)
    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return Promise.resolve(null)
    }
    const promise = handler(url).then(result => {
      this.results.set(key, result)
      return result
    })
    this.promises.set(key, promise)
    return promise
  }

  destroy() {
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}

// ClientLoader.js (95L) - REDUCED from 195L
export class ClientLoader extends BaseLoader {
  constructor(world) {
    super(world)
    this.isServer = false
    this.files = new Map()
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new TextureLoader()
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.register(parser => new VRMLoaderPlugin(parser))
  }

  getTypeHandlers() {
    return {
      'video': (url, file, key) => { /* ... */ },
      'hdr': (url, file, key) => { /* ... */ },
      // ... 9 handlers (same as before)
    }
  }

  async upload(file) { /* ... */ }
}

// ServerLoader.js (105L) - REDUCED from 215L
export class ServerLoader extends BaseLoader {
  constructor(world) {
    super(world)
    this.isServer = true
    this.rgbeLoader = new RGBELoader()
    this.gltfLoader = new GLTFLoader()
    // ... globals mock
  }

  getTypeHandlers() {
    return {
      'model': (url) => { /* ... */ },
      'emote': (url) => { /* ... */ },
      'avatar': (url) => { /* ... */ },
      'script': (url) => { /* ... */ },
      'audio': (url) => { /* ... */ },
    }
  }

  async fetchArrayBuffer(url) { /* ... */ }
  async fetchText(url) { /* ... */ }
}
```

**Savings:** -115 LOC (base class consolidates all shared logic)
**Result:** -110L combined (ClientLoader + ServerLoader consolidated)

---

### 3. Environment Systems (ClientEnvironment ↔ ServerEnvironment)

#### ClientEnvironment (500+ LOC)
- Sky/HDR management
- Shadows, fog, lighting
- Graphics rendering setup

#### ServerEnvironment (16 LOC)
- Minimal placeholder

#### Assessment
- **Minimal duplication** - ServerEnvironment is mostly a placeholder
- **Decision:** Create lightweight BaseEnvironment for lifecycle consistency
- **Savings:** Only ~15-20 LOC

---

### 4. LiveKit Systems (ClientLiveKit ↔ ServerLiveKit)

#### ClientLiveKit (516 LOC)
- Audio/video conference management
- Voice level tracking
- Audio device management

#### ServerLiveKit (need to examine)
- Token generation
- Room management
- Mute management

#### Assessment
- Need to examine ServerLiveKit first
- Likely ~100-150 LOC savings

---

## Implementation Strategy

### Phase 10C - Three Waves

#### Wave 1: BaseNetwork + BaseLoader (Days 1-2)
**Effort:** 4-5 hours
**Savings:** -290 LOC

1. **Create BaseNetwork** (120L)
   - Common protocol/handler setup
   - Lifecycle methods
   - Abstract send/enqueue

2. **Refactor ClientNetwork** (100L)
   - Extend BaseNetwork
   - Override getMessageHandlers()
   - Keep all platform logic

3. **Refactor ServerNetwork** (350L)
   - Extend BaseNetwork
   - Override getMessageHandlers()
   - Keep all platform logic

4. **Create BaseLoader** (110L)
   - Common cache/preload logic
   - Type registry pattern
   - Load dispatch

5. **Refactor ClientLoader** (95L)
   - Extend BaseLoader
   - Override getTypeHandlers()
   - Keep all platform logic

6. **Refactor ServerLoader** (105L)
   - Extend BaseLoader
   - Override getTypeHandlers()
   - Keep all platform logic

#### Wave 2: BaseEnvironment (Days 3)
**Effort:** 1-2 hours
**Savings:** ~20 LOC

1. **Create BaseEnvironment** (minimal)
   - Shared lifecycle
   - Simple constructor

2. **Refactor ClientEnvironment**
   - Extend BaseEnvironment
   - No LOC change (already clean)

3. **Refactor ServerEnvironment**
   - Extend BaseEnvironment
   - Just constructor

#### Wave 3: LiveKit (Optional, Day 4)
**Effort:** 2-3 hours
**Savings:** ~50-100 LOC

---

## File Structure (After Implementation)

```
src/core/systems/
├── network/
│   ├── BaseNetwork.js         (NEW, 120L)
│   ├── ClientNetwork.js       (100L, -179L)
│   └── ServerNetwork.js       (350L, -299L)
├── loader/
│   ├── BaseLoader.js          (NEW, 110L)
│   ├── ClientLoader.js        (95L, -100L)
│   └── ServerLoader.js        (105L, -110L)
├── environment/
│   ├── BaseEnvironment.js     (NEW, 20L)
│   ├── ClientEnvironment.js   (500L, unchanged)
│   └── ServerEnvironment.js   (16L, unchanged)
├── [other systems unchanged]
```

**Net Change:**
- 3 new base classes (250L)
- 6 refactored classes (-408L)
- **Total: -158L direct reduction**
- **Plus:** Much cleaner architecture, easier to extend

---

## Code Quality Improvements

### Before
```javascript
// Duplication across 4 system pairs
// No way to share common patterns
// Difficult to audit for consistency
// Hard to add new systems following same pattern
```

### After
```javascript
// Clear inheritance hierarchy
// Common patterns defined once in base classes
// Easy to audit for consistency
// New systems follow same pattern automatically
// Platform-specific logic clearly separated
```

---

## Implementation Checklist

- [ ] Create `src/core/network/BaseNetwork.js`
- [ ] Create `src/core/loader/BaseLoader.js`
- [ ] Create `src/core/environment/BaseEnvironment.js`
- [ ] Refactor ClientNetwork to extend BaseNetwork
- [ ] Refactor ServerNetwork to extend BaseNetwork
- [ ] Refactor ClientLoader to extend BaseLoader
- [ ] Refactor ServerLoader to extend BaseLoader
- [ ] Refactor ClientEnvironment to extend BaseEnvironment
- [ ] Refactor ServerEnvironment to extend BaseEnvironment
- [ ] Update all imports across codebase
- [ ] Test game functionality (unchanged)
- [ ] Verify build succeeds
- [ ] Commit with clear message

---

## Risk Assessment

**Breaking Changes:** NONE
- All public interfaces remain identical
- Inheritance is internal refactoring
- No changes to game behavior or network protocol
- No changes to asset loading behavior
- No changes to environment rendering

**Regression Risk:** MINIMAL
- Method delegation stays the same
- All handlers remain in same classes
- Cache/queue logic identical
- Only organization changes

---

## Benefits

1. **Code Reuse:** Common patterns defined once
2. **Maintainability:** Clear hierarchy and responsibility
3. **Consistency:** All network/loader/environment systems follow same pattern
4. **Extensibility:** Easy to add new client/server system pairs
5. **Testability:** Base classes can be tested for common behavior
6. **Documentation:** Clear intent via inheritance
7. **Future:** Framework for plugin systems

---

## Summary

**Phase 10C delivers:**
- ✅ -158 to -200 LOC direct reduction
- ✅ Better code organization
- ✅ Improved maintainability
- ✅ Clear architectural patterns
- ✅ Foundation for plugin system
- ✅ Zero breaking changes

**Time Investment:** 8-12 hours total
**Risk Level:** Very Low
**Value:** Very High
