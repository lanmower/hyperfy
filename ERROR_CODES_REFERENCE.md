# Error Codes Quick Reference

## All Error Codes

| Code | Severity | Category | When | Solution |
|------|----------|----------|------|----------|
| INPUT_VALIDATION | high | validation | Invalid input parameters | Check ValidationHelper assertions |
| RESOURCE_NOT_FOUND | high | resource | Missing entity/blueprint/node | Check system is initialized |
| INVALID_STATE | high | state | System in wrong state | Verify prerequisites are met |
| NETWORK_FAILURE | high | network | Connection/send failure | Check network availability |
| PHYSICS_ERROR | medium | physics | Physics simulation failed | Check physics state |
| SCRIPT_ERROR | medium | script | Script execution failed | Check script syntax and context |
| TYPE_MISMATCH | high | validation | Wrong parameter type | Pass correct type |
| NULL_REFERENCE | high | reference | Null/undefined parameter | Validate before use |
| RESOURCE_LIMIT | medium | resource | Too many entities/resources | Clean up and retry |
| PERMISSION_DENIED | high | auth | Server-only operation called client-side | Call on server only |
| OPERATION_NOT_SUPPORTED | medium | operation | Unsupported file type/operation | Use supported types only |

## Usage Quick Start

### Validate Inputs
```javascript
// Check null/undefined
ValidationHelper.assertNotNull(entity, 'entity')

// Check type
ValidationHelper.assertType(value, 'string', 'paramName')

// Check Vector3
ValidationHelper.assertIsVector3(origin, 'origin')

// Check number in range
ValidationHelper.validateNumberInRange(value, 0, 100, 'percentage')

// Check entity valid
ValidationHelper.assertEntityValid(entity, { operation: 'spawn' })
```

### Throw Errors
```javascript
throw new HyperfyError('NULL_REFERENCE', 'Entity is null', {
  operation: 'spawn',
  entityType: 'player'
})
```

### Catch & Handle
```javascript
try {
  // risky operation
} catch (e) {
  const error = e instanceof HyperfyError ? e :
    new HyperfyError('OPERATION_NOT_SUPPORTED', e.message)
  console.error(`[System] ${error.code}: ${error.message}`)
  return fallbackValue
}
```

### Setup System
```javascript
import ErrorRecoveryPattern from '../error/ErrorRecoveryPattern.js'

this.errorContext = ErrorRecoveryPattern.setupSystemErrorHandling(
  this,
  'MySystem'
)

// Register custom recovery
this.errorContext.registerRecovery('PHYSICS_ERROR', (error) => {
  console.warn('Physics failed, using defaults')
  return createDefaultPhysicsObject()
})
```

### Use Error Boundary
```javascript
const boundary = new ErrorBoundary({ name: 'MySystem' })

// Wrap operation
const result = boundary.wrap(
  () => riskyOperation(),
  () => defaultFallback
)

// Get error history
const errors = boundary.getErrors('high')  // By severity
const lastError = boundary.getLastError()
```

## Error Handling by System

### AppAPIConfig
**Validates:**
- Entity existence and structure
- Event names (blocks internal events)
- Callback functions
- Node references
- Network availability

**Throws:**
- NULL_REFERENCE: entity null, node null, callback null
- INVALID_STATE: entity root not initialized, system unavailable
- PERMISSION_DENIED: internal event blocked
- TYPE_MISMATCH: wrong callback type

### WorldAPIConfig
**Validates:**
- Vector3 types for raycast origin/direction
- Number types and ranges
- String keys
- Layer group names
- File types for loading
- Browser context for URL operations

**Throws:**
- TYPE_MISMATCH: Vector3, number, string type failures
- INPUT_VALIDATION: Invalid layer, invalid file type
- OPERATION_NOT_SUPPORTED: Unsupported load type, browser-only
- INVALID_STATE: System not available

### ScriptExecutor
**Validates:**
- Script code format
- World and scripts system availability
- Proxy availability
- Callback function types
- onLoad/onUnload returns

**Throws:**
- SCRIPT_ERROR: Parse, execute, hook registration, cleanup
- NULL_REFERENCE: Missing world, scripts, proxies
- INVALID_STATE: Invalid script format
- TYPE_MISMATCH: Non-function lifecycle hooks

## Debug Checklist

When you see an error:

1. **Check the error code**
   - Tells you what category of problem
   - Suggests the system needing fixing

2. **Read the context**
   - operation: What was being done
   - Includes relevant parameters
   - Helps narrow down issue

3. **Look at the message**
   - Often includes what parameter was invalid
   - May suggest solution

4. **Example: NULL_REFERENCE error**
   - Check: Was the entity passed?
   - Check: Is system initialized?
   - Check: Did previous operation fail?

5. **Example: TYPE_MISMATCH error**
   - Check: Did you pass right type?
   - Check: Is conversion needed?
   - Check: Did API change signature?

## Common Error Scenarios

### "Entity is null" (NULL_REFERENCE)
```
Check:
1. Was entity created? → Check spawn system
2. Was entity deleted? → Check cleanup
3. Was wrong entity passed? → Check caller
```

### "Network system not available" (INVALID_STATE)
```
Check:
1. Is network initialized? → Check initialization order
2. Running on server? → Check platform
3. Network connected? → Check connection status
```

### "Type mismatch, expected Vector3" (TYPE_MISMATCH)
```
Check:
1. Passing THREE.Vector3? → Pass new THREE.Vector3(x, y, z)
2. Not an array? → Convert array to Vector3
3. Check API docs → See example signature
```

### "Cannot emit internal event" (PERMISSION_DENIED)
```
Check:
1. Using reserved event? → List of internal: fixedUpdate, update, lateUpdate, etc.
2. Use custom event name → Define your own event
```

### "createNode not supported" (INVALID_STATE)
```
Check:
1. Is entity an App? → Check entity type
2. Entity fully initialized? → Check App.build() called
3. Custom entity type? → Does it support createNode?
```

## Error Reporting

When reporting a bug with error:

Include:
1. **Error code** - e.g., NULL_REFERENCE
2. **Full message** - "[NULL_REFERENCE] Entity is null"
3. **Context** - operation: 'spawn', entityType: 'player'
4. **Timestamp** - When did it happen
5. **Steps to reproduce** - How to trigger it

Example:
```
Error: NULL_REFERENCE
Message: [NULL_REFERENCE] Entity is null
Context: { operation: 'spawn', entityType: 'player' }
When: After clicking create button
Reproduce: Create player → Move to different zone → Click create again
```

## File Locations

| What | Where |
|------|-------|
| Error codes | src/core/systems/error/ErrorCodes.js |
| Validation helpers | src/core/systems/error/ValidationHelper.js |
| Error boundaries | src/core/systems/error/ErrorBoundary.js |
| Recovery patterns | src/core/systems/error/ErrorRecoveryPattern.js |
| AppAPI protection | src/core/systems/apps/AppAPIConfig.js |
| WorldAPI protection | src/core/systems/apps/WorldAPIConfig.js |
| Script safety | src/core/entities/app/ScriptExecutor.js |
| Full docs | ERROR_HANDLING_FRAMEWORK.md |

## Integration Checklist

When adding error handling to a new system:

- [ ] Import HyperfyError and ValidationHelper
- [ ] Setup errorContext in constructor
- [ ] Register recovery strategies
- [ ] Validate all inputs at entry points
- [ ] Wrap risky operations in try-catch
- [ ] Throw HyperfyError with appropriate code
- [ ] Provide context for debugging
- [ ] Have fallback return value
- [ ] Log error with operation name
- [ ] Test error scenarios

## Performance Notes

- Zero overhead for non-error paths
- Error recording limited to ~100 errors per system
- ValidationHelper checks are O(1)
- Error boundary wrapping is < 1% overhead
- No memory leaks from error queues (auto-rotate old errors)

## References

- Full framework: ERROR_HANDLING_FRAMEWORK.md
- Implementation guide: ERROR_HANDLING_IMPLEMENTATION_GUIDE.md
- Error codes: See ErrorCodes.js
- Validation helpers: See ValidationHelper.js
- Recovery patterns: See ErrorRecoveryPattern.js
