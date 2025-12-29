# Core System Plugins - Phase 8 Implementation

## Overview

Phase 8 introduces plugin wrappers for critical core systems, enabling a plugin-based architecture while maintaining 100% backwards compatibility with existing code.

## Core System Plugins

### 1. NetworkPlugin
**File:** `src/core/plugins/NetworkPlugin.js`
**Wraps:** `src/core/systems/ClientNetwork.js`
**Backwards Compatible Access:** `world.network`

**Plugin API Methods:**
- `send(name, data)` - Send network message
- `on(event, callback)` - Register event listener
- `off(event, callback)` - Unregister event listener
- `connect(options)` - Connect to server
- `disconnect()` - Disconnect from server
- `isConnected()` - Check connection status
- `upload(file)` - Upload file to server
- `getStatus()` - Get network status object

**Existing Code Usage:**
```javascript
world.network.send('blueprintModified', { id, version, ...updates })
world.network.on('snapshot', handler)
world.network.id
world.network.connected
```

### 2. InputPlugin
**File:** `src/core/plugins/InputPlugin.js`
**Wraps:** `src/core/systems/ClientControls.js` → `src/core/systems/input/InputSystem.js`
**Backwards Compatible Access:** `world.controls`

**Plugin API Methods:**
- `on(event, callback)` - Register input event
- `off(event, callback)` - Unregister input event
- `isActive()` - Check if input system is active
- `lockPointer()` - Lock pointer to canvas
- `unlockPointer()` - Unlock pointer
- `isPointerLocked()` - Check pointer lock status
- `getPointer()` - Get pointer object
- `getScreen()` - Get screen dimensions
- `getStatus()` - Get input system status

**Existing Code Usage:**
```javascript
world.controls.bind({ priority: PRIORITY })
world.controls.pointer.locked
world.controls.lockPointer()
world.controls.actions
```

### 3. AssetPlugin
**File:** `src/core/plugins/AssetPlugin.js`
**Wraps:** `src/core/systems/ClientLoader.js` → `src/core/systems/BaseLoader.js`
**Backwards Compatible Access:** `world.loader`

**Plugin API Methods:**
- `load(type, url)` - Load asset asynchronously
- `get(type, url)` - Get cached asset
- `has(type, url)` - Check if asset is cached
- `preload(type, url)` - Preload asset
- `cache(type, url, data)` - Cache asset data
- `getCached(type, url)` - Get cached asset
- `setFile(url, file)` - Set file in manager
- `hasFile(url)` - Check if file exists
- `getFile(url, name)` - Get file by name
- `getStatus()` - Get loader status

**Existing Code Usage:**
```javascript
const texture = await world.loader.load('hdr', url)
const avatar = await world.loader.load('avatar', url)
world.loader.insert(type, url, file)
```

### 4. RenderPlugin
**File:** `src/core/plugins/RenderPlugin.js`
**Wraps:** `src/core/systems/Stage.js`
**Backwards Compatible Access:** `world.stage`

**Plugin API Methods:**
- `add(object)` - Add object to scene
- `remove(object)` - Remove object from scene
- `getScene()` - Get Three.js scene
- `getCamera()` - Get Three.js camera
- `getViewport()` - Get viewport dimensions
- `createMaterial(options)` - Create material
- `raycast(mouse, objects)` - Raycast in scene
- `getRenderStats()` - Get render statistics
- `getStatus()` - Get render system status

**Existing Code Usage:**
```javascript
world.stage.scene.add(object)
world.stage.createMaterial(options)
world.stage.viewport
```

## Backwards Compatibility

All four plugins maintain **100% backwards compatibility**. Existing code continues to work without any changes:

```javascript
// Old code - still works
world.network.send('message', data)
world.controls.lockPointer()
world.loader.load('texture', url)
world.stage.scene.add(mesh)

// New plugin API (opt-in)
const networkAPI = world.getPluginAPI('core-network')
const inputAPI = world.getPluginAPI('core-input')
const assetAPI = world.getPluginAPI('core-asset')
const renderAPI = world.getPluginAPI('core-render')
```

## Plugin Registration

Plugins are registered in `src/core/plugins/defaultPlugins.js`:

```javascript
{
  name: 'core-network',
  plugin: NetworkPlugin,
  options: {}
},
{
  name: 'core-input',
  plugin: InputPlugin,
  options: {}
},
{
  name: 'core-asset',
  plugin: AssetPlugin,
  options: {}
},
{
  name: 'core-render',
  plugin: RenderPlugin,
  options: {}
}
```

## Plugin Lifecycle

Each plugin follows the standard Plugin lifecycle:

```javascript
// Initialization
async init() {
  this.system = this.world.<system>
}

// API Exposure
getAPI() {
  return {
    method1: (arg) => this.system.method1(arg),
    method2: (arg) => this.system.method2(arg),
    // ... other methods
  }
}

// Destruction
async destroy() {
  this.system = null
}

// Enable/Disable
enable() { this.enabled = true }
disable() { this.enabled = false }
```

## Enable/Disable at Runtime

Plugins can be enabled or disabled at runtime without affecting the original systems:

```javascript
// Disable plugin (original system still works)
world.disablePlugin('core-network')

// Enable plugin
world.enablePlugin('core-network')

// Check status
if (world.isPluginEnabled('core-network')) {
  const api = world.getPluginAPI('core-network')
}
```

## System Status via Plugins

Get status information for each system:

```javascript
const networkAPI = world.getPluginAPI('core-network')
const status = networkAPI.getStatus()
// { connected: true, id: 'client-id', offlineMode: false, isClient: true, isServer: false }

const inputAPI = world.getPluginAPI('core-input')
const status = inputAPI.getStatus()
// { active: true, pointerLocked: true, screen: { width: 1920, height: 1080 } }

const assetAPI = world.getPluginAPI('core-asset')
const status = assetAPI.getStatus()
// { active: true, cached: 24, pending: 3, preloading: false }

const renderAPI = world.getPluginAPI('core-render')
const status = renderAPI.getStatus()
// { active: true, scene: true, camera: true, viewport: true, sceneChildren: 128, ... }
```

## Integration Path Forward

Phase 8 preparation for Phase 9 (logic extraction):

1. **Phase 8** (Current) - Wrap systems as plugins ✓
2. **Phase 9** - Extract logic from systems into plugin methods
3. **Phase 10** - Full plugin consolidation and system removal

## Files Changed

### Created
- `src/core/plugins/NetworkPlugin.js` - Network system wrapper
- `src/core/plugins/InputPlugin.js` - Input system wrapper
- `src/core/plugins/AssetPlugin.js` - Asset loader system wrapper
- `src/core/plugins/RenderPlugin.js` - Render system wrapper

### Modified
- `src/core/plugins/index.js` - Exports new plugins
- `src/core/plugins/defaultPlugins.js` - Registers new plugins

## Verification Checklist

- [x] All 4 plugins created successfully
- [x] Syntax validation passes for all files
- [x] Plugins exported in index.js
- [x] Plugins registered in defaultPlugins.js
- [x] 100% backwards compatibility maintained
- [x] Plugin APIs match system method signatures
- [x] Enable/disable support implemented
- [x] Status reporting available
- [x] Ready for Phase 9 implementation
