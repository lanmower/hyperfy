# Debug Guide: Endpoint Response Corruption Issue

## Problem Statement

All API endpoints return HTTP 200 with response body containing only the literal string `gzip` (4 bytes) instead of the intended JSON/HTML content.

```
GET /api/health -> "gzip"
GET /api/status -> "gzip"
GET /api/collections -> "gzip"
GET / -> "gzip"
```

This happens on ALL endpoints regardless of route handler logic.

## Root Cause Hypothesis

The response is being intercepted and corrupted somewhere in the Fastify middleware/plugin chain before it reaches the client.

**Most likely causes:**

1. **Fastify compression plugin return value** - The onUnsupportedEncoding handler was returning the string 'gzip' (now simplified but issue persists)
2. **Response transformation middleware** - Some onSend hook is transforming the response body
3. **Plugin registration order** - A plugin registered after routes is intercepting responses
4. **Serialization layer** - JSON.stringify or similar is being called on an object that has 'gzip' as its only property
5. **Fastify version incompatibility** - @fastify/compress version may not be compatible with Fastify 5.x

## Investigation Steps

### 1. Add Request Logging Middleware

Create `src/server/middleware/DebugMiddleware.js`:

```javascript
export function registerDebugMiddleware(fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    console.log(`[DEBUG] START ${request.method} ${request.url}`)
  })

  fastify.addHook('onSend', async (request, reply, payload) => {
    console.log(`[DEBUG] onSend ${request.method} ${request.url}`)
    console.log(`[DEBUG] Payload type: ${typeof payload}`)
    console.log(`[DEBUG] Payload length: ${payload?.length}`)
    console.log(`[DEBUG] Payload content: ${String(payload).substring(0, 100)}`)
    return payload
  })

  fastify.addHook('onResponse', async (request, reply) => {
    console.log(`[DEBUG] FINISH ${request.method} ${request.url} -> ${reply.statusCode}`)
  })
}
```

Add to `src/server/index.js` FIRST in middleware setup:

```javascript
await registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager)
registerDebugMiddleware(fastify)  // Add this line
```

### 2. Trace Fastify Internals

Modify ServerMiddleware.js to add detailed logging:

```javascript
export async function registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager) {
  console.log('[MIDDLEWARE] Registering core middleware...')

  fastify.register(createRequestIdMiddleware())
  fastify.register(createErrorHandler(logger, errorTracker))
  fastify.register(createTimeoutMiddleware(timeoutManager))

  console.log('[MIDDLEWARE] Registering hooks...')
  fastify.addHook('onRequest', async (request, reply) => {
    console.log('[HOOK] onRequest', request.url)
    reply.header('X-Content-Type-Options', 'nosniff')
    // ... other headers
  })

  // ... rest of middleware
}
```

### 3. Check Compression Plugin

In `src/server/performance/CompressionManager.js`, add logging:

```javascript
export async function setupCompression(fastify, options = {}) {
  console.log('[COMPRESSION] Registering @fastify/compress...')

  try {
    await fastify.register(compress, {
      threshold: config.threshold,
      encodings: ['gzip', 'deflate'],
      exclude: config.exclude,
    })
    console.log('[COMPRESSION] Successfully registered')
  } catch (err) {
    console.error('[COMPRESSION] Failed to register:', err.message)
    throw err
  }

  fastify.addHook('onSend', async (request, reply) => {
    console.log('[COMPRESSION] onSend hook for', request.url)
    // ... rest of hook
  })
}
```

### 4. Disable Compression Entirely

Temporarily disable compression to isolate the issue:

```javascript
// In src/server/middleware/ServerMiddleware.js
// await setupCompression(fastify)  // COMMENT OUT
```

If the endpoints work correctly with compression disabled, the bug is in the compression plugin.

### 5. Test with Simple Route

Add a diagnostic route that bypasses all middleware:

```javascript
// Add to src/server/routes/index.js at the END, after all other routes
export async function registerDiagnosticRoute(fastify) {
  fastify.get('/test-diagnostic', async (request, reply) => {
    console.log('[DIAGNOSTIC] Handler called')
    const response = { test: 'success', timestamp: new Date().toISOString() }
    console.log('[DIAGNOSTIC] About to send:', response)
    reply.send(response)
    console.log('[DIAGNOSTIC] Send called')
  })
}
```

Then call in index.js:

```javascript
await registerRoutes(fastify, world, initializer.assetsDir)
registerDiagnosticRoute(fastify)
```

Test: `curl http://localhost:4001/test-diagnostic`

### 6. Check Plugin Registration Order

Log all registered plugins:

```javascript
// Add after all plugins registered in index.js
console.log('[PLUGINS] Registered plugins:')
for (const plugin of fastify.pluginTree.children) {
  console.log('  -', plugin.name)
}
```

### 7. Look for Response Transformation

Search for any code that might be modifying the response:

```bash
grep -rn "reply\.send\|response\.body\|\.stringify\|\.send(" \
  src/server --include="*.js" | \
  grep -v "//.*send" | \
  head -50
```

### 8. Check Fastify Version Compatibility

Verify @fastify/compress works with Fastify 5.0.0:

```bash
npm list fastify @fastify/compress
```

If incompatible:
```bash
npm install @fastify/compress@latest
```

## Debugging Commands

### Start with Debug Logging

```bash
NODE_DEBUG=fastify:* npm run dev 2>&1 | tee debug.log
```

### Monitor Live Response

```bash
curl -v http://localhost:4001/api/health 2>&1
```

### Check Payload in Transit

```bash
node -e "
const http = require('http');
const req = http.request({hostname: 'localhost', port: 4001, path: '/api/health'}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log('Body bytes:', data.length); console.log('Body:', JSON.stringify(data)); });
});
req.end();
"
```

### Trace Middleware Execution

Add to CompressionManager and CachingStrategy:

```javascript
fastify.addHook('onSend', async (request, reply, payload) => {
  console.log('[MODULE_NAME] onSend - payload is:', typeof payload, payload?.length || 'null')
  return payload
})
```

## Expected vs Actual

**Expected /api/health response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-03T14:09:17.123Z",
  "uptime": 42.567,
  "checks": {
    "database": true,
    "network": false,
    "memory": true
  }
}
```

**Actual response:**
```
gzip
```

## Solution Checklist

Once debugging is complete:

- [ ] Identify which middleware/hook is corrupting the response
- [ ] Understand why the response becomes "gzip"
- [ ] Determine if it's @fastify/compress fault or custom middleware
- [ ] Fix the identified issue
- [ ] Test all endpoints return correct responses
- [ ] Run npm run build successfully
- [ ] Test production mode (npm start)
- [ ] Verify database persistence
- [ ] Verify WebSocket functionality
- [ ] Update this guide with the solution

## Files to Review

1. `src/server/middleware/ServerMiddleware.js` - onRequest hook
2. `src/server/performance/CompressionManager.js` - compression setup
3. `src/server/performance/CachingStrategy.js` - onSend hooks
4. `src/server/routes/health.js` - endpoint handlers
5. `src/server/routes/StaticAssets.js` - static file serving

## Quick Fix Attempt

If still in debug mode, try disabling all onSend hooks:

```javascript
// In ServerMiddleware.js, comment out all hook registrations:
// fastify.addHook('onSend', ...)
// setupCacheHeaders(fastify) <- DISABLED
// addETagSupport(fastify) <- DISABLED
// trackResponseTime(fastify) <- DISABLED
// enforcePerformanceBudgets(fastify) <- DISABLED
```

If endpoints work correctly with all onSend hooks disabled, the bug is in one of those hooks.

---

**Last Updated:** 2026-01-03
**Status:** INVESTIGATION IN PROGRESS
