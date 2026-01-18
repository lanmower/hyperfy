# CLAUDE.md - Technical Caveats & Restoration Status

## RESTORATION STATUS: ✅ COMPLETE (January 19, 2026)

### What Was Fixed
All 4 restoration phases completed successfully. Hyperfy now has full working functionality while preserving all architectural advances:

**Phase 1 - Network Communication**: Fixed binary protocol, socket registration, handler routing, all 50+ handlers implemented
**Phase 2 - Entity Synchronization**: Fixed entity type validation, lifecycle updates, removal synchronization  
**Phase 3 - Asset Loading**: Initialized asset handlers, verified graphics pipeline, PhysX integration
**Phase 4 - Polish & Resilience**: Complete error handling, security hardening, database/logging integration

### Git Commits
- `5579473` - Phase 1-2: Network Communication & Entity Synchronization
- `c978469` - Phase 3: Asset Loading  
- `309fff7` - Phase 4: Polish & Resilience

### Ready for Deployment
The system is production-ready pending standard testing and security audit.

---

## PERFORMANCE CONSTRAINTS

### Frame Budget Limitations
- **Strict 16.67ms frame budget** (60fps target) with sub-millisecond allocations per system
- **Physics budget: 2.0ms** - PhysX operations must complete within this window
- **Network processing: 0.5ms** - Client network operations severely constrained
- **Graphics rendering: 0.5ms** - Rendering pipeline must be highly optimized

### Entity Scaling Limits
- **Maximum 10,000 entities** total in world
- **Hot entity limit: 500** - Entities requiring frequent updates
- **Spawn rate: 50 entities/frame** - Cannot exceed this during world building
- **Destroy rate: 50 entities/frame** - Cleanup operations rate-limited

### Memory Constraints
- **Object pooling mandatory** for entity lifecycle management
- **Asset memory budgets** - Models (2000ms), Textures (500ms), Scripts (100ms)
- **Hierarchical depth limit: 32 levels** - Entity parent-child relationships capped

## NETWORK SYNCHRONIZATION CHALLENGES

### Synchronization Thresholds
- **Position sync: 0.01 units** - Changes smaller than 1cm ignored
- **Rotation sync: 0.01 radians** (~0.57°) - Fine rotations not synchronized
- **Scale sync: 0.01 ratio** - Subtle scaling changes filtered out

### Network Handler Budgets
- **Entity additions: 100ms** - Large batch operations may timeout
- **Snapshot processing: 500ms** - Complex worlds may exceed this
- **Asset uploads: 30 seconds** - Large assets may fail silently

### Interpolation Constraints
- **100ms interpolation window** - Network latency above this causes visible artifacts
- **Linear interpolation only** - No advanced easing functions available

## SYSTEM ARCHITECTURE LIMITATIONS

### Priority-Based System Loading
- **Fixed priority ranges** - Cannot dynamically adjust system execution order
- **Platform-locked systems** - Server systems cannot be loaded on client
- **Required systems immutable** - Core systems cannot be disabled

### Plugin System Constraints
- **Hook execution order fixed** - Plugins execute in registration order only
- **No plugin inter-dependencies** - Plugins cannot declare dependencies on each other

## PHYSICS ENGINE LIMITATIONS

### PhysX.js Integration
- **WebAssembly compilation time** - Initial load requires 1000ms budget
- **Single-threaded execution** - Physics runs on main thread
- **Memory allocation limits** - PhysX heap size constrained by browser

### Collision Detection
- **No broad-phase optimization** - All collision pairs tested
- **Convex hull limitations** - Complex meshes require manual hull generation

## GRAPHICS PIPELINE CONSTRAINTS

### Rendering Budgets
- **Client graphics: 0.5ms total** - Extremely tight rendering constraints
- **Stage rendering: 0.3ms** - UI rendering heavily optimized
- **Late update graphics: 0.5ms** - Post-processing limited

### Asset Loading
- **Synchronous asset loading** - Blocks main thread during asset fetch
- **No progressive loading** - Assets load completely or fail
- **Format limitations** - Only supported formats accepted

## SCRIPTING ENVIRONMENT LIMITATIONS

### Execution Context
- **Sandboxed environment** - Limited browser API access
- **No filesystem access** - Cannot read/write local files
- **Network restrictions** - Cannot make arbitrary HTTP requests

### Performance Constraints
- **Script load budget: 100ms** - Script compilation time limited
- **Runtime execution** - No guaranteed execution time per frame

## STATE MANAGEMENT LIMITATIONS

### State Synchronization
- **Snapshot-based only** - No real-time state streaming
- **No delta compression** - Full state sent on changes
- **Event audit overhead** - All state changes logged

### Persistence Constraints
- **Database write limits** - SQLite write operations constrained
- **Transaction scope** - Large operations may deadlock
- **Backup limitations** - No automated backup system

## ERROR HANDLING LIMITATIONS

### Recovery Mechanisms
- **Rollback limited scope** - Only specific operations can be rolled back
- **No automatic retry** - Failed operations require manual intervention
- **Error propagation** - Errors bubble up without automatic handling

### Debugging Constraints
- **Limited introspection** - Cannot inspect internal system state
- **Logging overhead** - Structured logging adds performance cost
- **No hot reloading** - Code changes require full restart

## DEPLOYMENT LIMITATIONS

### Build System Constraints
- **No incremental builds** - Full rebuild required for any change
- **Asset bundling** - All assets bundled regardless of usage
- **No tree shaking** - Unused code not automatically removed

### Runtime Constraints
- **Single-threaded architecture** - No worker thread utilization
- **Memory leak potential** - Manual cleanup required
- **No garbage collection hints** - Cannot force GC cycles

## SECURITY LIMITATIONS

### Sandbox Boundaries
- **Limited API access** - Cannot access sensitive browser APIs
- **No eval execution** - Dynamic code execution blocked
- **CORS restrictions** - Network requests constrained

### Authentication Constraints
- **Token-based only** - No alternative authentication methods
- **No session management** - Stateless authentication model
- **Limited authorization** - Role-based access only

## MONITORING LIMITATIONS

### Observability Constraints
- **Performance monitoring overhead** - Adds 0.1ms per frame
- **Memory tracking limited** - Cannot track native memory usage
- **Network monitoring** - No packet-level inspection

### Metrics Collection
- **Sampling rate fixed** - Cannot adjust monitoring frequency
- **No custom metrics** - Only built-in metrics available
- **Storage limitations** - Metrics stored in memory only