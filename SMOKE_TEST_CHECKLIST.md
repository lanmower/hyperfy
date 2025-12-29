# Smoke Test Checklist (5 minutes)

## Prerequisites
- Server running on localhost:3000
- Browser console and DevTools open
- Network tab visible in DevTools

## Health Endpoints (30 seconds)

```bash
# Test in terminal or browser:
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
curl http://localhost:3000/metrics
```

### Pass Criteria:
- [ ] `/health` returns 200 with status field
- [ ] `/health/ready` returns 200 with ready=true
- [ ] `/health/live` returns 200 with status='alive'
- [ ] `/metrics` returns 200 with error stats
- [ ] All responses include timestamp

## Server Startup (1 minute)

### Check Logs:
```bash
tail -f world/logs/server.log | grep -E "Server running|ERROR|CRITICAL"
```

### Pass Criteria:
- [ ] "Server running on port 3000" appears in logs
- [ ] No ERROR or CRITICAL messages in startup
- [ ] AI provider health checks initiate (look for "health checks started")
- [ ] No Sentry errors (Sentry should be removed)
- [ ] ComponentLogger messages appear with structured JSON

## Client Connection (1 minute)

1. Open http://localhost:3000 in browser
2. Check DevTools Network tab for WebSocket upgrade
3. Check DevTools Console for errors

### Pass Criteria:
- [ ] Page loads without 404 errors
- [ ] WebSocket connection established (wss://localhost:3000/ws shows status 101)
- [ ] No RED errors in Console (yellow warnings OK)
- [ ] Avatar renders in viewport
- [ ] No white/black screen (page is interactive)

## Error Handling (1 minute)

### Test Invalid Request:
```bash
curl http://localhost:3000/api/invalid-endpoint
```

### Test Error Logging:
```bash
# Check that error is logged to server.log
tail world/logs/server.log | tail -20
```

### Pass Criteria:
- [ ] Endpoint returns 404 or 405
- [ ] Response includes error message
- [ ] Server log shows structured error with:
  - timestamp
  - level: "error"
  - message
  - No Sentry references

## Observability Signals (1 minute)

### Check Error Tracking:
```bash
curl http://localhost:3000/metrics
# Look for: { "errors": { "total": 0, "byLevel": {...}, "byCategory": {...} } }
```

### Check Server Logs Format:
```bash
# Each line should be valid JSON
tail -5 world/logs/server.log | jq .
```

### Pass Criteria:
- [ ] Metrics endpoint returns error statistics
- [ ] All server.log lines parse as valid JSON
- [ ] No sentry, no external service calls in logs
- [ ] Logs include: timestamp, level, message, logger, module, data (if present)

## API Response Validation (30 seconds)

### Test Structured Error Response:
```bash
curl http://localhost:3000/api/test-error 2>/dev/null | jq .
```

### Pass Criteria:
- [ ] Error responses include: error, code, context, correlationId
- [ ] HTTP status codes match error type (404 for not found, 503 for service error)
- [ ] correlationId is consistent for same error

## Health Checks Working (30 seconds)

```bash
curl http://localhost:3000/health | jq .providers
```

### Pass Criteria:
- [ ] Provider status shows actual status (UP, DEGRADED, or DOWN)
- [ ] Not just returning default/fake values
- [ ] lastCheck timestamp is recent (within last 60 seconds)
- [ ] successRate shows actual success/failure ratio

## Performance Verification (30 seconds)

### Check Response Times:
```bash
time curl http://localhost:3000/health > /dev/null
```

### Pass Criteria:
- [ ] /health endpoint responds in < 100ms
- [ ] /health/ready endpoint responds in < 100ms
- [ ] /metrics endpoint responds in < 200ms

## Summary

**Total Pass Criteria**: 25+

If **all critical criteria** pass (health endpoints, client connection, error logging, structured responses), the deployment is ready.

**Known Issues to Ignore**:
- Yellow warnings in Console (React/vendor warnings are OK)
- 404 errors for non-existent assets (expected in dev)
- "Sentry not installed" messages (Sentry is removed)

## Quick Rollback Indicators

Stop deployment if:
- [ ] Health endpoints return 5xx status codes
- [ ] Client connection fails (no WebSocket)
- [ ] Server errors logged without timestamps or structure
- [ ] Error responses missing code/correlationId fields
- [ ] Logs show Sentry integration still active
