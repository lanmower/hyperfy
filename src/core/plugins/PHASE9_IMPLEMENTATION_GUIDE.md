# Phase 9 Implementation Guide

This guide explains how the core system logic consolidation works and how to extend it.

## Architecture Overview

Phase 9 introduces 4 shared utility classes that consolidate duplicate functionality:

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin API Layer                         │
├─────────────────────────────────────────────────────────────┤
│  NetworkPlugin  │ InputPlugin │ AssetPlugin │ RenderPlugin  │
├─────────────────────────────────────────────────────────────┤
│  Shared Helper Classes                                      │
├─────────────────────────────────────────────────────────────┤
│ MessageHandler │ InputHelper │ AssetLoader │ RenderHelper   │
├─────────────────────────────────────────────────────────────┤
│                    System Layer                             │
├─────────────────────────────────────────────────────────────┤
│ ClientNetwork │ InputSystem │ ClientLoader │ Stage System   │
└─────────────────────────────────────────────────────────────┘
```

## Shared Utilities Details

### 1. MessageHandler

**File:** `src/core/plugins/core/MessageHandler.js`

**Purpose:** Centralized message encoding/decoding for network communication.

**Static Methods:**

```javascript
// Encode message to packet
const packet = MessageHandler.encode('getSnapshot', { force: true })

// Decode packet to method and data
const [method, data] = MessageHandler.decode(packet)

// Get packet information
const info = MessageHandler.getInfo('getSnapshot')
// Returns: { id: 0, name: 'getSnapshot', method: 'onGetSnapshot' }

// Get packet name by ID
const name = MessageHandler.getName(0) // 'getSnapshot'
```

**How It Works:**

1. On module load, maps all PACKET_NAMES to IDs (0, 1, 2, ...)
2. Stores bidirectional mapping: name ↔ ID
3. Generates method name from packet name (getSnapshot → onGetSnapshot)
4. Encodes: [id, data] → msgpackr → ArrayBuffer
5. Decodes: ArrayBuffer → msgpackr → [id, data] → [method, data]

**Security Features:**

- Type validation: packet must be ArrayBuffer
- Structure validation: unpacked must be 2-element array
- ID validation: must be number and exist in mapping
- Error logging: all violations logged

**Usage in Systems:**

```javascript
// ClientNetwork.js
import { MessageHandler } from '../plugins/core/MessageHandler.js'

send(name, data) {
  const packet = MessageHandler.encode(name, data)
  this.wsManager.send(packet)
}

onPacket = e => {
  const [method, data] = MessageHandler.decode(e.data)
  if (method && typeof this[method] === 'function') {
    this[method](data)
  }
}
```

---

### 2. InputHelper

**File:** `src/core/plugins/core/InputHelper.js`

**Purpose:** Unified event registration and input state management.

**Static Methods:**

```javascript
// Register input handler
const unsubscribe = InputHelper.registerInput(
  control,
  'click',
  (data) => console.log('clicked', data),
  { once: false, capture: false, passive: true }
)

// Dispatch input event
const handled = InputHelper.dispatchInput(control, 'click', { x: 10, y: 20 })

// Remove all listeners for an event type
InputHelper.removeAllListeners(control, 'click')

// Normalize button state
const normalized = InputHelper.normalizeButtonState({
  down: true,
  pressed: false
})
// Returns: { down: true, pressed: false, released: false, value: 0 }

// Normalize vector state
const vec = InputHelper.normalizeVectorState({ x: 1, y: 1 })
// Returns: { x: 1, y: 1, z: 0, length: 1.414... }

// Merge input configurations
const merged = InputHelper.mergeInputConfigs(baseConfig, overrideConfig)
```

**Features:**

- **One-time listeners**: Register with `once: true` for auto-cleanup
- **Event delegation**: Capture phase prevents event bubbling
- **Passive listeners**: Non-passive handlers can stop propagation
- **State normalization**: Consistent format for button and vector data
- **Config composition**: Merge configs while preserving nested objects

**Event Flow:**

```
registerInput() → listener stored in control._listeners
    ↓
dispatchInput() → iterate listeners, call handlers
    ↓
handler(data) → returns true for handled, false continues
    ↓
if passive: continue to next listener
if handled: stop propagation
if once: auto-remove listener
```

**Usage Pattern:**

```javascript
// In an input handler
const control = { _listeners: {} }

InputHelper.registerInput(control, 'buttonPress', (data) => {
  console.log('Button pressed:', data.button)
  return true // mark as handled
})

// Dispatch event
InputHelper.dispatchInput(control, 'buttonPress', { button: 'A' })
```

---

### 3. AssetLoader

**File:** `src/core/plugins/core/AssetLoader.js`

**Purpose:** Unified asset loading, caching, and handler management.

**Instance Methods:**

```javascript
const loader = new AssetLoader()

// Register handler for asset type
loader.registerHandler('model', async (url, options) => {
  const response = await fetch(url)
  return response.json()
})

// Check if handler exists
if (loader.hasHandler('model')) { /* ... */ }

// Load asset (with caching)
const model = await loader.load('model', 'path/to/model.glb')

// Get cached asset
const cached = loader.get('model', 'path/to/model.glb')

// Check if cached
if (loader.has('model', 'path/to/model.glb')) { /* ... */ }

// Manually cache asset
loader.cache('model', 'path/to/model.glb', modelData)

// Clear cache
loader.clear() // clear all
loader.clear('model') // clear by type

// Get statistics
const stats = loader.getStats()
// Returns: { cached: 5, pending: 2, handlers: 8 }
```

**Caching Strategy:**

```
load() called
  ↓
Check cache (key = 'type/url')
  ↓
If cached: return immediately
If pending: return existing promise
If new: create handler promise
  ↓
Promise resolves
  ↓
Cache result with key
Return result
```

**Handler Registration:**

```javascript
loader.registerHandler('texture', async (url, options) => {
  const blob = await fetch(url).then(r => r.blob())
  return createImageBitmap(blob)
})

loader.registerHandler('audio', async (url, options) => {
  const buffer = await fetch(url).then(r => r.arrayBuffer())
  return audioContext.decodeAudioData(buffer)
})

// Now can load any registered type
const texture = await loader.load('texture', 'image.png')
const audio = await loader.load('audio', 'sound.mp3')
```

---

### 4. RenderHelper

**File:** `src/core/plugins/core/RenderHelper.js`

**Purpose:** Unified Three.js rendering utilities.

**Static Methods:**

```javascript
// Create material with standard config
const material = RenderHelper.createMaterial({
  color: 'blue',
  metalness: 0.5,
  roughness: 0.5
})

// Create unlit material
const unlit = RenderHelper.createMaterial({
  color: 'red',
  unlit: true
})

// Clone material with custom handler
const cloned = RenderHelper.createMaterial({
  raw: originalMaterial,
  color: 'green'
})

// Clone all textures from material
const textures = RenderHelper.cloneTextures(material)

// Setup scene environment
RenderHelper.setupSceneEnvironment(scene, {
  background: new THREE.Color('skyblue'),
  environment: hdrTexture,
  fog: new THREE.Fog(0x000000, 10, 100)
})

// Raycast from camera based on mouse position
const success = RenderHelper.raycastFromCamera(
  raycaster,
  camera,
  viewport,
  { x: clientX, y: clientY }
)

// Raycast from screen center
RenderHelper.raycastFromCenter(raycaster, camera)

// Get scene statistics
const stats = RenderHelper.getSceneStats(scene)
// Returns: { geometries, materials, textures, lines, points, triangles }

// Create grid helper
const grid = RenderHelper.createGridHelper(10, 10, 0x444444, 0x888888)

// Create axis helper
const axes = RenderHelper.createAxisHelper(1)

// Add standard lighting
const lights = RenderHelper.addLighting(scene, {
  ambientIntensity: 0.6,
  directionalIntensity: 1.0
})
```

**Material Creation Logic:**

```
createMaterial(options)
  ↓
if options.raw:
  clone raw material, preserve onBeforeCompile
else if options.unlit:
  create MeshBasicMaterial
else:
  create MeshStandardMaterial with metalness/roughness
  ↓
set shadowSide to BackSide
return material
```

**Texture Cloning:**

Maps and clones all possible texture types:
- map (color)
- emissiveMap
- normalMap
- bumpMap
- roughnessMap
- metalnessMap

---

## Plugin API Integration

Each plugin exposes its helper through `getAPI()`:

### NetworkPlugin API

```javascript
const plugin = world.plugins.get('Network')
const api = plugin.getAPI()

// Message handling
api.encodeMessage(name, data)
api.decodeMessage(packet)

// Compression
api.compressData(data)
api.decompressData(payload)

// Connection
api.connect(options)
api.disconnect()
api.isConnected()

// Network status
api.getStatus()
```

### InputPlugin API

```javascript
const plugin = world.plugins.get('Input')
const api = plugin.getAPI()

// Event handling
api.registerHandler(eventType, handler, options)
api.dispatchEvent(eventType, data)

// Input normalization
api.normalizeButton(buttonState)
api.normalizeVector(vectorState)

// Input status
api.getStatus()
```

### AssetPlugin API

```javascript
const plugin = world.plugins.get('Asset')
const api = plugin.getAPI()

// Loading
api.loadAsync(type, url, options)
api.registerHandler(type, handler)

// Caching
api.cacheAsset(type, url, data)
api.clearCache(type)

// Statistics
api.getLoaderStats()
api.getStatus()
```

### RenderPlugin API

```javascript
const plugin = world.plugins.get('Render')
const api = plugin.getAPI()

// Materials
api.createMaterial(options)
api.cloneTextures(material)

// Scene
api.setupEnvironment(options)
api.getSceneStats()

// Raycasting
api.raycastFromCamera(mouse)
api.raycastFromCenter()

// Helpers
api.addGridHelper(size, divisions)
api.addAxisHelper(size)

// Status
api.getStatus()
```

---

## Extension Points

### Adding New Message Types

1. Add to PACKET_NAMES in `src/packets.constants.js`
2. MessageHandler automatically maps it
3. Use in any network system

### Adding New Input Event Types

1. Call `InputHelper.registerInput(control, 'eventType', handler)`
2. Dispatch with `InputHelper.dispatchInput(control, 'eventType', data)`
3. Handlers receive normalized data

### Adding New Asset Types

1. Register handler: `loader.registerHandler('type', handler)`
2. Load: `await loader.load('type', url)`
3. Handler receives (url, options) and returns promise

### Adding New Render Features

1. Extend RenderHelper with new static method
2. Add to RenderPlugin.getAPI()
3. Use via plugin API

---

## Migration Path for Phase 10

These consolidations enable the following in Phase 10:

### Eliminate PacketCodec

```javascript
// Before: Keep separate module
import { PacketCodec } from './network/PacketCodec.js'

// After: Use MessageHandler directly
import { MessageHandler } from '../plugins/core/MessageHandler.js'
```

### Simplify Material Creation

```javascript
// Before: Only Stage.createMaterial()
const mat = this.stage.createMaterial({ color: 'red' })

// After: Via RenderHelper
const mat = RenderHelper.createMaterial({ color: 'red' })
// And Stage delegates to it
```

### Consolidate Asset Handlers

```javascript
// Before: AssetHandlers has type-specific methods
assetHandlers.handleModel(url, file, key)
assetHandlers.handleTexture(url, file, key)

// After: Single handler pattern via AssetLoader
loader.registerHandler('model', handler)
loader.registerHandler('texture', handler)
```

---

## Performance Considerations

### MessageHandler

- **Startup:** One-time mapping of PACKET_NAMES
- **Runtime:** Fast encode/decode with msgpackr
- **Memory:** Minimal (single mapping structure)

### InputHelper

- **Memory:** Listeners stored in control._listeners
- **Dispatch:** O(n) where n = listeners for event type
- **Cleanup:** Auto-cleanup for once: true listeners

### AssetLoader

- **Caching:** Fast Map-based lookups (O(1))
- **Promises:** Only one promise per (type, url)
- **Memory:** Cache keeps references (implement LRU if needed)

### RenderHelper

- **Scene Traversal:** O(n) for scene stats, acceptable for debugging
- **Material Creation:** Lightweight clone operations
- **Raycasting:** Delegates to Three.js raycaster

---

## Best Practices

1. **Use MessageHandler for all network packets**
   - Centralizes serialization
   - Ensures consistency

2. **Use InputHelper for event management**
   - Consistent event flow
   - Proper cleanup with once: true

3. **Use AssetLoader for new asset types**
   - Automatic caching
   - Promise-based async

4. **Use RenderHelper for scene operations**
   - Reduces code duplication
   - Leverages Three.js best practices

5. **Access via Plugins**
   - Future-proof (can swap implementations)
   - Consistent API across app
   - Easy to test

---

## Troubleshooting

### MessageHandler Errors

```javascript
// Error: unknown packet id 99
// Solution: Check PACKET_NAMES in packets.constants.js
// Ensure new packet name is registered there first
```

### InputHelper Events Not Firing

```javascript
// Check: control._listeners is populated
console.log(control._listeners)

// Check: event type matches registration
InputHelper.registerInput(control, 'click', handler)
InputHelper.dispatchInput(control, 'click', data) // same event type

// Check: handler returns boolean for handled
handler: (data) => true // or false
```

### AssetLoader Cache Not Working

```javascript
// Check: handler returns promise
handler: async (url) => { ... }

// Check: skipCache option
loader.load('model', url, { skipCache: false }) // default

// Check: cache key format
const key = `${type}/${url}`
console.log(loader.cache.keys()) // verify key exists
```

### RenderHelper Scene Stats Incorrect

```javascript
// Scene must have proper geometry/material structure
scene.traverse(obj => {
  console.log(obj.geometry, obj.material)
})

// Stats only count objects with geometry or material
// Ensure objects are properly attached to scene
```
