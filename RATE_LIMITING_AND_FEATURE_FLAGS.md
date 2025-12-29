# Rate Limiting and Feature Flags Implementation

Complete implementation of production-ready rate limiting and feature flags system.

## Files Created

### Rate Limiting
- `src/server/middleware/RateLimiter.js` - Core rate limiting middleware
- `src/server/config/RateLimitConfig.js` - Rate limit configuration and IP lists

### Feature Flags
- `src/server/features/FeatureFlags.js` - Server-side feature flag management
- `src/core/FeatureFlags.js` - Client-side feature flag integration

### Admin API
- `src/server/routes/AdminRoutes.js` - Admin endpoints for managing flags and rate limits

### Testing
- `src/scripts/test-rate-limiting.js` - Test script demonstrating functionality

## Files Modified

- `src/server/index.js` - Registered admin routes
- `src/server/routes/UploadRoutes.js` - Applied upload rate limiting (10 req/min)
- `src/server/routes/StatusRoutes.js` - Applied API rate limiting + feature flag endpoint

## Rate Limiting Features

### Configuration Presets

```javascript
{
  upload: { max: 10, window: 60000, burst: 1.3 },      // 10 requests/min with 30% burst
  admin: { max: 30, window: 60000, burst: 1.3 },       // 30 requests/min
  api: { max: 100, window: 60000, burst: 1.3 },        // 100 requests/min
  websocket: { max: 5, window: 60000, burst: 1.0 },    // 5 connections/min
  health: { max: 60, window: 60000, burst: 1.5 },      // 60 requests/min
}
```

### Usage Example

```javascript
import { createRateLimiter } from '../middleware/RateLimiter.js'

fastify.post('/api/upload', {
  preHandler: createRateLimiter('upload'),
}, async (req, reply) => {
  // Handler code
})
```

### Response Headers

All rate-limited endpoints return:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Seconds until reset

### 429 Response Format

```json
{
  "error": "Too Many Requests",
  "retryAfter": 45,
  "limit": 10,
  "current": 13
}
```

### Security Features

- Per-IP tracking with client IP detection
- Automatic cleanup of expired requests (every 60s)
- Violation logging with `[SECURITY]` prefix
- Burst allowance (30% over limit)
- Disabled in development mode
- Whitelist/blacklist support

### Admin Endpoints for Rate Limits

```bash
# Get rate limit statistics
GET /api/admin/rate-limits
Headers: X-Admin-Code: <admin-code>

# Clear rate limits for specific IP
POST /api/admin/rate-limits/clear/:ip
Headers: X-Admin-Code: <admin-code>

# Add IP to whitelist
POST /api/admin/rate-limits/whitelist
Headers: X-Admin-Code: <admin-code>
Body: { "ip": "192.168.1.100" }

# Remove IP from whitelist
DELETE /api/admin/rate-limits/whitelist/:ip
Headers: X-Admin-Code: <admin-code>

# Add IP to blacklist
POST /api/admin/rate-limits/blacklist
Headers: X-Admin-Code: <admin-code>
Body: { "ip": "10.0.0.50" }

# Remove IP from blacklist
DELETE /api/admin/rate-limits/blacklist/:ip
Headers: X-Admin-Code: <admin-code>
```

## Feature Flags System

### Default Flags

```javascript
{
  newPhysics: { enabled: false, rollout: 0, description: 'Enable experimental physics engine' },
  advancedGraphics: { enabled: false, rollout: 0, description: 'Enable advanced graphics features' },
  betaFeatures: { enabled: false, rollout: 0, description: 'Enable beta features' },
  maintenanceMode: { enabled: false, rollout: 0, description: 'Enable maintenance mode' },
  enhancedShadows: { enabled: false, rollout: 0, description: 'Enable enhanced shadow rendering' },
  spatialAudio: { enabled: false, rollout: 0, description: 'Enable spatial audio processing' },
  asyncLoading: { enabled: true, rollout: 100, description: 'Enable async asset loading' },
  debugMode: { enabled: false, rollout: 0, description: 'Enable debug mode' },
}
```

### Environment Variable Override

```bash
# Enable specific flags via environment variables
FEATURE_BETAFEATURES=true
FEATURE_NEWPHYSICS=true
FEATURE_DEBUGMODE=false
```

### Server-Side Usage

```javascript
import { isFeatureEnabled } from '../features/FeatureFlags.js'

if (isFeatureEnabled('betaFeatures', userId)) {
  // Enable beta feature for this user
}
```

### Client-Side Usage

```javascript
import { isFeatureEnabled, createDebugUI } from '../core/FeatureFlags.js'

// Initialize with flags from server
initClientFeatureFlags(userId, flagsFromServer)

// Check if feature is enabled
if (isFeatureEnabled('advancedGraphics')) {
  enableAdvancedGraphics()
}

// Create debug UI (Ctrl+Shift+F to toggle)
const debugUI = createDebugUI()
```

### A/B Testing

The system uses deterministic hashing for consistent user assignment:

```javascript
// User "abc123" with 50% rollout always gets same variant
const variant = getUserVariant('betaFeatures', 'abc123')
// { enabled: true, variant: 'treatment', bucket: 42, rollout: 50 }
```

Hash function ensures:
- Same user always gets same variant
- Approximately even distribution
- No external dependencies

### Admin API Endpoints

```bash
# List all feature flags
GET /api/admin/feature-flags
Headers: X-Admin-Code: <admin-code>
Response: {
  "success": true,
  "flags": { ... },
  "stats": {
    "totalFlags": 8,
    "enabledFlags": 1,
    "disabledFlags": 7,
    "flagsWithRollout": 0
  }
}

# Toggle feature flag
POST /api/admin/feature-flags
Headers: X-Admin-Code: <admin-code>
Body: { "flag": "betaFeatures", "enabled": true }

# Set rollout percentage (A/B testing)
POST /api/admin/feature-flags/:flag/rollout
Headers: X-Admin-Code: <admin-code>
Body: { "percentage": 50 }

# Get flag history
GET /api/admin/feature-flags/:flag/history
Headers: X-Admin-Code: <admin-code>

# Get user variant (check A/B test assignment)
GET /api/admin/feature-flags/:flag/variant/:userId
Headers: X-Admin-Code: <admin-code>
Response: {
  "success": true,
  "flag": "betaFeatures",
  "userId": "user123",
  "variant": {
    "enabled": true,
    "variant": "treatment",
    "bucket": 42,
    "rollout": 50,
    "reason": "A/B test assignment"
  }
}

# Create custom feature flag
POST /api/admin/feature-flags/create
Headers: X-Admin-Code: <admin-code>
Body: {
  "flag": "customFeature",
  "description": "My custom feature",
  "enabled": true,
  "rollout": 100
}

# Delete custom feature flag (cannot delete defaults)
DELETE /api/admin/feature-flags/:flag
Headers: X-Admin-Code: <admin-code>
```

### Client Feature Flag API

```bash
# Get feature flags for authenticated user
GET /api/feature-flags
Headers: Authorization: Bearer <jwt-token>
Response: {
  "success": true,
  "flags": {
    "betaFeatures": {
      "enabled": true,
      "rollout": 50,
      "description": "Enable beta features",
      "variant": "treatment"
    }
  },
  "userId": "user123"
}
```

## Testing

### Run Test Script

```bash
# Set admin code for testing
export ADMIN_CODE=your-admin-code

# Run tests
node src/scripts/test-rate-limiting.js
```

### Test Output Example

```
=== Rate Limiting Test ===

Test 1: Health endpoint rate limiting (60 requests/min limit)
  Request 79: Rate limited - Too Many Requests (retryAfter: 58s)
  Success: 78, Rate Limited: 1

Test 2: Get rate limit stats
  Rate limit stats: {
    "totalKeys": 3,
    "violations": 1,
    "activeIPCount": 1
  }

=== Feature Flags Test ===

Test 1: Get all feature flags
  Feature flags:
    newPhysics: enabled=false, rollout=0%
    betaFeatures: enabled=true, rollout=50%
    asyncLoading: enabled=true, rollout=100%

Test 4: A/B test variant assignment (100 random users)
  Variant distribution (50% rollout):
    Treatment (feature enabled): 50%
    Control (feature disabled): 50%
```

### Manual Testing with cURL

```bash
# Test rate limiting
for i in {1..15}; do
  curl http://localhost:3000/api/upload \
    -F "file=@test.txt" \
    -w "\nStatus: %{http_code}\n"
done

# Toggle feature flag
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -H "X-Admin-Code: your-admin-code" \
  -d '{"flag":"betaFeatures","enabled":true}'

# Set A/B test rollout
curl -X POST http://localhost:3000/api/admin/feature-flags/betaFeatures/rollout \
  -H "Content-Type: application/json" \
  -H "X-Admin-Code: your-admin-code" \
  -d '{"percentage":25}'

# Check user variant
curl http://localhost:3000/api/admin/feature-flags/betaFeatures/variant/user123 \
  -H "X-Admin-Code: your-admin-code"
```

## Production Deployment

### Environment Variables

```bash
# Required
ADMIN_CODE=secure-random-string-here

# Optional feature flag overrides
FEATURE_BETAFEATURES=true
FEATURE_NEWPHYSICS=false

# Node environment
NODE_ENV=production
```

### Security Checklist

- [x] Rate limiting enabled in production
- [x] Admin endpoints require X-Admin-Code header
- [x] Rate limit violations logged with [SECURITY] prefix
- [x] IP whitelist/blacklist support
- [x] Automatic cleanup prevents memory leaks
- [x] Development mode bypasses rate limits
- [x] Feature flags track modification history
- [x] Client-side flags sync from server
- [x] A/B testing uses deterministic hashing

### Monitoring

Rate limit violations are logged:
```
[SECURITY] Rate limit violation: IP=192.168.1.100 endpoint=upload count=13/10
```

Feature flag changes are logged:
```
[FeatureFlags] betaFeatures enabled by admin
[FeatureFlags] betaFeatures rollout set to 50% by admin
```

### Performance

- In-memory storage (no Redis dependency for MVP)
- O(1) rate limit checks
- O(1) feature flag lookups
- Automatic cleanup prevents unbounded growth
- Suitable for single-server deployments

### Future Enhancements

For multi-server deployments, consider:
- Redis-backed rate limiting for shared state
- Database-backed feature flags for persistence
- Real-time flag updates via WebSocket
- Metrics integration (Prometheus/Grafana)
- IP geolocation for advanced rules

## Debug UI

The client feature flags include a debug UI:

```javascript
import { createDebugUI } from '../core/FeatureFlags.js'

// Create and show debug panel
const debugUI = createDebugUI()
debugUI.show()

// Toggle with keyboard: Ctrl+Shift+F
```

Debug panel shows:
- All feature flags
- Current variant (treatment/control)
- Rollout percentage
- Real-time updates

## Architecture Decisions

### Why In-Memory Storage?

- Zero external dependencies
- Sufficient for single-server MVP
- O(1) performance
- Easy to migrate to Redis later
- Automatic cleanup prevents leaks

### Why Deterministic Hashing for A/B Tests?

- Consistent user experience
- No database lookups required
- Approximately even distribution
- Easy to implement
- Stateless (no variant storage needed)

### Why 30% Burst Allowance?

- Handles legitimate traffic spikes
- Prevents false positives
- Industry standard practice
- Configurable per endpoint

### Why Separate Client/Server Flags?

- Server flags initialize from environment
- Clients sync flags from server
- Same A/B test logic on both sides
- Prevents client manipulation
- Single source of truth (server)

## Summary

Complete production-ready implementation featuring:

- ✅ Per-IP rate limiting with configurable limits
- ✅ Burst allowance (30% over limit)
- ✅ Rate limit stats and monitoring
- ✅ IP whitelist/blacklist
- ✅ 8 default feature flags
- ✅ A/B testing with deterministic user assignment
- ✅ Flag history tracking
- ✅ Admin API for flag management
- ✅ Client-side flag integration
- ✅ Debug UI (Ctrl+Shift+F)
- ✅ Environment variable overrides
- ✅ Security logging
- ✅ Test script with examples
- ✅ Zero external dependencies
- ✅ Production-ready monitoring
