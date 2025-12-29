# Plugin System Architecture Guide

## Overview

The plugin system enables systems and features to be pluggable, promoting code reuse and extensibility. All plugins extend the base `Plugin` class and are managed by the `PluginRegistry`.

## Core Components

### 1. Plugin Base Class (`Plugin.js`)

All plugins inherit from this class:

```javascript
import { Plugin } from '../plugins/Plugin.js'

export class MyPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'MyPlugin'
    this.version = '1.0.0'
  }

  async init() {
    // Initialize plugin - called on registration
  }

  async destroy() {
    // Cleanup - called on unregistration
  }

  getAPI() {
    // Return public API for plugin consumers
    return {
      myMethod: () => { }
    }
  }

  getStatus() {
    // Returns status info (inherited from Plugin base class)
    return super.getStatus()
  }
}
```

### 2. PluginRegistry

Manages plugin lifecycle and discovery:

```javascript
// Register a plugin
world.pluginRegistry.register('myPlugin', pluginInstance)

// Get plugin
const plugin = world.getPlugin('myPlugin')

// List all plugins
const plugins = world.listPlugins()

// Get stats
const stats = world.getPluginStats()
// Returns: { totalPlugins, assetHandlers, networkHandlers, scriptGlobals, serverRoutes }

// Check if loaded
const loaded = world.isPluginLoaded('myPlugin')
```

### 3. PluginHooks

Provides lifecycle hooks for plugins:

```javascript
// Available hooks:
pluginHooks.register('world:init', 'before')      // Before world init
pluginHooks.register('world:start', 'before')     // Before world start
pluginHooks.register('world:update', 'action')    // During world update
pluginHooks.register('world:destroy', 'before')   // Before world destroy
pluginHooks.register('entity:created', 'after')   // After entity creation
pluginHooks.register('entity:destroyed', 'before')// Before entity destruction
pluginHooks.register('script:error', 'after')     // After script error
pluginHooks.register('asset:resolve', 'filter')   // Filter asset URLs
```

### 4. PluginAPI

Provides access to world systems and hooks:

```javascript
const api = world.getPluginAPI('myPlugin')

// Register handlers
api.registerAssetHandler('glb', asyncHandler)
api.registerNetworkMessage('custom-msg', handler)
api.registerScriptGlobal('globalName', value)
api.registerServerRoute('/api/custom', 'POST', handler)

// Hook into lifecycle
api.onWorldInit(fn)
api.onWorldStart(fn)
api.onWorldUpdate(fn)
api.onEntityCreated(fn)
api.onEntityDestroyed(fn)
api.onScriptError(fn)
api.onAssetResolve(fn)
api.onWorldDestroy(fn)

// System access
const system = api.getSystem('systemName')
const allSystems = api.getAllSystems()

// Global functions
api.registerGlobalFunction('globalFn', fn)

// Logging
api.log('info', 'message', { data })
api.log('error', 'message', { data })
```

## Converting a System to a Plugin

### Step 1: Create Plugin Class

```javascript
import { Plugin } from '../plugins/Plugin.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('InputHandlerPlugin')

export class InputHandlerPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'InputHandler'
    this.version = '1.0.0'
    this.inputSystem = null
  }

  async init() {
    // Get reference to underlying system
    this.inputSystem = this.world.controls || this.world.input
    if (!this.inputSystem) {
      logger.warn('Input system not available')
      return
    }
    logger.info('Input handler plugin initialized')
  }

  async destroy() {
    this.inputSystem = null
  }

  getAPI() {
    // Expose system functionality through API
    return {
      registerKeyHandler: (key, handler) => {
        if (!this.enabled || !this.inputSystem) return false
        return this.inputSystem.registerKeyHandler?.(key, handler) || false
      },

      getInputState: () => {
        if (!this.enabled) return {}
        return {
          keys: this.inputSystem.keys || {},
          pointer: this.inputSystem.pointer || {},
          touch: this.inputSystem.touch || {}
        }
      }
    }
  }
}
```

### Step 2: Register Plugin

```javascript
// In application initialization:
const inputPlugin = new InputHandlerPlugin(world, {
  // options
})

world.pluginRegistry.register('inputHandler', inputPlugin)
await inputPlugin.init()
```

### Step 3: Use Plugin API

```javascript
// Access through world
const api = world.getPluginAPI('inputHandler')
api.registerKeyHandler('w', () => { })

// Or through plugin directly
const plugin = world.getPlugin('inputHandler')
const api = plugin.api
```

## Example Plugins

### InputHandlerPlugin

Wraps input system functionality:
- `registerKeyHandler(key, handler)` - Register keyboard handler
- `registerPointerHandler(handler)` - Register pointer handler
- `registerTouchHandler(handler)` - Register touch handler
- `getInputState()` - Get current input state

### AssetLoaderPlugin

Wraps asset loading:
- `load(type, url)` - Load asset
- `loadGLTF(url)` - Load 3D model
- `loadTexture(url)` - Load texture
- `loadAudio(url)` - Load audio
- `preload(items)` - Preload assets
- `getLoadingStatus()` - Get progress

### AIClientPlugin

Wraps AI system:
- `configure(config)` - Configure AI settings
- `createEntity(prompt)` - Create entity with AI
- `editEntity(prompt)` - Edit entity with AI
- `fixEntity()` - Fix entity with AI
- `getStatus()` - Get AI status

## Plugin Management

### List All Plugins

```javascript
const plugins = world.listPlugins()
// Returns: [{ name, version, enabled }, ...]
```

### Check Plugin Status

```javascript
if (world.isPluginLoaded('myPlugin')) {
  const api = world.getPluginAPI('myPlugin')
  // Use plugin
}
```

### Get Plugin Stats

```javascript
const stats = world.getPluginStats()
console.log(stats)
// {
//   totalPlugins: 5,
//   assetHandlers: 3,
//   networkHandlers: 2,
//   scriptGlobals: 4,
//   serverRoutes: 2
// }
```

### Hook Information

```javascript
const allHooks = world.getAllHooks()
const count = world.getHookCount('world:update')
```

## Best Practices

1. **Enable/Disable Support**: Always check `this.enabled` before operations
2. **Error Handling**: Wrap operations in try-catch, log errors
3. **Cleanup**: Implement `destroy()` for resource cleanup
4. **API Design**: Keep API surface small and focused
5. **Logging**: Use ComponentLogger for consistent logging
6. **Documentation**: Document all API methods and options
7. **Testing**: Test plugin independently from world

## Long-term Migration Strategy

### Phase 1: Create Plugin Wrappers (Current)
- Wrap existing systems as plugins
- No changes to system implementation
- Enable side-by-side operation

### Phase 2: Plugin Integration
- Update systems to use plugin APIs
- Remove direct system dependencies
- Establish plugin as authoritative

### Phase 3: System Extraction
- Move system logic into plugin
- Keep thin adapter layer in system
- Full plugin-based architecture

## Performance Considerations

- Plugins use standard DEPS injection like systems
- No performance penalty for plugin abstraction
- Hook execution is optimized with early returns
- Registry lookups are O(1) Map operations

## Security Notes

- Plugins have full world access through API
- Restrict plugin loading to trusted sources
- Validate plugin input/output
- Log all plugin operations for audit trails
