# Comprehensive Error Handling Framework

## Overview

This framework systematically handles errors across the Hyperfy system to prevent cascading failures and provide clear error reporting. The 30+ error commits in December identified a critical need for standardized error handling - this framework addresses that systematically.

## File Structure

```
src/core/systems/error/
  ├── ErrorCodes.js           - Error classification system
  ├── ValidationHelper.js      - Input validation utilities
  ├── ErrorBoundary.js         - Boundary protection wrapper
  └── ErrorRecoveryPattern.js  - System recovery pattern factory
```

## Part 1: Error Classification (ErrorCodes.js)

### Error Categories

All errors are classified by type and severity:

```javascript
ErrorCodes = {
  INPUT_VALIDATION:     { severity: 'high',   category: 'validation' }
  RESOURCE_NOT_FOUND:   { severity: 'high',   category: 'resource' }
  INVALID_STATE:        { severity: 'high',   category: 'state' }
  NETWORK_FAILURE:      { severity: 'high',   category: 'network' }
  PHYSICS_ERROR:        { severity: 'medium', category: 'physics' }
  SCRIPT_ERROR:         { severity: 'medium', category: 'script' }
  TYPE_MISMATCH:        { severity: 'high',   category: 'validation' }
  NULL_REFERENCE:       { severity: 'high',   category: 'reference' }
  RESOURCE_LIMIT:       { severity: 'medium', category: 'resource' }
  PERMISSION_DENIED:    { severity: 'high',   category: 'auth' }
  OPERATION_NOT_SUPPORTED: { severity: 'medium', category: 'operation' }
}
```

### HyperfyError Class

All errors are wrapped in HyperfyError for consistent handling:

```javascript
try {
  throw new HyperfyError('NULL_REFERENCE', 'Entity is null', {
    operation: 'spawn',
    entityType: 'player'
  })
} catch (e) {
  console.error(e.code)           // 'NULL_REFERENCE'
  console.error(e.message)        // '[NULL_REFERENCE] Entity is null'
  console.error(e.errorInfo)      // { code, severity, category }
  console.error(e.context)        // { operation, entityType }
  console.error(e.toJSON())       // Serializable error representation
}
```

## Part 2: Input Validation (ValidationHelper.js)

### Standard Validation Methods

```javascript
import ValidationHelper from '../error/ValidationHelper.js'

// Basic assertions
ValidationHelper.assertNotNull(entity, 'entity')
ValidationHelper.assertType(value, 'string', 'paramName')
ValidationHelper.assertIsNumber(value, 'paramName')
ValidationHelper.assertIsArray(value, 'paramName')
ValidationHelper.assertIsString(value, 'paramName')
ValidationHelper.assertIsObject(value, 'paramName')

// THREE.js specific
ValidationHelper.assertIsVector3(vector, 'origin')

// Entity/Blueprint validation
ValidationHelper.assertEntityValid(entity, { operation: 'spawn' })
ValidationHelper.assertBlueprintValid(blueprint)
ValidationHelper.assertNodeValid(node)
ValidationHelper.validateEntityOperation(entity, 'add', context)

// Range validation
ValidationHelper.validateNumberInRange(value, min, max, 'paramName')

// String validation
ValidationHelper.validateNonEmptyString(value, 'paramName')

// File validation
ValidationHelper.validateFileType(url, ['glb', 'gltf'], context)

// Server-only operations
ValidationHelper.assertWebsocket(isServer, 'sendTo')
```

### Example: Validating API Methods

```javascript
// Before: No validation
create: (apps, entity, name, data) => {
  const skyNode = new NodeClasses.sky({})
  const proxy = skyNode.getProxy?.() || skyNode
  return proxy
}

// After: With validation
create: (apps, entity, name, data) => {
  try {
    ValidationHelper.assertEntityValid(entity, { operation: 'create', nodeName: name })
    ValidationHelper.assertIsString(name, 'name', { operation: 'create' })

    if (!entity.createNode || typeof entity.createNode !== 'function') {
      throw new HyperfyError('INVALID_STATE', 'Entity does not support createNode', {
        operation: 'create',
        nodeName: name,
      })
    }

    if (name === 'sky') {
      const skyNode = new NodeClasses.sky({})
      const ctx = { world: apps.world, entity }
      skyNode.ctx = ctx
      const proxy = skyNode.getProxy?.() || skyNode
      return proxy
    }

    const node = entity.createNode(name, data)
    return node.getProxy?.() || node
  } catch (e) {
    console.error('[AppAPIConfig.create]', e.message)
    return null
  }
}
```

## Part 3: Error Boundaries (ErrorBoundary.js)

### Wrapping Operations

```javascript
const boundary = new ErrorBoundary({ name: 'MySystem' })

// Sync operations
boundary.wrap(
  () => performRiskyOperation(),
  () => fallbackValue,  // Called on error
  { operationName: 'doSomething' }
)

// Async operations
await boundary.wrapAsync(
  async () => await fetchData(),
  async (error) => {
    console.log('Fetch failed, using default')
    return defaultData
  }
)

// Fallback pattern
const result = boundary.withFallback(
  () => risky Operation(),
  defaultValue
)

// Query errors
const errors = boundary.getErrors('high')  // Filter by severity
const lastError = boundary.getLastError()
boundary.clearErrors()
```

## Part 4: System Integration (ErrorRecoveryPattern.js)

### Setting Up Error Handling in a System

```javascript
import ErrorRecoveryPattern from '../error/ErrorRecoveryPattern.js'

export class MySystem {
  constructor(world) {
    this.world = world

    // Setup error handling
    this.errorContext = ErrorRecoveryPattern.setupSystemErrorHandling(
      this,
      'MySystem'
    )

    // Register custom recovery strategies
    this.errorContext.registerRecovery('PHYSICS_ERROR', (error, context) => {
      console.warn(`Physics failed in ${context.operation}, falling back to defaults`)
      return createDefaultPhysicsObject()
    })

    this.errorContext.registerRecovery('SCRIPT_ERROR', (error, context) => {
      console.error(`Script failed: ${error.message}`)
      this.world.events.emit('scriptError', { error, context })
      return null
    })
  }

  riskyOperation() {
    return this.errorContext.withRecovery(
      () => {
        if (!this.world.physics) {
          throw new HyperfyError('INVALID_STATE', 'Physics not available')
        }
        return this.world.physics.simulate()
      },
      'simulate',        // operation name
      () => null         // fallback value
    )
  }

  async loadResource(url) {
    return await this.errorContext.withAsyncRecovery(
      async () => {
        const data = await fetch(url).then(r => r.json())
        return data
      },
      'loadResource',
      async () => ({})   // fallback
    )
  }

  getRecentErrors() {
    return this.errorContext.getErrors()
  }
}
```

## Critical Boundaries Protected

### 1. AppAPIConfig (src/core/systems/apps/AppAPIConfig.js)

**Validates all app-level operations:**

- Getters: Entity existence, blueprint loading, transform validity
- Setters: Type checking (boolean for keepActive, object for state)
- Methods:
  - `on/off`: Event name validation, callback type checking
  - `send/sendTo`: Event name (internal event block), network availability
  - `emit`: Event name validation, event system availability
  - `create`: Node type validation, entity support checking
  - `control`: Options object validation, control system availability
  - `configure`: Field array validation, field object integrity
  - `add/remove`: Node reference validation, entity root initialization
  - `traverse`: Callback validation, root existence
  - `clean`: Root initialization checking

**Fallback Behavior:**
- Getters return safe defaults (null, {}, false, new THREE.Vector3())
- Methods catch errors and log, preventing operation but not crashing

### 2. WorldAPIConfig (src/core/systems/apps/WorldAPIConfig.js)

**Validates world-level operations:**

- Getters: Network system availability, entity validity
- Methods:
  - `add/remove/attach`: Node reference validation, hierarchy checks
  - `on/off`: Event name validation
  - `emit`: Event name validation, event system availability
  - `getTime/getTimestamp`: Network/moment availability
  - `chat`: Message validation, chat system availability
  - `getPlayer/getPlayers`: Entity validation
  - `createLayerMask`: Layer group validation
  - `raycast`: Vector3 type checking, number range validation
  - `overlapSphere`: Type and range validation
  - `get/set`: Key string validation
  - `open`: URL validation, URL resolution
  - `load`: Type and URL validation, loader system availability
  - `getQueryParam/setQueryParam`: Key validation, browser context

**Fallback Behavior:**
- Returns empty arrays for list operations
- Returns null for single-value queries
- Fails silently for state operations (get/set, open)

### 3. ScriptExecutor (src/core/entities/app/ScriptExecutor.js)

**Comprehensive error handling for script execution:**

- Parse phase: Invalid script code or format
- Execution phase: Runtime errors during script execution
- Hook registration: Failed listener setup
- Lifecycle hooks:
  - `onLoad`: Initialization errors
  - `fixedUpdate`: Per-frame physics errors
  - `update`: Per-frame update errors
  - `lateUpdate`: Per-frame late update errors
  - `onUnload`: Cleanup errors

**Error Recording:**
```javascript
// Each error recorded with:
{
  timestamp: Date.now(),
  phase: 'parse' | 'execution' | 'onLoad' | 'fixedUpdate' | 'update' | 'lateUpdate' | 'cleanup',
  message: string,
  code: string,
  stack: string,
  appId: string
}

// Access via:
executor.getErrors()              // All errors
executor.getErrors('execution')   // Errors by phase
executor.getLastError()           // Most recent
executor.clearErrors()            // Reset
```

**Fallback Behavior:**
- Parse errors: Script not executed, no operation
- Execution errors: App context not created, operation fails gracefully
- Hook errors: Logged but don't prevent further execution
- Cleanup errors: All listeners deregistered in finally block

## Implementation Checklist

### For New Systems

```javascript
// 1. Setup error handling in constructor
this.__errorContext = ErrorRecoveryPattern.setupSystemErrorHandling(
  this,
  'SystemName'
)

// 2. Register custom recovery strategies
this.__errorContext.registerRecovery('CUSTOM_ERROR', customRecoveryFn)

// 3. Wrap risky operations
const result = this.__errorContext.withRecovery(
  () => riskyOperation(),
  'operationName',
  fallbackValue
)

// 4. Always validate inputs
ValidationHelper.assertNotNull(param, 'param')
```

### For Existing Systems

```javascript
// 1. Replace ad-hoc null checks with ValidationHelper
// Before:
if (!entity) return console.error('Entity missing')

// After:
try {
  ValidationHelper.assertEntityValid(entity, { operation: 'spawn' })
  // ... rest of operation
} catch (e) {
  console.error(e.message)
}

// 2. Replace try-catch with HyperfyError
// Before:
try {
  riskyOp()
} catch (e) {
  console.error('Error:', e)
}

// After:
try {
  riskyOp()
} catch (e) {
  const hyperfyError = e instanceof HyperfyError ? e :
    new HyperfyError('OPERATION_NOT_SUPPORTED', e.message)
  console.error(hyperfyError.code, ':', hyperfyError.message)
}

// 3. Add fallback returns
// Before:
doRiskyThing()

// After:
const result = boundary.withFallback(
  () => doRiskyThing(),
  defaultValue
)
return result
```

## Testing Error Scenarios

### Unit Tests (Example Pattern)

```javascript
describe('ErrorHandling', () => {
  test('AppAPIConfig.create validates entity', () => {
    const config = AppAPIConfig
    const result = config.methods.create(
      { world: { events: {} } },
      null,  // Invalid entity
      'sky',
      {}
    )
    expect(result).toBeNull()
  })

  test('ValidationHelper throws on null', () => {
    expect(() => {
      ValidationHelper.assertNotNull(null, 'value')
    }).toThrow(HyperfyError)
  })

  test('ErrorBoundary catches and logs', () => {
    const boundary = new ErrorBoundary({ name: 'Test' })
    const result = boundary.wrap(
      () => { throw new Error('test') },
      () => 'fallback'
    )
    expect(result).toBe('fallback')
    expect(boundary.getLastError()).toBeDefined()
  })
})
```

## Migration Path

### Phase 1: Core Systems (Week 1)
- AppAPIConfig
- WorldAPIConfig
- ScriptExecutor
- EntitySpawner

### Phase 2: Asset Systems (Week 2)
- ClientLoader / ServerLoader
- AssetHandlerRegistry
- BlueprintLoader

### Phase 3: Network Systems (Week 3)
- ClientNetwork / ServerNetwork
- WebSocketManager
- PacketCodec

### Phase 4: Physics Systems (Week 4)
- Physics
- PhysicsActorManager
- PhysicsCallbackManager

## Preventing Future Errors

### Code Review Checklist

When reviewing code, check for:

1. **Input Validation**
   - All public methods validate inputs using ValidationHelper
   - Null/undefined checks present for required parameters
   - Type mismatches caught before use

2. **Error Context**
   - Operations include operation name in context
   - Relevant data included for debugging
   - Error code indicates category

3. **Fallback Behavior**
   - Graceful degradation when errors occur
   - Safe defaults returned
   - No silent failures (always log)

4. **State Consistency**
   - Errors don't leave system in invalid state
   - Cleanup happens in finally blocks
   - Listeners are removed before error

5. **Error Recording**
   - Recent errors accessible for debugging
   - Max error limit prevents memory leaks
   - Timestamps enable debugging timeline

### Common Patterns to Avoid

```javascript
// DON'T: Silent failures
function process(data) {
  if (!data) return  // No log, hard to debug
}

// DO: Log and provide context
function process(data) {
  try {
    ValidationHelper.assertNotNull(data, 'data', { operation: 'process' })
  } catch (e) {
    console.error('[System.process]', e.message)
    return null
  }
}

// DON'T: Catching all errors the same way
try {
  riskyOp()
} catch (e) {
  console.error('Failed')  // Lost error details
}

// DO: Preserve error context
try {
  riskyOp()
} catch (e) {
  const hyperfyError = e instanceof HyperfyError ? e :
    new HyperfyError('OPERATION_NOT_SUPPORTED', e.message)
  console.error(`[Operation] ${hyperfyError.code}: ${hyperfyError.message}`)
}

// DON'T: Assuming optional systems exist
world.physics.raycast(...)  // Crashes if physics not available

// DO: Check before using
try {
  if (!apps?.world?.physics) {
    throw new HyperfyError('INVALID_STATE', 'Physics system not available')
  }
  return apps.world.physics.raycast(...)
} catch (e) {
  console.error(e.message)
  return null
}
```

## Performance Considerations

- Error recording limited to 50-100 most recent errors per system
- Boundary wrapping has minimal overhead (try-catch cost)
- ValidationHelper checks only on entry to critical operations
- No performance regression for non-error paths

## Debugging with Error Framework

### In Browser Console

```javascript
// Check for recent errors
window.__DEBUG__.appBuildErrors?.()

// Get specific error type
const scriptErrors = window.__DEBUG__.appBuildErrors?.('SCRIPT_ERROR')

// Inspect error details
const lastError = window.__DEBUG__.appBuildErrors?.()[0]
console.log(lastError.toJSON())
```

### Server-Side

```javascript
// In system logs
system.__errorContext.getErrors('high')

// Export error report
const errorReport = system.__errorContext.getErrors()
  .map(e => e.toJSON())
console.table(errorReport)
```

## Summary

This framework provides:

1. **Systematic error classification** - Know what type of error occurred
2. **Consistent validation** - Catch bad input at boundaries
3. **Graceful degradation** - Errors don't cascade
4. **Error recovery** - Systems can define custom recovery strategies
5. **Error visibility** - Recent errors accessible for debugging
6. **Developer safety** - Hard to silently fail

By applying this framework systematically, we eliminate the need for ad-hoc defensive guards and instead have a coherent error handling strategy across all systems.
