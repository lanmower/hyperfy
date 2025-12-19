# SharedVectorPool Pattern

## Overview
SharedVectorPool is a centralized utility for managing reusable Vector3 and Quaternion instances across the codebase. This replaces scattered manual pool creation with a consistent, cached approach.

## Implementation

### Location
- **Utility**: `src/core/utils/SharedVectorPool.js`
- **Export**: Available via `src/core/utils/index.js`

### API

```javascript
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2, v3, v4, q1, q2 } = SharedVectorPool('MySystem', 4, 2)
```

**Parameters:**
- `name` (string): Unique identifier for this pool (used for caching)
- `vectorCount` (number): Number of Vector3 instances (creates v1, v2, v3, etc.)
- `quaternionCount` (number): Number of Quaternion instances (creates q1, q2, q3, etc.)

**Returns:**
Object with numbered properties (v1-vN, q1-qN)

## Benefits

1. **Deduplication**: Same name returns cached pool instance
2. **Consistency**: Standardized naming (v1, v2, v3 / q1, q2, q3)
3. **Performance**: No duplicate pool creation
4. **Clarity**: Explicit declaration of pool requirements

## Migration Example

### Before (PlayerPhysics.js)
```javascript
import * as THREE from '../../extras/three.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
```

### After (PlayerPhysics.js)
```javascript
import * as THREE from '../../extras/three.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2, v3, v4 } = SharedVectorPool('PlayerPhysics', 4, 0)
```

## Systems Ready for Migration

The following systems currently use manual pool creation and can be migrated:

1. **PlayerInputProcessor.js** - Uses v1, q1 (1 vector, 1 quaternion, 1 euler)
2. **PlayerPlatformTracker.js** - Uses v1-v6, q1-q4, m1-m3, e1 (6 vectors, 4 quaternions)

### PlayerInputProcessor Migration
```javascript
// Current
const v1 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

// Migrated
const { v1, q1 } = SharedVectorPool('PlayerInputProcessor', 1, 1)
```

### PlayerPlatformTracker Migration
```javascript
// Current
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
// ... v3-v6
const q1 = new THREE.Quaternion()
// ... q2-q4

// Migrated
const { v1, v2, v3, v4, v5, v6, q1, q2, q3, q4 } = SharedVectorPool('PlayerPlatformTracker', 6, 4)
```

**Note**: Matrix4 and Euler pools are not yet supported by SharedVectorPool. These can be added if needed.

## Guidelines

1. Use descriptive pool names matching the system/class name
2. Only request the pools you actually use
3. Keep pools at module scope for performance
4. Do not modify pool instances outside your module scope
5. Remember: These are reusable instances - reset state before use
