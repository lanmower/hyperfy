# CLAUDE.md - Hyperfy Physics Server Technical Caveats

## SERVER ARCHITECTURE

### Buildless Architecture
- Zero build step - Server runs Node.js files directly with tsx
- Hot reload: File changes detected within 500ms via tsx watch
- State preservation: Module cache preserved - connections/sockets stay alive across reload

### Dependencies Optimized
- **Core**: fastify, react, react-dom, three.js, playcanvas, livekit, eventemitter3, msgpackr
- **Removed**: All client-side UI libs, test tools, build tools
- **Result**: Minimal, focused dependencies for server physics engine

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

## PERFORMANCE CONSTRAINTS (HARD LIMITS)

### Frame Budget: 16.67ms (60fps)
- **Physics**: 2.0ms max - PhysX WebAssembly compiled + physics updates
- **Network**: 0.5ms max - WebSocket operations
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
- **Verified**: All asset handlers initialized immediately in `setupHandlers()`

---

## BINARY PROTOCOL CAVEAT

### Message Compression
- **Compression enabled**: All messages compressed with zlib
- **Caveat**: Small messages (<100 bytes) become larger after compression overhead
- **Caveat**: Decompression failures silently skip message (no error event)
- **Note**: Sequence wrapping prevents replay attacks

---

## PLAYCANVAS DEPENDENCY CAVEAT

### Critical Dependency
- **Caveat**: playcanvas ^2.14.4 is required in dependencies
- **Reason**: NametagRenderer requires playcanvas for Texture creation
- **Verified**: playcanvas must be kept in package.json dependencies
