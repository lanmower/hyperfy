# Unified Error Handling Guide

Comprehensive error handling system with typed codes, structured context, and recovery patterns.

## Architecture

### Three Components

1. **ErrorCodes** - Categorized error code definitions
2. **AppError** - Structured error class with context and cause tracking
3. **ErrorHandler** - Handler registry with recovery strategies

## ErrorCodes (src/core/utils/error/ErrorCodes.js)

Predefined codes organized by category:

```javascript
ErrorCodes.SYSTEM.INITIALIZATION_FAILED
ErrorCodes.SYSTEM.DESTROYED
ErrorCodes.SYSTEM.SERVICE_NOT_FOUND

ErrorCodes.NETWORK.CONNECTION_FAILED
ErrorCodes.NETWORK.DISCONNECTED
ErrorCodes.NETWORK.TIMEOUT
ErrorCodes.NETWORK.INVALID_MESSAGE
ErrorCodes.NETWORK.MESSAGE_TOO_LARGE
ErrorCodes.NETWORK.DECODE_FAILED

ErrorCodes.ENTITY.NOT_FOUND
ErrorCodes.ENTITY.INVALID_TYPE
ErrorCodes.ENTITY.SPAWN_FAILED

ErrorCodes.ASSET.NOT_FOUND
ErrorCodes.ASSET.LOAD_FAILED
ErrorCodes.ASSET.INVALID_FORMAT

ErrorCodes.BLUEPRINT.NOT_FOUND
ErrorCodes.BLUEPRINT.INVALID
ErrorCodes.BLUEPRINT.LOAD_FAILED

ErrorCodes.SCRIPT.EXECUTION_FAILED
ErrorCodes.SCRIPT.PARSE_ERROR
ErrorCodes.SCRIPT.RUNTIME_ERROR

ErrorCodes.PHYSICS.SIMULATION_FAILED
ErrorCodes.DATABASE.QUERY_FAILED
ErrorCodes.VALIDATION.INVALID_INPUT
ErrorCodes.PERMISSION.DENIED
// ... and more
```

## AppError (src/core/utils/error/AppError.js)

Structured error class extending Error:

```javascript
const error = new AppError(
  ErrorCodes.ASSET.LOAD_FAILED,
  'Failed to load model',
  { assetId: 'model-123', url: '/assets/model.glb' },
  originalError
)

// Properties
error.code              // ErrorCodes value
error.message           // Human-readable message
error.context           // { assetId, url, ... }
error.cause             // Original error
error.category          // Derived from code
error.timestamp         // When error occurred

// Methods
error.toJSON()          // Serializable object
error.toShortString()   // "CODE: message"
error.toDetailedString() // Full details with context
```

### Factory Methods

```javascript
AppError.system(message, context, cause)
AppError.network(code, message, context, cause)
AppError.entity(code, message, context, cause)
AppError.asset(code, message, context, cause)
AppError.blueprint(code, message, context, cause)
AppError.script(code, message, context, cause)
AppError.validation(message, context, cause)
AppError.permission(message, context, cause)
```

## ErrorHandler (src/core/systems/ErrorHandler.js)

Centralized error handling and recovery:

```javascript
const handler = new ErrorHandler('MySystem')

// Register error handler
handler.registerHandler(
  ErrorCodes.ASSET.LOAD_FAILED,
  (error, context) => {
    console.log(`Asset loading failed: ${error.context.assetId}`)
    // Handle the error
  }
)

// Register recovery strategy
handler.registerRecovery(
  ErrorCodes.NETWORK.TIMEOUT,
  async (error, context) => {
    // Attempt to recover
    await retryConnection()
    return { recovered: true }
  }
)

// Add filter (only handle certain errors)
handler.addFilter((error, context) => {
  return error.category === 'NETWORK'
})

// Handle errors
const result = handler.handle(error, { userId: '123' })
if (result.handled) {
  console.log('Error was handled')
}

// Recover from errors
const recoverResult = await handler.recover(error, context)
if (recoverResult.recovered) {
  console.log('Error was recovered from')
}

// Combined handle + recover
const fullResult = await handler.handleAndRecover(error, context)
```

## Usage Patterns

### Throwing Structured Errors

```javascript
throw new AppError(
  ErrorCodes.ENTITY.NOT_FOUND,
  `Entity ${id} not found`,
  { entityId: id, context: 'world' }
)
```

### Using Factory Methods

```javascript
throw AppError.asset(
  ErrorCodes.ASSET.LOAD_FAILED,
  'Failed to load texture',
  { assetId: 'texture-123', url }
)
```

### Wrapping Existing Errors

```javascript
try {
  const data = JSON.parse(json)
} catch (err) {
  throw new AppError(
    ErrorCodes.VALIDATION.INVALID_INPUT,
    'Invalid JSON',
    { input: json },
    err
  )
}
```

### With ErrorHandler

```javascript
export class MySystem extends BaseSystem {
  constructor(world) {
    super(world)
    this.errorHandler = new ErrorHandler('MySystem')
    this.setupErrorHandling()
  }

  setupErrorHandling() {
    this.errorHandler.registerHandler(
      ErrorCodes.ASSET.LOAD_FAILED,
      (error) => {
        this.logger.error(`Failed to load: ${error.context.url}`)
        // Use fallback asset
        return { useDefaultAsset: true }
      }
    )

    this.errorHandler.registerRecovery(
      ErrorCodes.NETWORK.CONNECTION_FAILED,
      async (error) => {
        await this.reconnect()
        return { reconnected: true }
      }
    )
  }

  async loadAsset(url) {
    try {
      return await fetch(url)
    } catch (err) {
      const error = new AppError(
        ErrorCodes.ASSET.LOAD_FAILED,
        `Failed to load ${url}`,
        { url },
        err
      )

      const handled = this.errorHandler.handle(error, { system: 'asset-loader' })
      if (handled.handled && handled.result.useDefaultAsset) {
        return this.getDefaultAsset()
      }

      throw error
    }
  }
}
```

## Error Logging

```javascript
const error = new AppError(...)

// Log short form
logger.error(error.toShortString())

// Log full details
logger.error(error.toDetailedString())

// Log with context
errorHandler.logError(error, 'warn', { userId: '123' })

// Serialize for transmission
const json = JSON.stringify(error)
```

## Best Practices

1. **Use typed codes**
   ```javascript
   // Good
   throw new AppError(ErrorCodes.ASSET.NOT_FOUND, ...)

   // Avoid
   throw new Error('Asset not found')
   ```

2. **Include context**
   ```javascript
   // Good
   throw new AppError(code, msg, { entityId, transform, error })

   // Avoid
   throw new AppError(code, msg, {})
   ```

3. **Chain errors**
   ```javascript
   // Good
   try { } catch (originalErr) {
     throw new AppError(code, msg, context, originalErr)
   }

   // Avoid
   try { } catch (originalErr) {
     throw new AppError(code, msg, context)
   }
   ```

4. **Register handlers early**
   ```javascript
   init() {
     this.setupErrorHandling()  // Before any operations
   }
   ```

5. **Provide recovery strategies**
   ```javascript
   for (const code in importantCodes) {
     handler.registerRecovery(code, async (error) => {
       // Attempt recovery
     })
   }
   ```

## Files Created

- `src/core/utils/error/ErrorCodes.js` - Categorized error codes
- `src/core/utils/error/AppError.js` - Structured error class
- `src/core/systems/ErrorHandler.js` - Handler registry with recovery

## Integration Checklist

- [ ] Import ErrorCodes where throwing errors
- [ ] Use AppError instead of Error
- [ ] Add context objects to all errors
- [ ] Register handlers in system init()
- [ ] Add recovery strategies for critical paths
- [ ] Log errors with full details
- [ ] Test error handling paths

## Migration Path

**Phase 1:** Use new error classes in new code
**Phase 2:** Migrate critical systems (network, entities, loaders)
**Phase 3:** Migrate remaining systems
**Phase 4:** Remove direct Error throws from codebase
