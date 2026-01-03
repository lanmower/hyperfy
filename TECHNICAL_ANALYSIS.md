# Hyperfy Technical Analysis - Developer Reference

## Architecture Overview

### System Initialization Chain

```javascript
// Entry: src/server/index.js
import 'dotenv-flow/config'        // Environment variables
import '../core/lockdown.js'       // Security sandbox
import './bootstrap.js'            // Globals setup

// ServerInitializer orchestrates:
const initializer = new ServerInitializer(rootDir, env)
await initializer.preparePaths()   // Create required directories

// Service Setup (dependency injection pattern)
const logger = initializer.setupLogger()
const corsConfig = initializer.setupCORSConfig()
const shutdownManager = initializer.setupShutdownManager(logger)
const errorTracker = initializer.setupErrorTracking(logger)
const metrics = initializer.setupMetrics()
const telemetry = initializer.setupTelemetry(logger)
const timeoutManager = initializer.setupTimeoutManager()
const circuitBreakerManager = initializer.setupCircuitBreakerManager()

// World Initialization
const { world, degradationManager, statusPageData } =
  await initializer.initializeWorld(logger, errorTracker, ...)

// Fastify Setup & Plugin Registration
const fastify = Fastify(...)
await registerMiddleware(fastify, ...)
await registerWorldNetwork(fastify, ...)
await registerRoutes(fastify, ...)
await startServer(fastify, port, ...)
```

### Service Managers

#### 1. ServerInitializer (Orchestrator Pattern)
- **File:** `src/server/ServerInitializer.js`
- **Responsibility:** Coordinates all service initialization
- **Pattern:** Factory + Builder

```javascript
// Creates and configures all services in dependency order
setupLogger()              // → LoggerFactory + sinks
setupCORSConfig()          // → CORSConfig with init method
setupShutdownManager()     // → Graceful shutdown handler
setupErrorTracking()       // → Exception tracking + sampling
setupMetrics()             // → Performance metrics collection
setupTelemetry()           // → Batch telemetry reporter
setupTimeoutManager()      // → Per-resource timeout config
setupCircuitBreakerManager() // → Fault tolerance circuits
```

#### 2. CircuitBreakerManager (Resilience)
- **File:** `src/server/resilience/CircuitBreakerManager.js`
- **Responsibility:** Monitors and manages circuit breaker state
- **Circuits:**
  - Database (5 failures → open, 60s timeout)
  - Storage (5 failures → open, 60s timeout)
  - WebSocket (10 failures → open, 30s timeout)
  - Upload (5 failures → open, 90s timeout)

```javascript
manager.register('database', {
  failureThreshold: 5,       // Open circuit after N failures
  successThreshold: 2,       // Close circuit after N successes
  timeout: 60000            // Try half-open after this time
})
```

#### 3. DegradationManager (Fault Tolerance)
- **File:** `src/server/resilience/DegradationManager.js`
- **Responsibility:** Activates fallback strategies when circuits open
- **Strategies:** (Defined in DegradationStrategies.js)
  - Database down → Return cached data
  - Storage down → Queue uploads
  - WebSocket down → Fall back to HTTP polling
  - Upload service down → Return error with retry hint

#### 4. TimeoutManager (Request Safety)
- **File:** `src/server/services/TimeoutManager.js`
- **Responsibility:** Enforces timeouts on async operations
- **Default timeouts:**
  - HTTP: 30s
  - WebSocket: 60s
  - Upload: 120s
  - Database: 10s

```javascript
const result = await timeoutManager.wrapPromise(
  fetchOperation(),
  30000,           // 30 second timeout
  'http',          // Resource type
  'fetch-user'     // Operation ID
)
```

#### 5. ShutdownManager (Graceful Termination)
- **File:** `src/server/resilience/ShutdownManager.js`
- **Responsibility:** Coordinates graceful shutdown sequence
- **Phases:**
  1. Stop accepting new requests (graceful: 30s)
  2. Wait for in-flight requests
  3. Force termination (timeout: 5s)

#### 6. ErrorTracker (Observability)
- **File:** `src/server/services/ErrorTracker.js`
- **Responsibility:** Captures and samples errors
- **Features:**
  - Error categorization
  - Stack trace preservation
  - Sampling (50% production, 100% dev)
  - Context attachment

#### 7. StructuredLogger (Logging)
- **File:** `src/core/utils/logging/index.js`
- **Responsibility:** Structured JSON logging to sinks
- **Sinks:**
  - ConsoleSink (development)
  - FileSink (production)
- **Levels:** debug, info, warn, error

### Middleware Pipeline

```javascript
// Order matters for middleware
1. RequestTracking          // Assign request ID + correlation
2. ErrorBoundary            // Catch unhandled exceptions
3. ResponseTiming           // Measure request duration
4. RateLimiting             // Per-endpoint limits
5. RequestValidation        // Schema validation
6. CircuitBreakerGuard      // Check circuit status
7. TimeoutWrapper           // Enforce timeouts
8. CORS                     // Cross-origin handling
9. Compression              // gzip/brotli
10. BodyParser              // JSON/multipart parsing
```

### Database System

**Current Implementation:** SQL.js (in-memory)

```javascript
// src/server/db.js
import initSqlJs from 'sql.js'

const SQL = await initSqlJs()
const db = new SQL.Database()

// Schema created programmatically (NO migrations)
db.exec(`
  CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, ...);
  CREATE TABLE IF NOT EXISTS blueprints (...);
  CREATE TABLE IF NOT EXISTS entities (...);
  CREATE TABLE IF NOT EXISTS files (...);
`)

// Indexes for performance
db.run('CREATE INDEX idx_blueprints_id ON blueprints(id)')
```

**Limitations:**
- ✗ In-memory only (no persistence by default)
- ✗ No concurrent access (single-threaded)
- ✗ Single process only
- ✓ Good for development/testing
- ✗ NOT suitable for production

**Required Upgrade Path:**
```javascript
// For PostgreSQL (from Hyperf):
const db = Knex({
  client: 'pg',
  connection: process.env.DB_URI,
  pool: { min: 2, max: 10 }
})

// OR for SQLite with persistence:
const db = Knex({
  client: 'better-sqlite3',
  connection: { filename: 'world/db.sqlite' }
})

// Then run migrations:
await migrate(db)  // Forward-only migration system
```

### Collections System

**How it works:**

```javascript
// src/server/collections.js
export async function initCollections({ collectionsDir, assetsDir }) {
  // 1. Scan collections directory
  const folderNames = fs.readdirSync(collectionsDir)

  // 2. Load each collection (default first)
  for (const folderName of folderNames) {
    // 3. Read manifest.json
    const manifest = fs.readJsonSync(`${folderName}/manifest.json`)
    const blueprints = []

    // 4. Load each app in collection
    for (const appFilename of manifest.apps) {
      const appFile = new File([buffer], appFilename)
      const app = await importApp(appFile)  // Unzip + parse

      // 5. Extract and save assets
      for (const asset of app.assets) {
        const arrayBuffer = await asset.file.arrayBuffer()
        await fs.writeFile(assetPath, Buffer.from(arrayBuffer))
      }

      // 6. Store blueprint
      blueprints.push(app.blueprint)
    }
  }
}
```

**Default Collections:**
- Model.hyp - 3D model rendering
- Image.hyp - 2D image display
- Video.hyp - Video playback
- Text.hyp - Text rendering

### API Routes Structure

```
GET  /                    → Home page (HTML)
GET  /api/status          → Server status + metrics
GET  /api/health          → Health check
GET  /api/metrics         → Performance metrics
POST /api/upload          → File upload endpoint
WS   /ws                  → WebSocket multiplayer

// Status page endpoints
GET  /api/status/summary  → JSON status summary
GET  /api/status/services → Service health details
GET  /api/status/history  → Incident history
GET  /status/stream       → Server-Sent Events
GET  /status              → HTML status page

// Admin routes
GET  /admin/circuit-breaker        → Breaker status
POST /admin/circuit-breaker/reset  → Reset circuit
GET  /admin/cors                   → CORS config
POST /admin/cors/update            → Update CORS
GET  /admin/degradation           → Degradation status
GET  /admin/rate-limit            → Rate limit stats
```

### Error Handling Pattern

```javascript
// 1. At boundaries (routes, services):
try {
  // operation
} catch (error) {
  // Attach context
  const trackedError = errorTracker.captureException(error, {
    category: 'Upload',
    module: 'FileHandler',
    operation: 'processFile',
    userId: req.user?.id,
    correlationId: req.id
  })

  // Return structured response
  reply.status(500).send(ErrorResponseBuilder.build(trackedError, {
    message: 'Upload failed',
    code: error.code || 'INTERNAL_ERROR'
  }))
}

// 2. Error shape:
{
  error: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds 50MB',
    details: { maxSize: 52428800, actual: 60000000 },
    timestamp: '2026-01-03T...',
    correlationId: 'req-uuid-123'
  }
}
```

### Configuration System

**Environment Variables (Required):**

```bash
# Server
PORT=3000
NODE_ENV=development

# World
WORLD=world

# Security
JWT_SECRET=your-secret-key
ADMIN_CODE=admin-code

# Timeouts (in milliseconds)
HTTP_TIMEOUT=30000
WS_TIMEOUT=60000
UPLOAD_TIMEOUT=120000
DB_TIMEOUT=10000

# Circuit Breaker Thresholds
DB_CIRCUIT_FAILURE_THRESHOLD=5
DB_CIRCUIT_SUCCESS_THRESHOLD=2
DB_CIRCUIT_TIMEOUT=60000

# Telemetry
TELEMETRY_ENABLED=true
TELEMETRY_ENDPOINT=null

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Upload
PUBLIC_MAX_UPLOAD_SIZE=52428800
PUBLIC_ASSETS_URL=/assets

# Network
PUBLIC_WS_URL=ws://localhost:3000
PUBLIC_API_URL=http://localhost:3000
```

**MasterConfig Class:**

```javascript
// src/server/config/MasterConfig.js
export class MasterConfig {
  static uploads = {
    maxFileSize: 52428800,  // 50MB
    blockedExtensions: ['exe', 'bat', 'cmd', ...]
  }

  static cors = {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',')
  }

  static timeouts = {
    http: 30000,
    websocket: 60000,
    upload: 120000,
    database: 10000
  }
}
```

### Hot Module Reload (HMR) System

**For Development Only:**

```javascript
// src/server/dev/ServerHMR.js
class ServerHMR {
  constructor(httpServer) {
    this.httpServer = httpServer
    this.watchers = new Map()
    this.clients = new Set()
  }

  // WebSocket connection for file change notifications
  // Client watches files and reloads automatically
}

// src/server/dev/HMRBridge.js
export function initHMRBridge(fastify) {
  // Connects HMR system to Fastify WebSocket
  // Enables hot reloading of modules
}
```

**How it works:**
1. Client connects WebSocket to HMR server
2. Server watches src/ directory
3. On file change, sends notification to client
4. Client reloads module and re-renders

### World Network Plugin

```javascript
// src/server/plugins/WorldNetworkPlugin.js
export async function registerWorldNetwork(
  fastify,
  world,
  logger,
  shutdownManager,
  errorTracker
) {
  // Sets up multiplayer synchronization
  // - Player connections/disconnections
  // - Entity position updates
  // - Message broadcasting
  // - Network tick at 60 FPS
}
```

### Performance Monitoring

```javascript
// world.performanceMonitor (accessible in routes)
const metrics = world.performanceMonitor?.getMetrics()
// Returns:
{
  fps: 30,
  deltaTime: 33.33,
  networkLatency: 45,
  entityCount: 250,
  playerCount: 5,
  tickDuration: 12.5
}
```

---

## Key Differences from Hyperf

### 1. Initialization Style
| Aspect | Hyperfy | Hyperf |
|--------|---------|--------|
| Pattern | Dependency Injection | Direct instantiation |
| Services | Managed via initializer | Singletons |
| Configuration | MasterConfig class | Environment only |
| Error handling | Centralized tracker | Console logging |

### 2. Database
| Aspect | Hyperfy | Hyperf |
|--------|---------|--------|
| Engine | SQL.js | Knex + PostgreSQL/SQLite |
| Persistence | None (memory) | File/database |
| Pooling | None | yes (pg pool) |
| Migrations | None | Forward-only system |

### 3. Asset Storage
| Aspect | Hyperfy | Hyperf |
|--------|---------|--------|
| Backends | Basic file system | S3 + Local |
| Configuration | Direct paths | Assets class abstraction |
| CDN support | None visible | AWS S3 support |

### 4. Build System
| Aspect | Hyperfy | Hyperf |
|--------|---------|--------|
| Scripts | None (empty) | npm scripts |
| Bundler | No external build | esbuild |
| HMR | ServerHMR class | Watch + reload |
| Output | ES modules | dist/ directory |

---

## Critical Path to Production

### Blocking Issues

**1. Database (MUST FIX)**
```javascript
// Current (BROKEN for production)
import initSqlJs from 'sql.js'
const db = new SQL.Database()  // In-memory, no persistence

// Required fix
import Knex from 'knex'
const db = Knex({
  client: process.env.DB_TYPE || 'pg',
  connection: process.env.DB_URI,
  pool: { min: 2, max: 10 }
})
await migrate(db)
```

**2. Asset Storage (MUST FIX)**
```javascript
// Current (unclear)
const assets = createAssets({ worldDir: assetsDir })

// Required fix
const assets = process.env.ASSETS === 's3'
  ? new AssetsS3({ bucket, region })
  : new AssetsLocal({ directory: assetsDir })
```

**3. Build Scripts (MUST FIX)**
```json
{
  "scripts": {
    "dev": "node src/server/index.js",
    "build": "node scripts/build.mjs",
    "start": "node build/index.js",
    "lint": "eslint src/",
    "test": "vitest"
  }
}
```

### Verification Checklist

- [ ] Start dev server successfully: `npm run dev`
- [ ] GET / returns home page
- [ ] GET /api/health returns 200
- [ ] POST /api/upload accepts and saves files
- [ ] WebSocket /ws connects for multiplayer
- [ ] Database persists after restart
- [ ] Assets accessible via /assets/
- [ ] Graceful shutdown on SIGTERM (30s window)
- [ ] No memory leaks after 1 hour idle
- [ ] Load test with 50 concurrent WebSocket connections

---

## Development Workflow

### Starting Dev Server

```bash
# Requires .env file with minimal config
PORT=3000
WORLD=world
JWT_SECRET=dev-secret
ADMIN_CODE=dev-admin
NODE_ENV=development

# Start
node src/server/index.js
# or via MCP
mcp__hyperfy-dev__start_dev_server({ port: 3000 })
```

### File Structure for Features

```
src/
├─ server/
│  ├─ routes/          ← API endpoint handlers
│  ├─ middleware/      ← Request/response processors
│  ├─ services/        ← Business logic
│  ├─ resilience/      ← Fault tolerance
│  ├─ config/          ← Configuration management
│  └─ db.js            ← Database interface
├─ core/
│  ├─ systems/         ← Game engine systems
│  └─ utils/           ← Shared utilities
└─ client/
   ├─ components/      ← React components
   └─ world-client.js  ← WebGL/Three.js renderer
```

### Adding a New Endpoint

```javascript
// 1. Create in src/server/routes/
export async function registerMyRoutes(fastify, world) {
  fastify.get('/api/my-endpoint', {
    preHandler: createRateLimiter('my-endpoint')
  }, async (req, reply) => {
    try {
      const timeoutManager = fastify.timeoutManager
      const result = await timeoutManager.wrapPromise(
        myOperation(),
        10000,
        'http',
        'my-endpoint'
      )
      reply.send(result)
    } catch (error) {
      fastify.errorTracker.captureException(error)
      reply.status(500).send({ error: error.message })
    }
  })
}

// 2. Register in src/server/routes/index.js
import { registerMyRoutes } from './MyRoutes.js'
export async function registerRoutes(fastify, world) {
  await registerMyRoutes(fastify, world)
  // ... other routes
}

// 3. Test
// GET /api/my-endpoint
```

---

## Monitoring & Debugging

### Status Endpoints

```bash
# Server health
curl http://localhost:3000/api/health

# Full status with metrics
curl http://localhost:3000/api/status

# Performance metrics
curl http://localhost:3000/api/metrics

# Circuit breaker status
curl http://localhost:3000/api/status/summary

# Service health details
curl http://localhost:3000/api/status/services

# Incident history
curl http://localhost:3000/api/status/history?limit=100
```

### Log Levels

```javascript
// Configure in ServerInitializer
logger.minLevel = env === 'production' ? 2 : 1
// 0 = debug
// 1 = info
// 2 = warn
// 3 = error
```

### Common Issues

**Issue:** Server won't start
```
Check:
1. PORT not in use: lsof -i :3000
2. WORLD directory exists
3. JWT_SECRET set
4. Logs in .dev-server.log
```

**Issue:** Database errors
```
Check:
1. SQL.js loaded: import initSqlJs from 'sql.js'
2. Tables created: db.exec(CREATE TABLE ...)
3. Indexes built: db.run(CREATE INDEX ...)
4. Prepared statements: stmt.bind(params)
```

**Issue:** Circuit breaker tripping
```
Check:
1. Failure threshold: GET /api/status/summary
2. Reset circuit: POST /admin/circuit-breaker/reset/database
3. Timeout settings: GET /api/metrics
```

---

## Performance Tuning

### Database Optimization

```javascript
// Add indexes for frequent queries
db.run(`CREATE INDEX idx_entities_worldId ON entities(worldId)`)
db.run(`CREATE INDEX idx_files_timestamp ON files(timestamp)`)

// Use prepared statements
const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
stmt.bind([userId])
while (stmt.step()) {
  // process row
}
```

### Memory Management

```javascript
// Monitor in status endpoint
const status = process.memoryUsage()
// heapUsed < 1GB check in health endpoint

// Disable telemetry if needed
TELEMETRY_ENABLED=false
```

### Network Optimization

```javascript
// Compression enabled via Fastify
@fastify/compress
// Reduces bandwidth for status endpoints

// WebSocket frame rate
TICK_RATE = 1/30  // 30 FPS = 33.3ms per tick
// Adjust in src/core/systems/Server.js
```

---

## Deployment Considerations

### Environment Setup

```bash
# Production .env
PORT=3000
NODE_ENV=production
WORLD=/data/world

# Database (MUST configure)
DB_TYPE=pg
DB_URI=postgresql://user:pass@host/db
DB_SCHEMA=public

# Security
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_CODE=$(openssl rand -base64 16)

# Telemetry
TELEMETRY_ENABLED=true
TELEMETRY_ENDPOINT=https://telemetry.example.com

# Timeouts (extended for production)
HTTP_TIMEOUT=60000
WS_TIMEOUT=120000
UPLOAD_TIMEOUT=300000

# Circuit breakers
DB_CIRCUIT_FAILURE_THRESHOLD=10
DB_CIRCUIT_TIMEOUT=120000

# CORS
CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

### Health Checks (for load balancers)

```bash
# Kubernetes liveness probe
GET /api/health
Expected: 200 { status: 'healthy' }

# Readiness probe
GET /api/status
Expected: 200 + server metrics
```

### Scaling Considerations

**Current limitations:**
- ✗ Single process (no clustering)
- ✗ In-memory database (no distributed state)
- ✗ WebSocket per-process only

**For horizontal scaling:**
1. Switch to PostgreSQL for shared state
2. Use Redis for session/cache
3. Implement Redis pub/sub for WebSocket broadcast
4. Use PM2 or Kubernetes for load balancing

---

## Summary

Hyperfy is a **production-oriented refactoring** of Hyperf with sophisticated fault tolerance and monitoring systems. However, it requires finalization of critical decisions (database, storage, build process) before deployment.

The architecture uses modern patterns (DI, managers, middleware pipeline) and is well-positioned for scaling once the blocking issues are resolved.

