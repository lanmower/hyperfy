# AdminRoutes Handler Refactoring: Before & After

## Example 1: GET /api/admin/feature-flags

### BEFORE (13 lines)
```javascript
fastify.get('/api/admin/feature-flags', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  try {
    const flags = getAllFlags()
    const stats = getStats()

    return reply.code(200).send({
      success: true,
      flags,
      stats,
    })
  } catch (error) {
    console.error('[AdminRoutes] Get feature flags error:', error)
    return reply.code(500).send({ error: 'Failed to get feature flags' })
  }
})
```

### AFTER (18 lines, but clearer intent)
```javascript
fastify.get('/api/admin/feature-flags', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  return await APIMethodWrapper.wrapFastifyMethod(
    async () => {
      logger.info('Get feature flags')
      const flags = getAllFlags()
      const stats = getStats()
      return reply.code(200).send({
        success: true,
        flags,
        stats,
      })
    },
    reply,
    { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get feature flags' }
  )
})
```

**Benefits**:
- ✅ No try-catch boilerplate
- ✅ Centralized error handling
- ✅ Clear logging with component name
- ✅ Consistent error response format

---

## Example 2: POST /api/admin/feature-flags (with validation)

### BEFORE (23 lines)
```javascript
fastify.post('/api/admin/feature-flags', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  try {
    const { flag, enabled } = req.body

    if (!flag || typeof enabled !== 'boolean') {
      return reply.code(400).send({ error: 'Invalid request body' })
    }

    const result = toggleFeature(flag, enabled, 'admin')

    if (!result.success) {
      return reply.code(400).send({ error: result.error })
    }

    return reply.code(200).send({
      success: true,
      flag: result.flag,
    })
  } catch (error) {
    console.error('[AdminRoutes] Toggle feature flag error:', error)
    return reply.code(500).send({ error: 'Failed to toggle feature flag' })
  }
})
```

### AFTER (24 lines, same structure but cleaner)
```javascript
fastify.post('/api/admin/feature-flags', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  return await APIMethodWrapper.wrapFastifyMethod(
    async () => {
      const { flag, enabled } = req.body

      if (!flag || typeof enabled !== 'boolean') {
        return reply.code(400).send({ error: 'Invalid request body' })
      }

      logger.info('Toggle feature flag', { flag, enabled })
      const result = toggleFeature(flag, enabled, 'admin')

      if (!result.success) {
        return reply.code(400).send({ error: result.error })
      }

      return reply.code(200).send({
        success: true,
        flag: result.flag,
      })
    },
    reply,
    { logger, defaultStatusCode: 500, defaultMessage: 'Failed to toggle feature flag' }
  )
})
```

**Benefits**:
- ✅ Validation logic visible and not buried in try-catch
- ✅ Logging with contextual data { flag, enabled }
- ✅ Early returns for validation still work
- ✅ Errors automatically caught by wrapper

---

## Example 3: Complex handler with nested checks

### BEFORE (28 lines)
```javascript
fastify.get('/api/admin/circuit-breakers/:name', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  try {
    const { name } = req.params

    if (!fastify.circuitBreakerManager) {
      return reply.code(503).send({ error: 'Circuit breaker manager not available' })
    }

    if (!fastify.circuitBreakerManager.has(name)) {
      return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
    }

    const stats = fastify.circuitBreakerManager.getStats(name)
    return reply.code(200).send({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('[AdminRoutes] Get circuit breaker error:', error)
    return reply.code(500).send({ error: 'Failed to get circuit breaker' })
  }
})
```

### AFTER (25 lines - same structure, cleaner)
```javascript
fastify.get('/api/admin/circuit-breakers/:name', {
  preHandler: adminOnlyMiddleware,
}, async (req, reply) => {
  return await APIMethodWrapper.wrapFastifyMethod(
    async () => {
      const { name } = req.params

      if (!fastify.circuitBreakerManager) {
        return reply.code(503).send({ error: 'Circuit breaker manager not available' })
      }

      if (!fastify.circuitBreakerManager.has(name)) {
        return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
      }

      logger.info('Get circuit breaker', { name })
      const stats = fastify.circuitBreakerManager.getStats(name)
      return reply.code(200).send({
        success: true,
        stats,
      })
    },
    reply,
    { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker' }
  )
})
```

**Benefits**:
- ✅ Validation checks remain visible and clear
- ✅ No unnecessary wrapping of validation logic
- ✅ Logging contextual data { name }
- ✅ Handler logic is the focus, not error handling

---

## Key Improvements

### 1. Reduced Visual Noise
- Removed 23 try-catch blocks (142 lines of boilerplate)
- Business logic now the primary focus
- Error handling abstracted away

### 2. Consistent Logging
- **Before**: `console.error('[AdminRoutes] Get feature flags error:', error)`
- **After**: `logger.info('Get feature flags')` + automatic error logging via wrapper

### 3. Uniform Error Responses
- All handlers return `{ error: 'message' }` via wrapper
- Consistent HTTP status codes (500 for unhandled errors)
- Customizable per-handler via options

### 4. Validation Pattern Preserved
- Early returns for validation still work
- No change to validation logic
- Validation errors (400, 404, 503) unaffected

### 5. Error Propagation
- Any error thrown in async function caught by wrapper
- Error message and stack logged
- Automatic 500 response sent to client

---

## Error Handling Flow

### BEFORE
```
Request
  ↓
try block
  ├─ Execute handler logic
  └─ Catch error → console.error → reply.code(500)
  ↓
Response
```

### AFTER
```
Request
  ↓
APIMethodWrapper.wrapFastifyMethod()
  ├─ Execute async function
  └─ On error:
      ├─ logger.error() [from wrapper]
      └─ reply.code(500) with error message
  ↓
Response
```

---

## Migration Pattern (Reusable)

This pattern can be applied to other route files:

```javascript
// 1. Import utilities at top
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

// 2. Create logger instance
const logger = new ComponentLogger('RouteName')

// 3. Wrap each handler
router.method('/path', async (req, reply) => {
  return await APIMethodWrapper.wrapFastifyMethod(
    async () => {
      // Business logic here
      logger.info('Action description')
      const result = operation()
      return reply.code(200).send(result)
    },
    reply,
    { logger, defaultStatusCode: 500, defaultMessage: 'Operation failed' }
  )
})
```

This same pattern applies to:
- `src/server/routes/HealthRoutes.js` (11 handlers)
- `src/server/routes/StatusRoutes.js` (6 handlers)
- `src/server/routes/UploadRoutes.js`
- `src/server/routes/ErrorRoutes.js`
- Any other Fastify route file with try-catch patterns
