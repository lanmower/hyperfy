# Health Endpoints Testing Guide

## Endpoint Overview

The server exposes four health and monitoring endpoints for production monitoring and orchestration.

## Testing Health Endpoints

### 1. Health Status Endpoint

**Endpoint:** `GET /health`

**Purpose:** Basic liveness probe for load balancers and orchestration

**Response (200 OK):**
```json
{
  "status": "up",
  "uptime": 3600,
  "timestamp": "2025-12-27T10:30:00Z",
  "memory": {
    "rss": 245,
    "heapUsed": 123,
    "heapTotal": 256
  }
}
```

**cURL Test:**
```bash
curl -s http://localhost:3000/health | jq .
```

**Expected Status Codes:**
- `200 OK` - Server is healthy
- `503 Service Unavailable` - Server is unhealthy

---

### 2. Readiness Check Endpoint

**Endpoint:** `GET /health/ready`

**Purpose:** Checks if server is ready to accept traffic (dependencies initialized)

**Response (200 OK - Ready):**
```json
{
  "ready": true,
  "checks": {
    "world": true,
    "network": true,
    "storage": true
  },
  "timestamp": "2025-12-27T10:30:00Z"
}
```

**Response (503 Service Unavailable - Not Ready):**
```json
{
  "ready": false,
  "checks": {
    "world": false,
    "network": true,
    "storage": true
  },
  "timestamp": "2025-12-27T10:30:00Z"
}
```

**cURL Test:**
```bash
# Check readiness
curl -s http://localhost:3000/health/ready | jq .

# Automated check (non-zero exit code if not ready)
curl -f http://localhost:3000/health/ready > /dev/null && echo "Ready" || echo "Not Ready"
```

**Use Cases:**
- Kubernetes readiness probes
- Load balancer pre-traffic checks
- Deployment validation

---

### 3. Liveness Check Endpoint

**Endpoint:** `GET /health/live`

**Purpose:** Simple process liveness check (is the process still running?)

**Response (200 OK):**
```json
{
  "status": "alive",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "error",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

**cURL Test:**
```bash
curl -s http://localhost:3000/health/live | jq .
```

**Use Cases:**
- Kubernetes liveness probes
- Simple "is it alive" checks
- Minimal overhead monitoring

---

### 4. Metrics Endpoint

**Endpoint:** `GET /metrics`

**Purpose:** Comprehensive metrics for monitoring systems

**Response (200 OK):**
```json
{
  "uptime": 3600,
  "memory": {
    "rss": 245,
    "heapUsed": 123,
    "heapTotal": 256
  },
  "errors": 5,
  "errorsByLevel": {
    "error": 3,
    "warn": 2
  },
  "errorsByCategory": {
    "Network": 3,
    "Database": 2
  },
  "connections": 42,
  "entities": 156,
  "blueprints": 23,
  "apps": 45,
  "systemMetrics": {
    "counters": {
      "http.requests.total": 1234,
      "http.requests.200": 1200,
      "http.requests.500": 5
    },
    "timers": {
      "http.response_time_ms": 120
    },
    "gauges": {
      "server.port": 3000
    }
  }
}
```

**cURL Test:**
```bash
curl -s http://localhost:3000/metrics | jq .
```

**Field Descriptions:**
- `uptime` - Seconds server has been running
- `memory.rss` - Total RSS memory in MB
- `memory.heapUsed` - Used heap in MB
- `memory.heapTotal` - Total heap in MB
- `errors` - Total errors since startup
- `errorsByLevel` - Error count by severity
- `errorsByCategory` - Error count by category
- `connections` - Current WebSocket connections
- `entities` - Total entities in world
- `blueprints` - Total blueprints loaded
- `apps` - Total apps running

---

## Integration Examples

### Docker Health Check

**Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Kubernetes Probes

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hyperfy-server
spec:
  template:
    spec:
      containers:
      - name: hyperfy
        image: hyperfy:latest
        ports:
        - containerPort: 3000

        # Liveness probe - restart if unhealthy
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3

        # Readiness probe - remove from service if not ready
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 1
```

### Monitoring with Prometheus

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
- job_name: 'hyperfy'
  static_configs:
  - targets: ['localhost:3000']
  metrics_path: '/metrics'
```

### Load Balancer Configuration (Nginx)

```nginx
upstream hyperfy {
  server localhost:3000 max_fails=2 fail_timeout=10s;
  server localhost:3001 max_fails=2 fail_timeout=10s;

  # Health check
  check interval=3000 rise=2 fall=3 timeout=1000 type=http;
  check_http_send "GET /health/ready HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}

server {
  listen 80;
  location / {
    proxy_pass http://hyperfy;
  }
}
```

### Monitoring Script (Bash)

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
METRICS_URL="http://localhost:3000/metrics"

# Check liveness
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
  echo "✓ Server is alive"
else
  echo "✗ Server is DOWN"
  exit 1
fi

# Check readiness
if curl -f "http://localhost:3000/health/ready" > /dev/null 2>&1; then
  echo "✓ Server is ready"
else
  echo "✗ Server is not ready"
  exit 1
fi

# Get metrics
METRICS=$(curl -s "$METRICS_URL")

# Extract values
ERRORS=$(echo "$METRICS" | jq '.errors')
CONNECTIONS=$(echo "$METRICS" | jq '.connections')
MEMORY=$(echo "$METRICS" | jq '.memory.heapUsed')

echo "Status:"
echo "  Errors: $ERRORS"
echo "  Connections: $CONNECTIONS"
echo "  Memory: ${MEMORY}MB"

# Alert if too many errors
if [ "$ERRORS" -gt 100 ]; then
  echo "⚠ WARNING: High error count"
  exit 1
fi

exit 0
```

### Monitoring Script (Node.js)

```javascript
import fetch from 'node-fetch'

async function monitorServer(baseUrl = 'http://localhost:3000') {
  try {
    // Check health
    const health = await fetch(`${baseUrl}/health`).then(r => r.json())
    console.log('Health:', health.status)

    // Check readiness
    const ready = await fetch(`${baseUrl}/health/ready`).then(r => r.json())
    console.log('Ready:', ready.ready)

    // Get metrics
    const metrics = await fetch(`${baseUrl}/metrics`).then(r => r.json())
    console.log('Metrics:', {
      errors: metrics.errors,
      connections: metrics.connections,
      memory: metrics.memory.heapUsed + 'MB',
      uptime: metrics.uptime + 's'
    })

    // Alerts
    if (metrics.errors > 100) {
      console.warn('⚠ High error count detected')
    }

    if (metrics.memory.heapUsed > 500) {
      console.warn('⚠ High memory usage detected')
    }

    return true
  } catch (err) {
    console.error('Monitoring failed:', err.message)
    return false
  }
}

// Run monitoring every 30 seconds
setInterval(() => monitorServer(), 30000)
monitorServer()
```

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] `/health` returns 200 with uptime
- [ ] `/health/ready` returns 200 with all checks passing
- [ ] `/health/live` returns 200 with alive status
- [ ] `/metrics` returns complete metrics object
- [ ] Memory values are reasonable (not negative, not millions)
- [ ] Connection count is accurate (matches WebSocket connections)
- [ ] Error count increases when errors occur
- [ ] Health check response time < 100ms
- [ ] Endpoints work when server is under load
- [ ] Endpoints recover from temporary failures

---

## Performance Expectations

| Endpoint | Response Time | Payload Size |
|----------|---------------|--------------|
| /health | < 5ms | < 500 bytes |
| /health/ready | < 10ms | < 500 bytes |
| /health/live | < 2ms | < 200 bytes |
| /metrics | < 20ms | < 5KB |

---

## Troubleshooting

**Issue: /health returns 503**
- Check server logs
- Verify server is running
- Check if port is correct

**Issue: /health/ready returns false**
- Check world initialization
- Verify network system is loaded
- Check storage initialization

**Issue: Metrics show incorrect values**
- Verify Metrics system is initialized
- Check errorTracker.getStats() is working
- Ensure world.entities, world.blueprints are populated

**Issue: High response times**
- Check server CPU/memory usage
- Review system load
- Check for hanging operations in logs
