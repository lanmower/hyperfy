# Circular Import Fix Guide (If Needed)

## Quick Summary

Found 1 circular import: `Node.js ↔ ProxyFactory.js`

Status: SAFE (lazy initialization), but can be eliminated in 2 minutes if desired.

---

## Fix: Extract Utilities to Eliminate Circular Dependency

### Step 1: Create New Utility File

**File:** `src/core/nodes/utils/RefUtilities.js`

```javascript
export const secure = { allowRef: false }

export function getRef(pNode) {
  if (!pNode || !pNode._isRef) return pNode
  secure.allowRef = true
  const node = pNode._ref
  secure.allowRef = false
  return node
}

export function secureRef(obj = {}, getRefFn) {
  const tpl = {
    get _ref() {
      if (!secure.allowRef) return null
      return getRefFn()
    },
  }
  obj._isRef = true
  Object.defineProperty(obj, '_ref', Object.getOwnPropertyDescriptor(tpl, '_ref'))
  return obj
}
```

### Step 2: Update Node.js

**Remove lines 21-40** from `src/core/nodes/Node.js`:

```javascript
// DELETE THESE LINES:
// export const secure = { allowRef: false }
// export function getRef(pNode) { ... }
// export function secureRef(obj = {}, getRef) { ... }
```

**Add this import at the top:**

```javascript
// src/core/nodes/Node.js - ADD THIS LINE after other imports
import { secureRef } from './utils/RefUtilities.js'
```

**Updated imports section:**
```javascript
import { isBoolean } from 'lodash-es'
import * as THREE from '../extras/three.js'
import { v, q, m } from '../utils/TempVectors.js'
import { TransformSystem } from './base/TransformSystem.js'
import { LifecycleManager } from './base/LifecycleManager.js'
import { ProxyFactory } from './base/ProxyFactory.js'
import { secureRef } from './utils/RefUtilities.js'  // ADD THIS
```

### Step 3: Update ProxyFactory.js

**Replace line 1:**

```javascript
// OLD:
import { getRef, secure } from '../Node.js'

// NEW:
import { getRef, secure } from '../utils/RefUtilities.js'
```

### Step 4: Update All Other Files

Update imports in these 5 files to use the new utility location:

**src/core/entities/App.js**
```javascript
// Change from:
import { getRef } from '../nodes/Node.js'

// To:
import { getRef } from '../nodes/utils/RefUtilities.js'
```

**src/core/nodes/Collider.js**
```javascript
// Change from:
import { getRef, Node, secureRef } from './Node.js'

// To:
import { Node } from './Node.js'
import { getRef, secureRef } from './utils/RefUtilities.js'
```

**src/core/nodes/LOD.js**
```javascript
// Change from:
import { getRef, Node } from './Node.js'

// To:
import { Node } from './Node.js'
import { getRef } from './utils/RefUtilities.js'
```

**src/core/nodes/Mesh.js**
```javascript
// Change from:
import { Node, getRef, secureRef } from './Node.js'

// To:
import { Node } from './Node.js'
import { getRef, secureRef } from './utils/RefUtilities.js'
```

**src/core/nodes/Prim.js**
```javascript
// Change from:
import { Node, secureRef } from './Node'

// To:
import { Node } from './Node.js'
import { secureRef } from './utils/RefUtilities.js'
```

---

## Summary of Changes

| File | Change | Type |
|------|--------|------|
| `src/core/nodes/utils/RefUtilities.js` | Create new file | New |
| `src/core/nodes/Node.js` | Remove getRef/secureRef, add import | Modify |
| `src/core/nodes/base/ProxyFactory.js` | Change import source | Modify |
| `src/core/entities/App.js` | Update import path | Modify |
| `src/core/nodes/Collider.js` | Update import path | Modify |
| `src/core/nodes/LOD.js` | Update import path | Modify |
| `src/core/nodes/Mesh.js` | Update import path | Modify |
| `src/core/nodes/Prim.js` | Update import path | Modify |

**Total files modified:** 8 (1 new, 7 existing)

---

## Verification

After making changes, verify:

1. **No syntax errors:** `npm run build` should complete without errors
2. **No runtime errors:** Start dev server and check console
3. **Proxy system works:** Create and interact with nodes in scripts
4. **All tests pass:** `npm test` (if applicable)

---

## Why This Fix Works

1. **Eliminates circular dependency:** getRef/secureRef no longer imported from Node
2. **Maintains functionality:** Utilities work exactly the same from new location
3. **Clean separation:** Proxy utilities are now independent modules
4. **Minimal changes:** Only import statements modified, no logic changes

---

## Alternative: Do Nothing

If you prefer to keep the current structure:

- **Status:** Working perfectly, no issues
- **Trade-off:** Circular import exists but is safe
- **Document it:** Add comment in Node.js line 6:
  ```javascript
  // Note: ProxyFactory imports from this module (circular dependency).
  // This is safe because ProxyFactory only uses exports at runtime, not at module load.
  import { ProxyFactory } from './base/ProxyFactory.js'
  ```

---

## Recommendation

**Option 1 (Recommended):** Make the refactoring
- Takes ~2 minutes
- Eliminates circular dependency
- Makes module graph cleaner
- Better for long-term maintainability

**Option 2:** Accept as-is
- Works perfectly now
- Circular import is documented as safe
- Low risk, minimum effort
- Standard pattern in many codebases

Choose based on your project's standards for code structure.
