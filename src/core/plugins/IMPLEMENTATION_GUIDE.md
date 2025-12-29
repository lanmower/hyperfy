# Plugin System Implementation Guide

## Quick Start

### Creating Your First Plugin

```javascript
import { Plugin } from '@hyperfy/core/plugins/Plugin.js'
import { ComponentLogger } from '@hyperfy/core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('MyPlugin')

export class MyPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'MyPlugin'
    this.version = '1.0.0'
  }

  async init() {
    logger.info('Plugin initialized', { options: this.options })
  }

  async destroy() {
    logger.info('Plugin destroyed')
  }

  getAPI() {
    return {
      doSomething: () => console.log('Doing something'),
      getValue: () => 'value'
    }
  }
}
```

### Using Your Plugin

```javascript
import { MyPlugin } from './MyPlugin.js'

// Register
const plugin = new MyPlugin(world, { someOption: true })
world.pluginRegistry.register('myPlugin', plugin)
await plugin.init()

// Access API
const api = world.getPluginAPI('myPlugin')
api.doSomething()
const value = api.getValue()

// Check status
const status = plugin.getStatus()
console.log(status)
// { name: 'MyPlugin', version: '1.0.0', enabled: true, options: {...} }
```

## System Conversion Checklist

### Before Conversion
- [ ] System has clear responsibilities
- [ ] System dependencies are identified
- [ ] System has public API methods
- [ ] System is not circular dependency

### During Conversion
- [ ] Create Plugin class extending Plugin base
- [ ] Store reference to original system
- [ ] Implement init() to get system reference
- [ ] Implement destroy() for cleanup
- [ ] Map system methods to getAPI() return object
- [ ] Add enable/disable checks to all API methods
- [ ] Handle missing system gracefully

### After Conversion
- [ ] Test plugin initialization
- [ ] Test API methods through plugin
- [ ] Test disable/enable functionality
- [ ] Verify cleanup in destroy()
- [ ] Add to examples directory
- [ ] Document API surface

## Dependency Management

### System Dependencies in Plugins

Use the same DEPS pattern as systems:

```javascript
export class MyPlugin extends Plugin {
  static DEPS = {
    stage: 'stage',
    loader: 'loader'
  }

  constructor(world, options = {}) {
    super(world, options)
    // DEPS are auto-injected by system
  }
}
```

### Accessing Systems

```javascript
const api = world.getPluginAPI('myPlugin')
const allSystems = api.getAllSystems()

// Or directly
const stage = world.stage
const loader = world.loader
```

## Hook Integration

### Registering Hooks in Plugins

```javascript
export class MyPlugin extends Plugin {
  async init() {
    // Hook into world events
    this.api.onWorldInit(() => {
      logger.info('World initialized')
    })

    this.api.onWorldUpdate((delta) => {
      // Update every frame
    })

    this.api.onEntityCreated((entity) => {
      logger.info('Entity created', { id: entity.id })
    })

    this.api.onScriptError((error) => {
      logger.error('Script error', { message: error.message })
    })
  }
}
```

### Executing Hooks from Plugins

Hooks automatically execute for all registered handlers:

```javascript
// In World.js
await this.pluginHooks.execute('world:update', delta)

// All plugins' onWorldUpdate callbacks fire
```

## Asset Handler Registration

### Custom Asset Types

```javascript
export class CustomAssetPlugin extends Plugin {
  async init() {
    // Register custom asset handler
    this.api.registerAssetHandler('custom', async (url) => {
      const response = await fetch(url)
      return response.json()
    })
  }
}
```

### Using Custom Assets

```javascript
// Scripts can now load custom assets
const data = await fetch(url)
  .then(r => r.json())
// OR through the loader
const data = await world.loader.load('custom', 'asset://mydata.json')
```

## Network Message Handling

### Register Custom Messages

```javascript
export class NetworkPlugin extends Plugin {
  async init() {
    this.api.registerNetworkMessage('custom-event', async (data) => {
      logger.info('Custom event received', data)
    })
  }
}
```

### Sending Custom Messages

```javascript
// From world network
world.network.send('custom-event', { payload: 'data' })

// Plugin hook will receive it
```

## Script Global Registration

### Adding Globals to Scripts

```javascript
export class UtilityPlugin extends Plugin {
  async init() {
    this.api.registerGlobalFunction('myGlobal', {
      doSomething: () => 'result',
      getValue: () => 42
    })
  }
}
```

### Using in Scripts

```javascript
// In app blueprints
export default (world, app, fetch, props, setTimeout) => {
  const result = myGlobal.doSomething()
  console.log(myGlobal.getValue()) // 42
}
```

## Server Route Registration

### Add API Endpoints

```javascript
export class APIPlugin extends Plugin {
  async init() {
    this.api.registerServerRoute('/api/data', 'GET', async (request, reply) => {
      return { status: 'ok', data: [] }
    })

    this.api.registerServerRoute('/api/data', 'POST', async (request, reply) => {
      const data = request.body
      // Process data
      return { status: 'created' }
    })
  }
}
```

## Enable/Disable Pattern

### Conditional Execution

```javascript
export class ConditionalPlugin extends Plugin {
  async init() {
    this.api.onWorldUpdate((delta) => {
      // Check enabled before executing
      if (!this.enabled) return

      // Do expensive operations only when enabled
      this.processFrame(delta)
    })
  }

  enable() {
    super.enable() // Calls parent's enable logic
    this.setup() // Plugin-specific setup
  }

  disable() {
    super.disable()
    this.cleanup() // Plugin-specific cleanup
  }
}
```

### Toggle from Outside

```javascript
const plugin = world.getPlugin('myPlugin')
plugin.disable()
// Plugin stops executing

plugin.enable()
// Plugin resumes
```

## Error Handling

### Try-Catch in Plugins

```javascript
export class RobustPlugin extends Plugin {
  async init() {
    try {
      // Get system
      const system = this.api.getSystem('loader')
      if (!system) {
        throw new Error('Loader system not available')
      }
    } catch (error) {
      this.api.log('error', 'Initialization failed', { error: error.message })
      this.enabled = false
    }
  }

  getAPI() {
    return {
      doSomething: () => {
        try {
          if (!this.enabled) {
            throw new Error('Plugin is disabled')
          }
          // Do work
        } catch (error) {
          this.api.log('error', 'Operation failed', { error: error.message })
          return null
        }
      }
    }
  }
}
```

## Lifecycle Management

### Plugin Lifecycle

```javascript
// 1. Construction
const plugin = new MyPlugin(world, options)

// 2. Registration
world.pluginRegistry.register('myPlugin', plugin)

// 3. Initialization
await plugin.init()

// 4. Active use
const api = world.getPluginAPI('myPlugin')
api.doSomething()

// 5. Enable/Disable (optional)
plugin.disable()
plugin.enable()

// 6. Destruction
await plugin.destroy()
world.pluginRegistry.unregister('myPlugin')
```

### Cleanup Pattern

```javascript
async destroy() {
  // Stop all ongoing operations
  if (this.updateUnsubscribe) {
    this.updateUnsubscribe()
  }

  // Release resources
  this.cache = null
  this.data = null

  // Log completion
  logger.info('Plugin cleanup complete')
}
```

## Testing Plugins

### Unit Testing

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { MyPlugin } from './MyPlugin.js'

describe('MyPlugin', () => {
  let plugin
  let mockWorld

  beforeEach(() => {
    mockWorld = {
      loader: { load: () => {} },
      getPluginAPI: () => ({ log: () => {} })
    }
    plugin = new MyPlugin(mockWorld, {})
  })

  it('initializes correctly', async () => {
    await plugin.init()
    expect(plugin.enabled).toBe(true)
  })

  it('provides API', () => {
    const api = plugin.getAPI()
    expect(api).toHaveProperty('doSomething')
  })

  it('disables correctly', () => {
    plugin.disable()
    expect(plugin.enabled).toBe(false)
  })
})
```

## Performance Optimization

### Lazy Loading

```javascript
export class LazyPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.loaded = false
    this.data = null
  }

  async init() {
    // Don't load immediately, wait for first use
    logger.info('Plugin ready (lazy)')
  }

  getAPI() {
    return {
      getData: async () => {
        if (!this.loaded) {
          this.data = await this.load()
          this.loaded = true
        }
        return this.data
      }
    }
  }

  async load() {
    // Load data on demand
    return {}
  }
}
```

### Caching

```javascript
export class CachedPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.cache = new Map()
  }

  getAPI() {
    return {
      getValue: (key) => {
        if (this.cache.has(key)) {
          return this.cache.get(key)
        }
        const value = this.compute(key)
        this.cache.set(key, value)
        return value
      }
    }
  }

  compute(key) {
    // Expensive computation
    return key.toUpperCase()
  }

  async destroy() {
    this.cache.clear()
  }
}
```

## Debugging Plugins

### Add Debug Logging

```javascript
export class DebugPlugin extends Plugin {
  getAPI() {
    return {
      doSomething: () => {
        console.log('[DebugPlugin] Entering doSomething')
        try {
          const result = this.compute()
          console.log('[DebugPlugin] Result:', result)
          return result
        } catch (error) {
          console.error('[DebugPlugin] Error:', error)
          throw error
        }
      }
    }
  }

  compute() {
    return 'value'
  }
}
```

### Monitor Plugin Status

```javascript
// Check all plugins
const plugins = world.listPlugins()
console.table(plugins)

// Check specific plugin status
const status = plugin.getStatus()
console.log(status)

// Get stats
const stats = world.getPluginStats()
console.log('Plugin Statistics:', stats)
```

## Common Patterns

### Observer Pattern

```javascript
export class ObserverPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.observers = []
  }

  getAPI() {
    return {
      subscribe: (observer) => {
        this.observers.push(observer)
        return () => {
          const idx = this.observers.indexOf(observer)
          if (idx !== -1) this.observers.splice(idx, 1)
        }
      },

      notify: (data) => {
        for (const observer of this.observers) {
          observer(data)
        }
      }
    }
  }
}
```

### Factory Pattern

```javascript
export class FactoryPlugin extends Plugin {
  getAPI() {
    return {
      create: (type, config) => {
        switch (type) {
          case 'type1': return new Type1(config)
          case 'type2': return new Type2(config)
          default: throw new Error(`Unknown type: ${type}`)
        }
      }
    }
  }
}
```

### Middleware Pattern

```javascript
export class MiddlewarePlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.middleware = []
  }

  getAPI() {
    return {
      use: (fn) => {
        this.middleware.push(fn)
      },

      execute: async (data) => {
        let result = data
        for (const fn of this.middleware) {
          result = await fn(result)
        }
        return result
      }
    }
  }
}
```
