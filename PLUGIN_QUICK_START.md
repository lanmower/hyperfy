# Plugin System Quick Start Guide

## Load Default Plugins (One Line)

```javascript
await world.loadDefaultPlugins()
```

Done! You now have AI, Input, Assets, and Network plugins loaded and ready.

## Use a Plugin

```javascript
// Get the plugin API
const api = world.getPluginAPI('network')

// Use it (safely handles if disabled)
if (api && api.isConnected()) {
  api.send({ type: 'message', data: 'hello' })
}
```

## Control Plugins

```javascript
// Check status
world.isPluginLoaded('ai')        // true/false
world.isPluginEnabled('ai')       // true/false

// Enable/disable at runtime
world.enablePlugin('ai')
world.disablePlugin('ai')

// List all plugins
const plugins = world.listPlugins()
// Returns: [{ name, version, enabled }, ...]

// Get statistics
const stats = world.getPluginStats()
// Returns: { totalPlugins, assetHandlers, networkHandlers, ... }
```

## Access Individual Plugin APIs

```javascript
// AI Plugin
const aiAPI = world.getPluginAPI('ai')
aiAPI.createEntity('a red sphere')
aiAPI.editEntity('make it blue')
aiAPI.fixEntity()
aiAPI.getStatus()

// Input Plugin
const inputAPI = world.getPluginAPI('input')
inputAPI.registerKeyHandler('w', () => console.log('W pressed'))
inputAPI.getInputState()

// Assets Plugin
const assetsAPI = world.getPluginAPI('assets')
await assetsAPI.loadGLTF('model.glb')
await assetsAPI.loadTexture('texture.png')
assetsAPI.getLoadingStatus()

// Network Plugin
const netAPI = world.getPluginAPI('network')
netAPI.send({ type: 'message', text: 'hello' })
netAPI.broadcast(message, excludeIds)
netAPI.isConnected()
netAPI.getConnectionStats()
netAPI.disconnect()
```

## Create a Custom Plugin

```javascript
import { Plugin } from '@hyperfy/core/plugins/Plugin.js'

export class MyPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'MyPlugin'
    this.version = '1.0.0'
  }

  async init() {
    console.log('Plugin initialized with:', this.options)
  }

  async destroy() {
    console.log('Plugin destroyed')
  }

  getAPI() {
    return {
      doSomething: () => {
        if (!this.enabled) return null  // Safe disable check
        return 'done'
      },
      getValue: () => {
        if (!this.enabled) return null
        return 42
      }
    }
  }
}

// Register it
const plugin = new MyPlugin(world, { myOption: true })
world.pluginRegistry.register('myPlugin', plugin)
await plugin.init()

// Use it
const api = world.getPluginAPI('myPlugin')
console.log(api.getValue())  // 42
```

## Plugin Lifecycle Hooks

Plugins can hook into world lifecycle:

```javascript
import { Plugin } from '@hyperfy/core/plugins/Plugin.js'

export class HookPlugin extends Plugin {
  getAPI() {
    return {
      registerHooks: (api) => {
        // Called before world init
        api.onWorldInit(() => console.log('World initializing'))

        // Called before world starts
        api.onWorldStart(() => console.log('World starting'))

        // Called every frame
        api.onWorldUpdate((delta) => console.log('Frame:', delta))

        // Called when entity created
        api.onEntityCreated((entity) => console.log('Entity:', entity.id))

        // Called when entity destroyed
        api.onEntityDestroyed((entity) => console.log('Removed:', entity.id))

        // Called on script errors
        api.onScriptError((error) => console.log('Script error:', error))

        // Called before world destroys
        api.onWorldDestroy(() => console.log('World destroying'))
      }
    }
  }
}
```

## Register Custom Handlers

```javascript
const plugin = new MyPlugin(world)
const api = world.getPluginAPI('myPlugin')

// Register asset handler
api.registerAssetHandler('custom', async (url) => {
  // Load custom asset type
  return loadCustomAsset(url)
})

// Register network message handler
api.registerNetworkMessage('custom-msg', (data) => {
  console.log('Received:', data)
})

// Register script global
api.registerScriptGlobal('myGlobal', { value: 42 })

// Register server route
api.registerServerRoute('/api/custom', 'POST', (request) => {
  return { result: 'ok' }
})
```

## Plugin Manager Pattern

```javascript
// Helper to manage plugins
class PluginManager {
  constructor(world) {
    this.world = world
  }

  async loadDefaults() {
    return await this.world.loadDefaultPlugins()
  }

  hasPlugin(name) {
    return this.world.isPluginLoaded(name)
  }

  getAPI(name) {
    return this.world.getPluginAPI(name)
  }

  isEnabled(name) {
    return this.world.isPluginEnabled(name)
  }

  enable(name) {
    if (this.hasPlugin(name)) {
      this.world.enablePlugin(name)
    }
  }

  disable(name) {
    if (this.hasPlugin(name)) {
      this.world.disablePlugin(name)
    }
  }

  toggle(name) {
    if (this.isEnabled(name)) {
      this.disable(name)
    } else {
      this.enable(name)
    }
  }

  listAll() {
    return this.world.listPlugins()
  }

  stats() {
    return this.world.getPluginStats()
  }
}

// Usage
const manager = new PluginManager(world)
manager.loadDefaults()
manager.toggle('ai')  // Disable if enabled, enable if disabled
const stats = manager.stats()  // Get all stats
```

## Error Handling

```javascript
// Plugins handle their own errors gracefully
try {
  const netAPI = world.getPluginAPI('network')

  // Safe: Returns null/false if disabled or unavailable
  if (netAPI && netAPI.isConnected()) {
    const result = netAPI.send(message)
    if (!result) {
      console.log('Send failed (plugin disabled or error)')
    }
  }
} catch (error) {
  console.error('Plugin error:', error)
}
```

## Common Patterns

### Check Before Use
```javascript
const api = world.getPluginAPI('network')
if (api && world.isPluginEnabled('network')) {
  api.send(message)
}
```

### Graceful Degradation
```javascript
const api = world.getPluginAPI('ai')
if (api) {
  const result = await api.createEntity(prompt)
  if (result) {
    // Use AI result
  } else {
    // AI disabled or failed, use fallback
  }
}
```

### Runtime Toggle
```javascript
if (user.wantsAI) {
  world.enablePlugin('ai')
} else {
  world.disablePlugin('ai')
}
```

## FAQ

**Q: Do I need to load default plugins?**
A: No, plugins are optional. Load them only if you need them.

**Q: Can I create plugins without extending Plugin?**
A: Technically yes, but it's not recommended. Use the base class for consistency.

**Q: What happens if a plugin crashes?**
A: Plugins fail gracefully. Other plugins continue working. Errors are logged.

**Q: Can I reload a plugin?**
A: Currently: disable/enable works. Future: hot reload support planned.

**Q: How do I test a plugin?**
A: Create a minimal world instance and test the plugin in isolation.

**Q: Can plugins depend on each other?**
A: Not built-in yet, but you can check if another plugin is loaded.

## Quick Reference

```javascript
// Loading
await world.loadDefaultPlugins()

// Checking
world.isPluginLoaded(name)
world.isPluginEnabled(name)
world.listPlugins()
world.getPluginStats()

// Management
world.enablePlugin(name)
world.disablePlugin(name)

// Access
world.getPlugin(name)
world.getPluginAPI(name)

// Lifecycle
world.getAllHooks()
world.getHookCount(name)

// Registration
pluginRegistry.register(name, plugin)
pluginRegistry.unregister(name)
pluginRegistry.getPlugin(name)
pluginRegistry.getAllPlugins()
```

## Resources

- **Full Guide:** `/src/core/plugins/PLUGIN_GUIDE.md`
- **Implementation:** `/src/core/plugins/IMPLEMENTATION_GUIDE.md`
- **Examples:** `/src/core/plugins/examples/`
- **Phase 7 Details:** `/PHASE7_COMPLETION_REPORT.md`

---

**That's it! You're ready to use the plugin system.**
