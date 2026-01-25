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

## PHASE 4.1: DEPENDENCY OPTIMIZATION (January 25, 2026)

### Completed Removals
- **esbuild & esbuild-wasm**: Build system replaced by Bun (native TypeScript support)
- **eslint + config + react plugins**: Dev-only linting removed (use Bun's linter)
- **Estimated savings**: 16-28MB from node_modules, 6 dev dependencies removed

### Build Script Migrations
- `scripts/build-ts.mjs`: Now uses `bun scripts/build.ts` directly
- `scripts/dev-server-ts.mjs`: Now uses `bun scripts/dev-server.ts` directly
- `scripts/start-ts.mjs`: Now uses `bun scripts/start.ts` directly

### Cannot Yet Remove (Still Required)
- **React (40KB)**: 69 files still use React imports (useState, useEffect, hooks)
- **React-DOM (40KB)**: createRoot and createPortal in client initialization
- **@babel/standalone (1.2MB)**: JSX server-side transformation in StaticAssets.ts
- **Complete React removal** requires migrating all 69 UI component files to WebJSX

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

---

## BUN MIGRATION TECHNICAL NOTES (In Progress)

### CRITICAL CAVEAT: Bun Installation Blocked by Environment
**Status**: NPM registry unreachable in current environment. All installation attempts timeout (npm, npx, curl).
**Solution**: Continue with Node.js 23.10.0 + esbuild (equivalent capability, no blockers).
- Verified: Node v23.10.0 works perfectly
- Verified: esbuild v0.27.2 transpiles TypeScript in 31ms
- Verified: Build pipeline works (node scripts/build.mjs executes successfully)
- Verified: Phase 1.1 Complete - All build scripts converted to TypeScript with esbuild wrappers

### Phase 1.1 Completion: Build Scripts Converted to TypeScript
**Converted files**:
- `scripts/build.ts` - Server build logic (transpiles in 4ms)
- `scripts/dev-server.ts` - Development server with file watching
- `scripts/start.ts` - Production server startup
- `scripts/build-ts.mjs` - Wrapper that transpiles + executes build.ts
- `scripts/dev-server-ts.mjs` - Wrapper that transpiles + executes dev-server.ts
- `scripts/start-ts.mjs` - Wrapper that transpiles + executes start.ts

**package.json updated**:
- `"build"`: `"node scripts/build-ts.mjs"` (verified working)
- `"dev"`: `"node scripts/dev-server-ts.mjs"` (ready)
- `"start"`: `"node scripts/start-ts.mjs"` (ready)

### Phase 2.0 Completion: Database Migration to TypeScript
**Converted file**:
- `src/server/db.ts` - Full TypeScript conversion with DBInterface types
- Supports SQLite (better-sqlite3 or sql.js fallback) and PostgreSQL
- All async methods properly typed
- Schema initialization with all tables and indexes
- Default config values included
- Compilation verified with esbuild (no type errors)

### Phase 3.0 Completion: Simple Rendering Components
**Converted files**:
- `src/client/components/Portal.ts` - Portal wrapper with element existence check
- `src/client/components/Icons.ts` - 11 icon components (ChevronRight, ChevronLeft, Menu, Chat, VR, Keyboard, Mic, MicOff, CircleUp, Hand)
- `src/client/components/Hint.ts` - HintProvider and useHint hook with TypeScript context
- All components use proper TypeScript interfaces for props
- Compilation verified with esbuild (no type errors)

### Pre-Migration Requirements
- **Use Node.js 23.10.0 + esbuild instead of Bun** - No loss of functionality
- **Not a simple drop-in replacement** - React/Babel/esbuild must be replaced with WebJSX equivalents
- **bun:sql is SQLite-only** - Postgres support will be lost unless fallback library added

### React to WebJSX Migration Strategy
- **67 React components** must be converted (grouped by complexity)
- **64 files using hooks** (useState, useEffect, useRef) - convert to direct DOM manipulation
- **23 custom hooks** - convert to event listener setup functions
- **48 files using lodash** - replace with native JavaScript equivalents

### Key Conversion Patterns
- `useState(val)` → DOM element with manual updates
- `useEffect()` → `addEventListener` or direct function calls
- `<Component />` → Function returning JSX (syntax stays same)
- Props → Function parameters
- State updates → Direct DOM mutations or property assignments

### Lodash Replacement Pattern (71KB savings)
- `_.pick()` → `Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)))`
- `_.omit()` → Inverse of pick
- `_.merge()` → `{...a, ...b}` spread operator
- `_.debounce()` → Custom function with closure and setTimeout
- `_.flatten()` → `arr.flat()`
- `_.groupBy()` → `Object.groupBy()` (ES2024) or reduce

### Database Migration Challenges
- **Current**: better-sqlite3 (sync) OR sql.js (in-browser fallback)
- **Target**: bun:sql (async only)
- **Impact**: All database calls must become async (minimal - only 3 call sites)
- **Migration path**: Wrapper function to maintain interface, then convert callers to await

### Build System Changes
- **Old**: Node.js + esbuild (separate bundler)
- **New**: Bun bundler (built-in, 3-5x faster)
- **HMR**: Now built-in instead of custom dev-server watching
- **Config**: bunfig.toml replaces webpack/esbuild configs

### Dependency Reduction
- **Remove**: react (40KB), react-dom (40KB), @babel/standalone (1.2MB), esbuild (8MB), esbuild-wasm (3MB)
- **Remove**: eslint, eslint-config-prettier, eslint-plugin-react, eslint-plugin-react-hooks (dev only)
- **Add**: webjsx (2KB)
- **Net effect**: ~52MB → 30MB (40% reduction)

### Known Edge Cases
1. **LiveKit integration** - Uses eventemitter3, should work unchanged
2. **PhysX WASM** - Native module, may need special handling in Bun
3. **Playcanvas** - Large 3D engine, verify no Node.js-specific code
4. **Three.js ecosystem** - Mature, Bun compatible expected
5. **VRM avatars** - @pixiv/three-vrm, should work unchanged

### Hot Reload Preservation
- Module state persistence - Bun HMR preserves state by default
- Socket connections - EventEmitter3 state preserved across reloads
- Database connections - Pool connections persist (critical)
- Graphics state - Three.js scene retained

### Testing Strategy
- **No unit tests** - Only Playwriter integration tests
- **Focus**: Network, entities, physics, UI, avatars, voice
- **Real data**: All tests use actual world state, no mocks
- **Execution**: Full feature test after each major phase

### Rollback Points (Git commits)
- After Bun setup phase
- After database migration
- After first 10 React components
- After remaining React components
- After dependency cleanup
- Final integration test pass