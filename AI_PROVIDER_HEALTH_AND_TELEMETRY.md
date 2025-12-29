# AI Provider Health Checks and Telemetry Implementation

## Files Created

### 1. AI Provider Health System
**C:/dev/hyperfy/src/server/health/AIProviderHealth.js**
- Monitors health of configured AI providers (Anthropic, OpenAI, XAI, Google)
- Pings health endpoints every 30 seconds
- Tracks response time, success rate, last error
- Sets status: UP, DEGRADED, DOWN
- Auto-fallback mechanism via `getHealthyProvider()`

### 2. Telemetry System
**C:/dev/hyperfy/src/server/telemetry/Telemetry.js**
- Tracks API calls, errors, response times
- Tracks entity spawns/despawns
- Tracks player connections/disconnections
- Tracks WebSocket messages sent/received
- Batches telemetry data (sends every 60 seconds)
- Optional endpoint for remote telemetry collection

### 3. Updated Health Routes
**C:/dev/hyperfy/src/server/routes/HealthRoutes.js**
- Updated `/health` - Now includes provider status
- Added `/health/providers` - Returns status of all AI providers
- Added `/health/telemetry` - Returns telemetry stats

### 4. Telemetry API Routes
**C:/dev/hyperfy/src/server/routes/TelemetryRoutes.js**
- `GET /api/telemetry/stats` - Get current telemetry
- `POST /api/telemetry/export` - Export telemetry data
- `GET /api/telemetry/health` - Telemetry system health
- `POST /api/telemetry/reset` - Reset metrics

### 5. Server Integration
**C:/dev/hyperfy/src/server/index.js** (Updated)
- Initializes AI provider health monitoring
- Initializes telemetry system
- Starts both systems on server startup
- Stops both systems on graceful shutdown

## API Endpoints

### Health Check Endpoints

**GET /health**
```json
{
  "status": "up",
  "uptime": 120,
  "timestamp": "2025-12-27T20:00:00.000Z",
  "memory": {
    "rss": 150,
    "heapUsed": 80,
    "heapTotal": 120
  },
  "providers": {
    "anthropic": {
      "status": "UP",
      "lastCheck": "2025-12-27T20:00:00.000Z",
      "responseTime": 150,
      "successRate": 100
    }
  }
}
```

**GET /health/providers**
```json
{
  "summary": {
    "total": 4,
    "healthy": 3,
    "degraded": 1,
    "down": 0
  },
  "providers": {
    "anthropic": {
      "status": "UP",
      "lastCheck": "2025-12-27T20:00:00.000Z",
      "lastSuccess": "2025-12-27T20:00:00.000Z",
      "lastError": null,
      "responseTime": 150,
      "successRate": 98,
      "successCount": 100,
      "failureCount": 2
    }
  }
}
```

**GET /health/telemetry**
```json
{
  "enabled": true,
  "uptime": 3600,
  "metrics": {
    "apiCalls": {
      "total": 150,
      "byProvider": {
        "anthropic": 100,
        "openai": 50
      }
    },
    "errors": {
      "total": 5,
      "byType": {
        "TypeError": 3,
        "NetworkError": 2
      }
    }
  }
}
```

### Telemetry Endpoints

**GET /api/telemetry/stats**
```json
{
  "enabled": true,
  "uptime": 3600,
  "metrics": {
    "apiCalls": { "total": 150 },
    "errors": { "total": 5 },
    "responseTimes": { "avg": 180, "min": 100, "max": 500 },
    "entities": { "spawns": 50, "despawns": 20, "active": 30 },
    "players": { "connections": 100, "disconnections": 80, "active": 20 },
    "websocket": { "messagesSent": 5000, "messagesReceived": 4800 }
  },
  "batchSize": 25
}
```

**POST /api/telemetry/export**
```json
{
  "stats": { ... },
  "currentBatch": [
    {
      "type": "api_call",
      "provider": "anthropic",
      "endpoint": "/v1/messages",
      "duration": 150,
      "success": true,
      "timestamp": "2025-12-27T20:00:00.000Z"
    }
  ],
  "config": {
    "batchInterval": 60000,
    "endpoint": "configured",
    "enabled": true
  }
}
```

**GET /api/telemetry/health**
```json
{
  "status": "healthy",
  "enabled": true,
  "uptime": 3600,
  "batchSize": 15
}
```

**POST /api/telemetry/reset**
```json
{
  "success": true,
  "message": "Telemetry metrics reset"
}
```

## Environment Variables

Add to `.env` file:

```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx
GOOGLE_API_KEY=AIzaSyxxx

# Telemetry Configuration
TELEMETRY_ENABLED=true
TELEMETRY_ENDPOINT=https://your-telemetry-endpoint.com/collect
```

## Features

### AI Provider Health Checks
- **Automatic Monitoring**: Checks every 30 seconds
- **Status Levels**: UP (fast response), DEGRADED (slow response), DOWN (failed)
- **Metrics Tracked**:
  - Response time
  - Success rate (percentage)
  - Last check timestamp
  - Last successful check
  - Last error message
  - Total success/failure counts

### Auto-Failover
```javascript
const healthyProvider = aiProviderHealth.getHealthyProvider()
```
Returns the best available provider sorted by:
1. Status (UP > DEGRADED)
2. Success rate (higher is better)

### Telemetry Collection
- **API Metrics**: Provider, endpoint, duration, success/failure
- **Error Tracking**: Type, category, message
- **Response Times**: Count, sum, min, max, average
- **Entity Management**: Spawns, despawns, active count
- **Player Activity**: Connections, disconnections, active count
- **WebSocket Traffic**: Messages and bytes sent/received

### Batch Processing
- Events collected in memory
- Sent to configured endpoint every 60 seconds
- Prevents overwhelming telemetry service
- Automatic retry on failure

## Usage Examples

### Track API Call
```javascript
fastify.telemetry.trackAPICall('anthropic', '/v1/messages', 150, true)
```

### Track Error
```javascript
fastify.telemetry.trackError('TypeError', 'Runtime', 'Cannot read property')
```

### Track Entity Operations
```javascript
fastify.telemetry.trackEntitySpawn('entity-123', 'player')
fastify.telemetry.trackEntityDespawn('entity-123', 'player')
```

### Track Player Activity
```javascript
fastify.telemetry.trackPlayerConnection('player-456')
fastify.telemetry.trackPlayerDisconnection('player-456')
```

### Track WebSocket Traffic
```javascript
fastify.telemetry.trackWebSocketMessage('sent', 1024)
```

### Check Provider Health
```javascript
const status = fastify.aiProviderHealth.getStatus('anthropic')
const isHealthy = fastify.aiProviderHealth.isHealthy('anthropic')
const bestProvider = fastify.aiProviderHealth.getHealthyProvider()
```

## Testing

Run the demonstration script:
```bash
node test-telemetry.js
```

This script demonstrates:
- AI provider health checks
- Health status tracking
- Failover mechanism
- Telemetry collection
- Stats aggregation
- Data export

## Integration Points

To integrate with your application:

1. **Track API Calls** in your AI service handlers
2. **Track Errors** in error handlers
3. **Track Entities** in entity spawn/despawn handlers
4. **Track Players** in WebSocket connection handlers
5. **Track Messages** in WebSocket message handlers

Example:
```javascript
async function callAI(provider, prompt) {
  const start = Date.now()
  try {
    const result = await aiService.call(provider, prompt)
    const duration = Date.now() - start
    fastify.telemetry.trackAPICall(provider, '/api/call', duration, true)
    return result
  } catch (err) {
    const duration = Date.now() - start
    fastify.telemetry.trackAPICall(provider, '/api/call', duration, false)
    fastify.telemetry.trackError(err.name, 'AI', err.message)
    throw err
  }
}
```

## Monitoring Dashboard

Use the health and telemetry endpoints to build monitoring dashboards:

1. **Provider Status Dashboard**: `/health/providers`
2. **System Health Dashboard**: `/health`
3. **Telemetry Dashboard**: `/api/telemetry/stats`
4. **Export for Analysis**: `/api/telemetry/export`

## Production Considerations

1. **Security**: Protect telemetry endpoints with authentication
2. **Performance**: Telemetry is non-blocking and batched
3. **Storage**: Set up remote telemetry endpoint for long-term storage
4. **Alerts**: Monitor provider status and set up alerts for DOWN status
5. **Retention**: Reset telemetry periodically or implement rotation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Server Startup                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │     Initialize AIProviderHealth       │
          │   - Add configured providers          │
          │   - Start 30s health check interval   │
          └───────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │      Initialize Telemetry             │
          │   - Configure batch interval (60s)    │
          │   - Start batch processing            │
          └───────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│   Health Check Loop (30s)    │  │   Telemetry Batch (60s)    │
│  - Ping provider endpoints   │  │  - Send batch to endpoint  │
│  - Update status             │  │  - Clear batch             │
│  - Track metrics             │  │  - Continue collecting     │
└──────────────────────────────┘  └────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │         API Endpoints                 │
          │  /health/providers                    │
          │  /health/telemetry                    │
          │  /api/telemetry/stats                 │
          │  /api/telemetry/export                │
          └───────────────────────────────────────┘
```
