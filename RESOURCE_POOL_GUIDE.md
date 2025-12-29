# Resource Pool Guide

Centralized object pooling strategy for managing frequently allocated resources (vectors, quaternions, matrices, custom objects).

## Architecture Overview

```
ResourcePoolManager (central coordinator)
├── ObjectPool (generic object pooling)
├── VectorPool (optimized Vector3 pooling)
├── QuaternionPool (optimized Quaternion pooling)
├── Matrix4Pool (optimized Matrix4 pooling)
└── Custom Pools (application-specific)

Global Manager (singleton for app-wide access)
```

## Core Concepts

### ObjectPool

Generic pool for any object type with acquire/release semantics.

**Features**:
- Reuse pattern (grab from pool → use → return)
- Lazy creation (create objects on-demand if pool empty)
- Reference tracking (knows which objects are in-use)
- Statistics collection (reuse rate, creation count, etc.)
- Disposal support (calls dispose() on clear)

**Location**: `src/core/utils/pool/ObjectPool.js`

**Usage**:
```javascript
class Vector3 {
  constructor() { this.x = 0; this.y = 0; this.z = 0 }
}

const pool = new ObjectPool(Vector3, 100, 'vectors')

// Acquire from pool
const vec = pool.acquire()
vec.x = 10
vec.y = 20
vec.z = 30

// Use the vector...

// Return to pool
pool.release(vec)

// Get statistics
const stats = pool.getStats()
console.log(stats)
// {
//   name: 'vectors',
//   available: 99,
//   inUse: 1,
//   created: 100,
//   reused: 5,
//   returned: 5,
//   reuseRate: 0.05
// }
```

### VectorPool

Specialized pool for 3D vectors with automatic reset.

**Auto-Reset Feature**:
- Automatically zeros out x, y, z on release
- Prevents accidental state pollution
- More memory-safe than generic ObjectPool

**Usage**:
```javascript
import { VectorPool } from './pool/ObjectPool.js'

const pool = new VectorPool(Vector3Factory, 50)

const vec = pool.acquire()
vec.set(1, 2, 3)

// Use...

pool.release(vec)  // Automatically resets to {x:0, y:0, z:0}
```

### QuaternionPool

Specialized pool for quaternions with automatic reset.

**Auto-Reset Feature**:
- Resets to identity quaternion {x:0, y:0, z:0, w:1}
- Safe for rotation calculations

**Usage**:
```javascript
import { QuaternionPool } from './pool/ObjectPool.js'

const pool = new QuaternionPool(QuatFactory, 50)

const quat = pool.acquire()
quat.setFromEuler(euler)

// Use...

pool.release(quat)  // Automatically resets to identity
```

### Matrix4Pool

Specialized pool for 4x4 matrices.

**Usage**:
```javascript
import { Matrix4Pool } from './pool/ObjectPool.js'

const pool = new Matrix4Pool(Matrix4Factory, 20)

const mat = pool.acquire()
mat.multiply(other)

// Use...

pool.release(mat)
```

### ResourcePoolManager

Centralized manager for all pools in the application.

**Responsibilities**:
- Create and manage multiple pools
- Provide unified statistics interface
- Centralized pool destruction
- Global pool access

**Usage**:
```javascript
import { ResourcePoolManager } from './pool/ResourcePoolManager.js'

const manager = new ResourcePoolManager()

// Create pools
const vecPool = manager.createVectorPool('player-vectors', Vector3, 100)
const quatPool = manager.createQuaternionPool('animations', Quaternion, 50)
const customPool = manager.createObjectPool('projectiles', Projectile, 20)

// Get specific pool
const pool = manager.getPool('player-vectors')
const vec = pool.acquire()
// use...
pool.release(vec)

// Get all statistics
const stats = manager.getStats()
console.log(stats)

// Get summary across all pools
const summary = manager.getSummary()
console.log(summary)
// {
//   totalPools: 3,
//   pools: {
//     'player-vectors': {...},
//     'animations': {...},
//     'projectiles': {...}
//   },
//   summary: {
//     totalAvailable: 150,
//     totalInUse: 5,
//     totalCreated: 170,
//     totalReused: 25,
//     overallReuseRate: 0.128
//   }
// }

// Clear all pools
manager.clearAll()

// Destroy all pools (cleanup)
manager.destroyAll()
```

## Global Manager Pattern

For app-wide access to a singleton ResourcePoolManager:

```javascript
import { getGlobalResourcePoolManager, resetGlobalResourcePoolManager } from './pool/ResourcePoolManager.js'

// Get global manager (creates if doesn't exist)
const globalManager = getGlobalResourcePoolManager()

globalManager.createVectorPool('global-vectors', Vector3, 100)

// Anywhere in code
const manager = getGlobalResourcePoolManager()
const vecPool = manager.getPool('global-vectors')
const vec = vecPool.acquire()
// use...
vecPool.release(vec)

// Cleanup (typically on app shutdown)
resetGlobalResourcePoolManager()
```

## Integration Patterns

### With Physics System

```javascript
export class PlayerPhysics {
  constructor(world) {
    const poolManager = getGlobalResourcePoolManager()

    this.vectorPool = poolManager.createVectorPool('physics-vectors', Vector3, 200)
    this.quatPool = poolManager.createQuaternionPool('physics-quats', Quaternion, 100)
    this.matrixPool = poolManager.createMatrix4Pool('physics-matrices', Matrix4, 50)
  }

  update(delta) {
    // Acquire from pool
    const velocity = this.vectorPool.acquire()
    const rotation = this.quatPool.acquire()

    // Use for calculations
    velocity.copy(this.body.velocity)
    rotation.copy(this.body.quaternion)

    // Manipulate
    velocity.multiplyScalar(delta)
    applyForce(rotation, velocity)

    // Return to pool
    this.vectorPool.release(velocity)
    this.quatPool.release(rotation)
  }

  destroy() {
    // Optional: can be cleaned up individually
    // poolManager.removePool('physics-vectors')
  }
}
```

### With Rendering System

```javascript
export class RenderSystem extends System {
  constructor(world) {
    super(world)
    const poolManager = getGlobalResourcePoolManager()

    this.matrixPool = poolManager.createMatrix4Pool('render-matrices', Matrix4, 100)
    this.vectorPool = poolManager.createVectorPool('render-vectors', Vector3, 150)
  }

  render() {
    for (const entity of this.entities) {
      // Acquire temporary matrices for transform calculations
      const worldMatrix = this.matrixPool.acquire()
      const position = this.vectorPool.acquire()

      // Calculate
      entity.getWorldMatrix(worldMatrix)
      entity.getPosition(position)

      // Render
      this.renderer.setMatrix(worldMatrix)
      this.renderer.draw(entity)

      // Return to pool
      this.matrixPool.release(worldMatrix)
      this.vectorPool.release(position)
    }
  }
}
```

### With Animation System

```javascript
export class AnimationSystem {
  constructor(world) {
    const poolManager = getGlobalResourcePoolManager()
    this.quatPool = poolManager.createQuaternionPool('animation-quats', Quaternion, 200)
  }

  interpolate(from, to, t) {
    const result = this.quatPool.acquire()
    result.slerpQuaternions(from, to, t)
    return result
  }

  releaseResult(quat) {
    this.quatPool.release(quat)
  }
}
```

### With DI Container

```javascript
// In system initialization
const poolManager = new ResourcePoolManager()
world.registerService('pools', poolManager)

// In systems
export class MySystem extends System {
  init() {
    const poolManager = this.world.getService('pools')
    this.vecPool = poolManager.createVectorPool('my-system-vectors', Vector3, 50)
  }

  update() {
    const vec = this.vecPool.acquire()
    // use...
    this.vecPool.release(vec)
  }

  destroy() {
    this.world.getService('pools').removePool('my-system-vectors')
  }
}
```

## Performance Characteristics

### Reuse Rate

The metric that matters most. Higher reuse rate = fewer allocations.

```javascript
const stats = pool.getStats()
console.log(stats.reuseRate)  // 0.95 = 95% reuse, only 5% new allocations
```

**Target Reuse Rates**:
- Physics vectors: >90% (heavily reused each frame)
- Animations: >80% (many per-frame allocations)
- Rendering matrices: >85% (transform calculations)
- Projectiles: 60-70% (varied lifetime)

### Memory Impact

```javascript
// Without pooling:
for (let i = 0; i < 1000; i++) {
  const vec = new Vector3()  // 1000 allocations per frame = GC pressure
}

// With pooling (500 pool size):
const pool = new VectorPool(Vector3, 500)
for (let i = 0; i < 1000; i++) {
  const vec = pool.acquire()  // 500 from pool, 500 new (first frame)
  // use...
  pool.release(vec)            // all returned to pool
}
// Next frame: all 1000 from pool, 0 new allocations
```

### Monitoring

```javascript
const manager = getGlobalResourcePoolManager()

// Periodic health check
setInterval(() => {
  const summary = manager.getSummary()
  console.log('Pool Health:', summary.summary)

  for (const [name, stats] of Object.entries(summary.pools)) {
    if (stats.reuseRate < 0.5) {
      console.warn(`Low reuse rate: ${name}`, stats.reuseRate)
    }
    if (stats.inUse > stats.available) {
      console.warn(`Pool running low: ${name}`, stats)
    }
  }
}, 1000)
```

## Best Practices

1. **Use Typed Pools**
   ```javascript
   // GOOD - semantic clarity
   this.vecPool = manager.createVectorPool('player-vectors', Vector3, 100)

   // BAD - generic ObjectPool less efficient
   this.vecPool = manager.createObjectPool('player-vectors', Vector3, 100)
   ```

2. **Always Release**
   ```javascript
   // GOOD - guaranteed release
   const vec = pool.acquire()
   try {
     useVector(vec)
   } finally {
     pool.release(vec)
   }

   // BAD - leak if exception
   const vec = pool.acquire()
   useVector(vec)
   pool.release(vec)
   ```

3. **Right-Size Pools**
   ```javascript
   // GOOD - match peak usage
   this.vecPool = manager.createVectorPool('vectors', Vector3, 200)
   // If you need 150 at peak, 200 is good

   // BAD - too small wastes benefits
   this.vecPool = manager.createVectorPool('vectors', Vector3, 10)
   // Will create many new objects if you use 50 simultaneously

   // BAD - too large wastes memory
   this.vecPool = manager.createVectorPool('vectors', Vector3, 1000)
   // If you only use 50, 950 sit unused
   ```

4. **Reset on Release**
   ```javascript
   // GOOD - specialized pools auto-reset
   this.vecPool.release(vec)  // Auto resets to {0,0,0}

   // GOOD - manual reset before release
   vec.x = 0; vec.y = 0; vec.z = 0
   this.vecPool.release(vec)

   // BAD - polluted state on reacquire
   const vec = pool.acquire()
   vec.x = 100  // forgot to release
   // Next acquire gets {100, 0, 0} instead of {0, 0, 0}
   ```

5. **Monitor Reuse Rates**
   ```javascript
   // GOOD - track effectiveness
   const stats = manager.getStats()
   console.assert(stats.reuseRate > 0.8, 'Low pool efficiency')

   // BAD - assume pooling helps
   // Create pools but never verify they're working
   ```

6. **Clean Up on Destroy**
   ```javascript
   // GOOD - proper cleanup
   destroy() {
     const poolManager = this.world.getService('pools')
     poolManager.removePool('my-vectors')
   }

   // BAD - pools leak
   destroy() {
     // forgot to remove pools
   }
   ```

## Files

- `src/core/utils/pool/ObjectPool.js` - Core pool implementations
- `src/core/utils/pool/ResourcePoolManager.js` - Manager and global singleton
- `RESOURCE_POOL_GUIDE.md` - This guide

## Migration from Scattered Pooling

### Before (PlayerPhysics)
```javascript
export class PlayerPhysics {
  constructor() {
    this.vectorPool = []
    for (let i = 0; i < 100; i++) {
      this.vectorPool.push(new Vector3())
    }
    this.available = [...this.vectorPool]
    this.inUse = new Set()
  }

  acquireVector() {
    if (this.available.length === 0) {
      const v = new Vector3()
      this.vectorPool.push(v)
      return v
    }
    const v = this.available.pop()
    this.inUse.add(v)
    return v
  }

  releaseVector(v) {
    this.inUse.delete(v)
    v.set(0, 0, 0)
    this.available.push(v)
  }
}
```

### After (Consolidated)
```javascript
export class PlayerPhysics {
  constructor(world) {
    const poolManager = world.getService('pools')
    this.vectorPool = poolManager.createVectorPool('player-vectors', Vector3, 100)
  }

  // Use pool directly
  update() {
    const vel = this.vectorPool.acquire()
    // use...
    this.vectorPool.release(vel)
  }
}
```

## Statistics Example

```javascript
const manager = getGlobalResourcePoolManager()
const summary = manager.getSummary()

console.log(JSON.stringify(summary, null, 2))
// {
//   "totalPools": 3,
//   "pools": {
//     "physics-vectors": {
//       "name": "physics-vectors",
//       "available": 145,
//       "inUse": 12,
//       "created": 200,
//       "reused": 1850,
//       "returned": 1850,
//       "reuseRate": 0.902
//     },
//     "animation-quats": {
//       "name": "animation-quats",
//       "available": 48,
//       "inUse": 2,
//       "created": 50,
//       "reused": 320,
//       "returned": 320,
//       "reuseRate": 0.865
//     },
//     "render-matrices": {
//       "name": "render-matrices",
//       "available": 18,
//       "inUse": 2,
//       "created": 20,
//       "reused": 240,
//       "returned": 240,
//       "reuseRate": 0.923
//     }
//   },
//   "summary": {
//     "totalAvailable": 211,
//     "totalInUse": 16,
//     "totalCreated": 270,
//     "totalReused": 2410,
//     "overallReuseRate": 0.899
//   }
// }
```

## Next Steps

1. Integrate ResourcePoolManager into World/DI container
2. Migrate PlayerPhysics to use central manager
3. Migrate rendering systems to use central pools
4. Add animation pool creation in animation systems
5. Monitor pool health in production
6. Tune pool sizes based on metrics
7. Implement adaptive pool sizing (grow/shrink based on usage)
8. Add memory profiling tools for pool analysis

## Benefits

- ✅ Zero garbage collection during gameplay
- ✅ Consistent memory usage (no allocation spikes)
- ✅ Reduced CPU usage (no allocation overhead)
- ✅ Centralized pool management
- ✅ Shared pools across systems
- ✅ Performance monitoring built-in
- ✅ Automatic reuse tracking
- ✅ Typed pools for safety
- ✅ Global singleton for easy access
- ✅ Works with DI container
