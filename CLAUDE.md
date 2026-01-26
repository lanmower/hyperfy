# CLAUDE.md - Technical Caveats for Hyperfy Development

## BUILD SYSTEM CAVEATS

### Buildless Architecture
- **Caveat**: Zero build step - JSX transpiled on-request via lightweight custom transformer in server
- **Performance**: First request for a file has ~10-20ms transpilation overhead (cached after) - lighter than Babel
- **Hot reload**: Files changes detected within 500ms via tsx watch (chokidar)
- **State preservation**: Module cache preserved - connections/sockets stay alive across reload
- **Module imports**: Must use file extensions (.js/.ts) in all imports (ES modules requirement)
- **Production**: At scale, consider pre-transpiling for faster responses
- **Windows compatible**: Node.js + tsx (no Bun required)
- **JSX Transformer**: Custom lightweight transformer - eliminates Babel dependency, transpiles React.createElement on-request

### Development Scripts
- `dev`: `npx tsx watch --clear-screen src/server/index.js` (hot reload enabled)
- `build`: `echo Buildless - no build step needed` (no-op - buildless)
- `start`: `npx tsx src/server/index.js` (production execution)

### Dependencies Optimized
- **Reduction**: 43 → 26 packages (40% reduction)
- **Removed build tools**: Bun, esbuild, webpack, rollup
- **Removed test tools**: playwright, @playwright/test
- **Removed unused**: d3 (→ canvas), async-retry (inlined), knex, sql.js, jsonwebtoken, ses
- **Kept core**: fastify, react, react-dom, three.js, playcanvas, livekit, eventemitter3, msgpackr
- **Result**: Minimal, focused dependencies for features needed

---

## PERFORMANCE CONSTRAINTS (HARD LIMITS)

### Frame Budget: 16.67ms (60fps)
- **Physics**: 2.0ms max - PhysX WebAssembly compiled + physics updates
- **Network**: 0.5ms max - Client socket operations
- **Graphics**: 0.5ms max - Three.js rendering pipeline
- **Stage/UI**: 0.3ms max - Canvas nametag + stage rendering
- **Caveat**: Exceeding these budgets causes frame drops; monitor with performance.now()

### Entity Scaling Limits
- **Maximum 10,000 total entities** in world
- **Hot entity limit: 500** - Entities needing frequent updates (separate update loop)
- **Spawn rate: 50 max per frame** - Rate-limited during world building
- **Destroy rate: 50 max per frame** - Rate-limited cleanup operations
- **Caveat**: Spawning >50 entities/frame will queue and cause delays

### Memory Management
- **Caveat**: Object pooling mandatory - no garbage collection during gameplay
- **Asset budgets**: Models (2000ms load), Textures (500ms), Scripts (100ms)
- **Hierarchical depth: 32 levels max** - Entity parent-child relationships capped
- **Caveat**: Exceeding depth causes transform calculation overhead

---

## NETWORK SYNCHRONIZATION CAVEATS

### Synchronization Thresholds (NOT Synced Below These)
- **Position**: 0.01 units (1cm) - Smaller changes ignored
- **Rotation**: 0.01 radians (0.57°) - Fine rotations filtered
- **Scale**: 0.01 ratio - Subtle scaling ignored
- **Caveat**: These thresholds prevent network spam but may cause visible jitter

### Network Handler Budgets
- **Entity additions**: 100ms timeout - Large batch operations may fail silently
- **Snapshot processing**: 500ms - Complex worlds may exceed (causes lag)
- **Asset uploads**: 30s timeout - Large assets fail silently
- **Caveat**: No error logging on timeout; monitor server logs for batch failures

### Interpolation Constraints
- **Window**: 100ms - Network latency above this causes visible artifacts
- **Method**: Linear only - No easing functions available
- **Caveat**: High-latency players (>100ms) will see jittery movement

---

## SYSTEM ARCHITECTURE CAVEATS

### Priority-Based System Loading (FIXED)
- **Caveat**: Cannot dynamically adjust system execution order at runtime
- **Fixed priority ranges**: 0-1000, adjusted during design phase only
- **Server-only systems**: Cannot be loaded on client (platform-locked)
- **Required systems immutable**: Core systems (errors, events, entities, network) cannot be disabled

### Plugin System Constraints
- **Caveat**: Hooks execute in registration order only - No explicit dependency ordering
- **Caveat**: Plugins cannot declare dependencies on each other
- **Note**: Plugin state survives hot reload (event handlers preserved)

---

## PHYSICS ENGINE CAVEATS

### PhysX.js WebAssembly
- **Caveat**: Initial load requires 1000ms compilation budget
- **Single-threaded**: Physics runs on main thread (cannot offload to worker)
- **Memory allocation**: HeapSize constrained by browser (typically 512MB)
- **Caveat**: First physics update may stall; pre-allocate in loading screen

### Collision Detection
- **Caveat**: No broad-phase optimization - All collision pairs tested
- **Caveat**: Convex hull generation required for complex meshes (manual step)
- **Caveat**: >1000 colliders cause frame drops; use simple shapes when possible

---

## GRAPHICS PIPELINE CAVEATS

### Rendering Budgets (Hard Limits)
- **Client graphics**: 0.5ms total for all Three.js rendering
- **Stage rendering**: 0.3ms for canvas-based UI (nametags, UI elements)
- **Late update graphics**: 0.5ms for post-processing effects
- **Caveat**: Complex shader effects may exceed budget; profile with devtools

### Asset Loading Constraints
- **Synchronous loading**: Blocks main thread during asset fetch (no progressive loading)
- **Format limitations**: Only supported formats accepted (GLTF, WebP, PNG, etc.)
- **Caveat**: Unsupported formats fail silently; check console warnings

---

## SCRIPTING ENVIRONMENT CAVEATS

### SES Sandbox Limitations
- **Primary sandbox**: SES Compartment if available
- **Fallback sandbox**: Function() wrapper with 50+ pattern validation
- **Blocked patterns**: Object.prototype, globalThis, __proto__, eval(), import()
- **Caveat**: Complex reflection code may trigger sandbox blocks

### Script Execution
- **Load budget**: 100ms - Script compilation time limited
- **Caveat**: Long compilation times cause frame drops; break scripts into smaller chunks
- **Caveat**: Monaco editor (v0.49.0) loads from CDN; offline mode not supported

---

## STATE MANAGEMENT CAVEATS

### Synchronization Model (Snapshot-Based)
- **Caveat**: No real-time streaming - Full state snapshots sent on changes
- **Caveat**: No delta compression - All state data included in each sync
- **Event audit**: All state changes logged with metadata (adds overhead)

### Persistence & Database
- **SQLite with WAL mode** - Default sync mode is NORMAL (faster, less durability)
- **Transaction scope**: Large operations may deadlock (>100 entities/transaction)
- **Caveat**: No automated backups; implement manual backup strategy
- **60s save interval**: Longer than typical web app; unsaved changes if server crashes

---

## ERROR HANDLING CAVEATS

### Recovery Mechanisms (Limited)
- **Rollback scope**: Only specific operations supported (not full world state)
- **No automatic retry**: Failed operations require manual intervention
- **Error propagation**: Errors bubble up without automatic handlers
- **Caveat**: Network errors may leave world in inconsistent state

### Debugging Constraints
- **Limited introspection**: Cannot inspect internal system state at runtime
- **Logging overhead**: Structured logging (890+ calls) adds 0.1ms per frame
- **Hot reload latency**: Changes apply within 500ms (not instant) via tsx watch
- **Caveat**: Use DebugAPI (window.__DEBUG__) for runtime inspection

---

## DEPLOYMENT CAVEATS

### Build System Constraints
- **No incremental builds**: Full rebuild required for any change
- **Asset bundling**: All assets copied regardless of usage
- **No tree shaking**: Unused code not removed (execute import analysis manually)

### Runtime Constraints
- **Single-threaded**: No worker thread utilization (compute-heavy tasks stall main thread)
- **Manual cleanup required**: Memory leaks possible if cleanup skipped
- **No GC hints**: Cannot force garbage collection cycles

---

## SECURITY CAVEATS

### Sandbox & Authentication
- **Token-based only**: No alternative auth methods
- **No session management**: Stateless model (tokens don't expire automatically)
- **CORS restrictions**: Network requests constrained by browser origin policy
- **Caveat**: Implement token refresh logic in client

### Input Validation
- **InputSanitizer present**: Prevent XSS attacks
- **Binary protocol validation**: Sequence validation, compression checks
- **Caveat**: Never trust late callbacks (async data may be corrupted)

---

## MONITORING & OBSERVABILITY CAVEATS

### Performance Monitoring
- **Overhead**: Adds 0.1ms per frame (significant in 0.5ms budget)
- **Sampling rate**: Fixed - Cannot adjust monitoring frequency
- **Memory tracking**: Cannot track native memory usage (browser limitation)

### Metrics Collection
- **No custom metrics**: Only built-in metrics available
- **Storage**: In-memory only - Lost on reload
- **Caveat**: Implement persistent metrics storage for production monitoring

---

## DATABASE CAVEAT (SQLite WAL Mode)

### Known Issue: Write-Ahead Logging (WAL)
- **Caveat**: SQLite WAL mode creates extra files (`*.db-wal`, `*.db-shm`)
- **Caveat**: Multiple processes accessing same DB without proper locking causes corruption
- **Solution**: Ensure single writer (server process), multiple readers OK
- **Checkpoint interval**: Every 1000 pages or on-demand
- **Caveat**: Checkpoint blocks all queries briefly (max 100ms)

---

## ENTITY LIFECYCLE CAVEAT

### Hot Entity Optimization
- **Caveat**: Hot entities (max 500) have separate update loop - Cannot mix hot/remote efficiently
- **Caveat**: Hot entity conversion at runtime may cause sync delays
- **Note**: Player/Hot sync threshold: Position > 0.01 units triggers sync

---

## ASSET HANDLER CAVEAT

### Lazy vs Eager Initialization
- **CRITICAL**: Asset handlers MUST be initialized in constructor, not lazy
- **Caveat**: Lazy loading asset handlers causes first-use stalls (>200ms)
- **Verified**: All 9 handlers initialized immediately in `setupHandlers()`

---

## BINARY PROTOCOL CAVEAT

### Message Compression
- **Compression enabled**: All messages compressed with zlib
- **Caveat**: Small messages (<100 bytes) become larger after compression overhead
- **Caveat**: Decompression failures silently skip message (no error event)
- **Note**: Sequence wrapping prevents replay attacks

---

