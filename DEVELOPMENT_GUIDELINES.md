# Development Guidelines

## Quick Start

### Adding a New System

1. **Extend BaseSystem**
   ```javascript
   import { BaseSystem } from '../../BaseSystem.js'

   export class MySystem extends BaseSystem {
     getDefaultConfig() {
       return { enabled: true }
     }

     getInitialState() {
       return { initialized: false }
     }

     getHandlerMap() {
       return {
         'myEvent': 'onMyEvent'
       }
     }

     async init() {
       await super.init()
       this.setState({ initialized: true })
     }

     onMyEvent(data) {
       this.log('Event received:', data)
     }

     destroy() {
       this.log('Cleaning up')
     }
   }
   ```

2. **Register in SystemFactory**
   ```javascript
   // In src/core/SystemFactory.js
   import { MySystem } from './systems/MySystem.js'
   export const serverSystems = { MySystem }
   ```

3. **Use in World**
   ```javascript
   const world = new World()
   world.register('MySystem', MySystem)
   ```

---

### Adding a New Asset Type

1. **Define in Registry**
   ```javascript
   // In src/core/config/RegistryConfig.js
   export const assetTypeRegistry = {
     client: {
       myType: 'myType',  // Add new type
       // ... existing types
     }
   }
   ```

2. **Implement Loader**
   ```javascript
   class MyTypeLoader extends BaseLoader {
     getTypeHandlers() {
       return {
         'myType': this.loadMyType.bind(this)
       }
     }

     async loadMyType(url) {
       const response = await fetch(url)
       return response.json()
     }
   }
   ```

---

### Adding a New Command

1. **Define in Registry**
   ```javascript
   // In src/core/config/RegistryConfig.js
   export const commandRegistry = {
     mycommand: 'mycommand',  // Add new command
     // ... existing commands
   }
   ```

2. **Implement Handler**
   ```javascript
   class CommandHandler {
     setupCommandRegistry() {
       this.commands = {
         'mycommand': this.handleMyCommand.bind(this),
         // ... existing commands
       }
     }

     async handleMyCommand(socket, player, arg1) {
       // Implementation
     }
   }
   ```

---

### Adding a New Node Type

1. **Choose a Base Class**
   - `Node` - Generic node
   - `Node3D` - 3D geometry
   - `NodeUI` - UI elements
   - `NodePhysics` - Physics simulation

2. **Extend the Base**
   ```javascript
   import { Node3D } from './bases/Node3D.js'

   export class MyNode extends Node3D {
     constructor(data = {}) {
       super(data)
       this.myProperty = data.myProperty
     }

     update(delta) {
       // Update logic
     }
   }
   ```

3. **Register Node Type**
   Add to `nodeTypeRegistry` in `config/RegistryConfig.js`

---

## Code Organization

### File Structure
```
feature/
├── index.js          # Exports
├── FeatureSystem.js  # Main system
├── types/            # Type definitions
├── utils/            # Feature-specific utilities
└── handlers/         # Handler implementations (if complex)
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `MySystem`, `Node3D`)
- **Functions**: camelCase (e.g., `handleClick`, `updateState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`, `DEFAULT_CONFIG`)
- **Privates**: _leadingUnderscore (e.g., `_internalState`)
- **Files**: PascalCase for classes, camelCase for functions/utils

### Module Exports
Always provide an index.js with clear exports:
```javascript
// feature/index.js
export { FeatureSystem } from './FeatureSystem.js'
export { Feature, FeatureBuilder } from './Feature.js'
export * from './handlers.js'
```

---

## Best Practices

### 1. **Use Registries Over Hardcoding**
❌ **Bad:**
```javascript
if (type === 'video') loadVideo()
else if (type === 'image') loadImage()
else if (type === 'model') loadModel()
```

✅ **Good:**
```javascript
const loader = typeHandlers[type]
if (loader) return loader(url)
```

### 2. **Leverage Mixins**
❌ **Bad:**
```javascript
class MySystem extends System {
  constructor(world) {
    super(world)
    this.handlers = new Map()
    this.state = {}
    this.cache = new Map()
    // 50+ lines of boilerplate
  }
}
```

✅ **Good:**
```javascript
import { withHandlerRegistry } from '../../mixins'

class MySystem extends withHandlerRegistry(BaseSystem) {
  getHandlerMap() {
    return { 'event': 'onEvent' }
  }
}
```

### 3. **Keep Mixins Focused**
Each mixin should have a single responsibility:
- `withHandlerRegistry` - Handler dispatch
- `withCacheable` - Caching logic
- `withStateManager` - State management

### 4. **Use Semantic Organization**
Keep related code together:
```
src/core/
├── auth/           # Authentication related
│   ├── AuthSystem.js
│   ├── User.js
│   └── Token.js
├── rendering/      # Rendering related
│   ├── RenderSystem.js
│   ├── Camera.js
│   └── Scene.js
```

### 5. **Avoid Circular Dependencies**
- Import only what you need
- Use dependency injection when possible
- Prefer composition over tight coupling

### 6. **Document Complex Logic**
```javascript
/**
 * Interpolates between two values using easing function
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} alpha - Interpolation factor (0-1)
 * @param {Function} easing - Easing function (e.g., easeInOut)
 * @returns {number} Interpolated value
 */
export function interpolate(current, target, alpha, easing = linear) {
  return current + (target - current) * easing(alpha)
}
```

### 7. **Use Config for Tweaks**
```javascript
class MySystem extends BaseSystem {
  getDefaultConfig() {
    return {
      speed: 1.0,      // Can be tweaked later
      precision: 0.001, // Can be tweaked later
      enabled: true     // Can be toggled
    }
  }
}

// Usage:
system.setConfig('speed', 2.0)
```

### 8. **Log Appropriately**
```javascript
class MySystem extends BaseSystem {
  init() {
    this.log('Initializing...')  // Info
    this.warn('Deprecated!')      // Warning
    this.error('Failed!')          // Error
  }
}
```

---

## Testing

### System Testing
```javascript
import { MySystem } from './MySystem.js'
import { MockWorld } from './mocks/MockWorld.js'

describe('MySystem', () => {
  let system

  beforeEach(() => {
    const world = new MockWorld()
    system = new MySystem(world)
  })

  test('should initialize', async () => {
    await system.init()
    expect(system.state.initialized).toBe(true)
  })

  test('should handle events', () => {
    system.dispatch('myEvent', { data: 'test' })
    expect(system.getState('count')).toBe(1)
  })
})
```

---

## Performance Tips

1. **Cache Expensive Computations**
   ```javascript
   this.getOrCompute('key', () => expensiveOp(), { ttl: 1000 })
   ```

2. **Batch Updates**
   ```javascript
   this.world.taskQueue.add(() => updateEntity(entity))
   ```

3. **Use Object Pools for Frequent Allocations**
   ```javascript
   const pool = new ObjectPool(() => new Vector3())
   const vec = pool.get()
   // Use vec
   pool.put(vec)
   ```

4. **Avoid Creating New Objects in Hot Loops**
   ```javascript
   // Bad: new object each frame
   for (const entity of entities) {
     const transformed = { x: entity.x * 2, y: entity.y * 2 }
   }

   // Good: reuse object
   const transformed = {}
   for (const entity of entities) {
     transformed.x = entity.x * 2
     transformed.y = entity.y * 2
   }
   ```

---

## Debugging

### Enable Debug Mode
```javascript
// In your system
debug(...args) {
  if (this.getConfig('debug')) {
    this.log('[DEBUG]', ...args)
  }
}

// Usage:
system.setConfig('debug', true)
system.debug('Variable:', value)
```

### Use System Metadata
```javascript
// Get full system status
console.log(system.getMetadata())

// Output:
// {
//   name: 'MySystem',
//   enabled: true,
//   config: { enabled: true, speed: 1.0 },
//   state: { count: 5, initialized: true }
// }
```

### Check Handler Registry
```javascript
// List all registered handlers
console.log(system.getHandlerNames())

// Check if handler exists
if (system.hasHandler('myEvent')) {
  system.dispatch('myEvent', data)
}
```

---

## Migration Checklist

When refactoring old code:

- [ ] Replace `System` with `BaseSystem`
- [ ] Extract handlers into `getHandlerMap()`
- [ ] Extract config into `getDefaultConfig()`
- [ ] Extract state into `getInitialState()`
- [ ] Replace hardcoded values with registry lookups
- [ ] Use semantic imports from organized utils
- [ ] Add logging with `this.log()`, `this.warn()`, `this.error()`
- [ ] Document complex logic with JSDoc
- [ ] Add tests for critical paths
- [ ] Update CHANGELOG.md

---

## Troubleshooting

### Import Errors
- Check file paths are correct
- Ensure index.js files exist for directories
- Verify exports match imports

### Handler Not Found
- Check `getHandlerMap()` implementation
- Verify method names match handler keys
- Use `system.getHandlerNames()` to debug

### State Not Updating
- Ensure using `setState()` not direct assignment
- Check watchers are registered correctly
- Verify `getInitialState()` provides default values

### Performance Issues
- Enable debug logging
- Check for O(n²) loops
- Use cache for expensive operations
- Profile with browser DevTools
