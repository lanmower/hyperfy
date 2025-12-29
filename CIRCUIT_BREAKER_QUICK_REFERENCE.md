# Circuit Breaker Quick Reference

## Environment Variables

```bash
# Database Circuit Breaker
DB_CIRCUIT_FAILURE_THRESHOLD=5
DB_CIRCUIT_SUCCESS_THRESHOLD=2
DB_CIRCUIT_TIMEOUT=60000

# Storage Circuit Breaker
STORAGE_CIRCUIT_FAILURE_THRESHOLD=5
STORAGE_CIRCUIT_SUCCESS_THRESHOLD=2
STORAGE_CIRCUIT_TIMEOUT=60000

# WebSocket Circuit Breaker
WS_CIRCUIT_FAILURE_THRESHOLD=10
WS_CIRCUIT_SUCCESS_THRESHOLD=3
WS_CIRCUIT_TIMEOUT=30000

# Upload Circuit Breaker
UPLOAD_CIRCUIT_FAILURE_THRESHOLD=5
UPLOAD_CIRCUIT_SUCCESS_THRESHOLD=2
UPLOAD_CIRCUIT_TIMEOUT=90000
```

## Admin API Endpoints

### View All Circuit Breakers
```bash
curl -H "X-Admin-Code: YOUR_ADMIN_CODE" \
  http://localhost:3000/api/admin/circuit-breakers
```

### View Specific Circuit Breaker
```bash
curl -H "X-Admin-Code: YOUR_ADMIN_CODE" \
  http://localhost:3000/api/admin/circuit-breakers/database
```

### Reset Circuit Breaker
```bash
curl -X POST -H "X-Admin-Code: YOUR_ADMIN_CODE" \
  http://localhost:3000/api/admin/circuit-breakers/database/reset
```

### Reset All Circuit Breakers
```bash
curl -X POST -H "X-Admin-Code: YOUR_ADMIN_CODE" \
  http://localhost:3000/api/admin/circuit-breakers/reset-all
```

## Health Endpoints

### Main Health Check (includes circuit breakers)
```bash
curl http://localhost:3000/health
```

### Circuit Breaker Health
```bash
curl http://localhost:3000/health/circuit-breakers
```

### Metrics (includes circuit breakers)
```bash
curl http://localhost:3000/metrics
```

## State Transitions

```
CLOSED --[failures >= threshold]--> OPEN
OPEN --[after timeout]--> HALF_OPEN
HALF_OPEN --[failure]--> OPEN
HALF_OPEN --[successes >= threshold]--> CLOSED
```

## Log Messages

Watch for these in server logs:

```bash
# Registration
[CIRCUIT-BREAKER] Registered circuit breaker: <name> { thresholds... }

# State transitions
[CIRCUIT-BREAKER] <name>: CLOSED -> OPEN { failureCount: 5, successCount: 0 }
[CIRCUIT-BREAKER] <name>: OPEN -> HALF_OPEN { failureCount: 5, successCount: 0 }
[CIRCUIT-BREAKER] <name>: HALF_OPEN -> CLOSED { failureCount: 0, successCount: 2 }

# Circuit open errors
[CIRCUIT-BREAKER] Database circuit open, returning empty result
[CIRCUIT-BREAKER] Storage circuit open, persist skipped
[CIRCUIT-BREAKER] WebSocket circuit open, broadcast skipped: <name>
[CIRCUIT-BREAKER] Upload circuit open

# Reset
[CIRCUIT-BREAKER] Reset circuit breaker: <name>
[CIRCUIT-BREAKER] Reset all circuit breakers
```

## Adding New Circuit Breaker

In `src/server/index.js`:

```javascript
circuitBreakerManager.register('my-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
})
```

## Using Circuit Breaker

```javascript
// Get the circuit breaker
const breaker = circuitBreakerManager.get('my-service')

// Execute operation
try {
  const result = await breaker.execute(async () => {
    // Your operation here
    return await someAsyncOperation()
  })
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Circuit is open, service unavailable
    console.log('Service temporarily unavailable')
  } else {
    // Normal error
    throw error
  }
}
```

## Monitoring Circuit Breaker State

```javascript
const stats = breaker.getStats()
console.log('State:', stats.state)
console.log('Failures:', stats.failureCount, '/', stats.failureThreshold)
console.log('Success Rate:', stats.metrics.successRate + '%')
```

## Common Scenarios

### Database Circuit Opens
- Queries return empty arrays
- Insert operations fail silently
- Check database connection
- Reset circuit after fixing: POST /api/admin/circuit-breakers/database/reset

### Storage Circuit Opens
- Persist operations skipped
- Data not saved to disk
- Check file system permissions
- Reset circuit after fixing

### WebSocket Circuit Opens
- Broadcasts skipped
- Clients not receiving updates
- Check network connectivity
- Reset circuit after fixing

### Upload Circuit Opens
- File uploads return 503
- Check disk space
- Check file system
- Reset circuit after fixing
