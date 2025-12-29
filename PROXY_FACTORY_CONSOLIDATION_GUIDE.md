# Proxy Factory Consolidation Guide

This document explains the unified proxy factory architecture that consolidates 3 proxy-building patterns into a cohesive system.

## Architecture

### Three-Tier System

```
UnifiedProxyFactory (base class)
  ├── /entities/app/ProxyFactory (app & world proxies for scripts)
  ├── /nodes/base/ProxyFactory (node proxies for Three.js objects)
  └── ProxyBuilder (utility for constructing proxies)
```

### UnifiedProxyFactory (src/core/utils/factories/UnifiedProxyFactory.js)

Base class providing common proxy factory functionality:

```javascript
class UnifiedProxyFactory {
  createProxy(customProps, cacheKey)     // Build proxy with optional caching
  getCachedProxy(key)                    // Retrieve cached proxy
  clear()                                // Clear all cached proxies
  getBuilder()                           // Create builder (override in subclass)
  getStats()                             // Get cache statistics
}
```

**Methods for subclasses:**
- `createBuilderWithGettersSetters()` - Build from getter/setter specs
- `createBuilderWithSpec()` - Build from property/method specs

## Implementations

### 1. App Proxy Factory (src/core/entities/app/ProxyFactory.js)

Creates proxies for app script execution environment.

**Purpose:**
- World proxy: Exposes world API methods/getters/setters to scripts
- App proxy: Exposes app API methods/getters/setters to scripts
- Player proxy: Exposes player data to scripts

**Usage:**
```javascript
const factory = new ProxyFactory(app)
const worldProxy = factory.getWorldProxy()   // Cached
const appProxy = factory.getAppProxy()       // Cached
const playerProxy = factory.getPlayerProxy(playerId)
```

**Inheritance:**
- Extends UnifiedProxyFactory
- Uses proxyMap for caching world/app/player proxies
- Cleans up player proxies on clear()

### 2. Node Proxy Factory (src/core/nodes/base/ProxyFactory.js)

Creates proxies for Three.js node objects.

**Purpose:**
- Exposes node properties: position, quaternion, scale, matrixWorld, etc.
- Exposes node methods: add, remove, traverse, clone, etc.
- Enforces read-only constraints (id, position, quaternion)
- Provides ref/isRef for secure object access

**Usage:**
```javascript
const factory = new ProxyFactory(node)
const proxy = factory.createProxy()        // Cached
const anotherProxy = factory.buildProxy()  // Not cached
```

**Inheritance:**
- Extends UnifiedProxyFactory
- Uses cachedProxy for single proxy per node
- Uses ProxyBuilder to construct spec-based properties

### 3. ProxyBuilder (src/core/utils/ProxyBuilder.js)

Utility for dynamically building proxy objects.

**Features:**
- Add getters: `addGetter(key, fn)`
- Add setters: `addSetter(key, fn)`
- Add properties: `addProperty(key, get, set)`
- Add methods: `addMethod(key, fn)`
- Add read-only props: `addReadOnly(key, get)`
- Batch add: `addMultiple(spec)`
- Build: `build(customProps)`

**Example:**
```javascript
const builder = new ProxyBuilder(target)
builder.addProperty('x', () => target.x, (v) => target.x = v)
builder.addMethod('doThing', () => target.doThing())
builder.addReadOnly('id', () => target.id)
const proxy = builder.build({ customProp: 'value' })
```

## Migration Benefits

### Before (3 separate patterns)
- Duplicate caching logic
- Different API patterns
- No shared utilities
- Hard to maintain consistency

### After (unified base class)
- ✅ Shared caching via UnifiedProxyFactory
- ✅ Consistent API across implementations
- ✅ ProxyBuilder as shared utility
- ✅ Easy to extend with new factory types

## Adding New Proxy Factory

To create a new proxy factory:

```javascript
import { UnifiedProxyFactory } from '../../utils/factories/UnifiedProxyFactory.js'

export class CustomProxyFactory extends UnifiedProxyFactory {
  constructor(target) {
    super(target)
    this.target = target
  }

  createProxy(customProps = {}) {
    if (!this.cachedProxy) {
      this.cachedProxy = this.getBuilder().build(customProps)
    }
    return this.cachedProxy
  }

  getBuilder() {
    const builder = new ProxyBuilder(this.target)
    // Add properties and methods
    return builder
  }
}
```

## Performance

- **Caching**: Single cached proxy per factory instance
- **ProxyMap**: O(1) lookup for named proxies
- **Memory**: Minimal overhead - only active proxies cached
- **Garbage Collection**: clear() enables proper cleanup

## Files Modified

- `src/core/utils/factories/UnifiedProxyFactory.js` - New base class
- `src/core/entities/app/ProxyFactory.js` - Updated to extend UnifiedProxyFactory
- `src/core/nodes/base/ProxyFactory.js` - Updated to extend UnifiedProxyFactory
- `src/core/utils/ProxyBuilder.js` - No changes (reusable utility)

## Testing

Each factory remains independently testable:

```javascript
// Test app factory
const appFactory = new ProxyFactory(mockApp)
const worldProxy = appFactory.getWorldProxy()
assert(worldProxy !== undefined)

// Test node factory
const nodeFactory = new ProxyFactory(mockNode)
const nodeProxy = nodeFactory.createProxy()
assert(nodeProxy.position !== undefined)
```

## Future Work

Candidates for further consolidation:
- PlayerProxy (in extras/createPlayerProxy.js)
- Material proxies (MaterialProxy.js)
- Video proxies (VideoMaterialProxy.js)

All could benefit from extending UnifiedProxyFactory.
