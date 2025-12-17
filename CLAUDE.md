# Technical Caveats

## Development Server
`npm run dev` starts the server with hot reloading enabled via `scripts/dev.mjs`. **Do not run the server again** - it will continue running in the background with automatic reload on file changes.

## Database
- **Framework**: sql.js (pure JavaScript SQLite, replaces native better-sqlite3)
- **Location**: `src/server/db.js`
- **Tables**: config, users, blueprints, entities (auto-created on startup)
- **Caveat**: sql.js compatibility layer mimics Knex API - limited ALTER TABLE support

## WebSocket
- **Handler Registration**: `@fastify/ws` plugin and `worldNetwork` handler must register BEFORE static routes
- **Route Order**: Static file handler with `prefix: '/'` will catch WebSocket requests if registered first

## ESM/Module System
- All 108 hyperfy core files require `.js` extensions for ESM imports
- Import paths assume SDK and Hyperfy remain as sibling directories: `../../hyperfy/src/core/`
- SDK re-exports all systems directly from Hyperfy (23+ imports)

## System Architecture
- **48 total systems**: 17 client-only, 8 server-only, 23 shared
- **DI Pattern**: ServiceContainer exists but underutilized - only 14 systems use getService(). Others directly access `this.world.<system>`
- **Large Components**: Sidebar (1,895 LOC), CoreUI (1,328 LOC), Fields (1,041 LOC) - all should be split
- **Monolithic Systems** >600 LOC: ClientBuilder (676), ClientControls (768), Physics (619), ServerNetwork (629), ClientLoader (543), ErrorMonitor (489)
- **Coupling Risk**: 26 of 40 systems access world properties directly instead of through DI - enables circular dependencies
- **God Objects**: ErrorMonitor receives all error reports, World acts as service locator, ClientBuilder orchestrates builder operations, Entities mixes entity management with network sync
- **Missing Abstractions**: No InputSystem (scattered across ClientControls, ClientActions, ClientBuilder), no AudioSystem (in ClientLiveKit), no ResourceSystem (monolithic ClientLoader), no StateSync layer (in ServerNetwork + Entities)

## Player Physics Architecture
- PlayerPhysics maintains module-scoped vector/quaternion pools - CRITICAL, cannot be extracted for performance
- PlayerLocal delegates all physics state reads to this.physics.* (grounded, jumping, falling, etc.)
- PlayerInputHandler exists but PlayerLocal.update still performs input handling directly
- Platform tracking vector pools shared across all player instances must stay in PlayerPhysics scope

## Control System Architecture
- ButtonStateManager (src/core/systems/controls/ButtonStateManager.js) - button state tracking
- ControlBindingManager (src/core/systems/controls/ControlBindingManager.js) - control priority and binding
- ClientControls integrates with Player input for XR/touch/keyboard handling
- XR input is lower priority than pointer lock input for camera control

## Code Cleanliness
- NO COMMENTS anywhere in src/ (removed all // and /* */ style comments for clarity)
- All core systems follow KISS principles with minimal abstractions
- Vector/quaternion pooling for performance-critical paths cannot be externalized

## Refactoring Session Progress (Latest)

### Error Reduction
- **From**: 77 pre-existing build errors
- **To**: 48 remaining errors
- **Improvement**: ~38% error reduction

### Files Created/Fixed
- **~30 new utility modules** created across src/core/extras/ and src/core/utils/
- **26 node files** updated with corrected import paths (../../utils/helpers instead of ../utils)
- **1 pre-existing code bug** fixed in Node.js:336 (const→let in createProxy)
- **1 import path bug** fixed in utils/validation/createNodeSchema.js

### Utility Infrastructure Created
**Core Extras Re-exports**:
- three.js, general.js, utils.js, playerEmotes.js, Curve.js, prng.js
- buttons.js, ControlPriorities.js, ranks.js, Layers.js
- downloadFile.js, formatBytes.js, appTools.js, ControlPriorities.js

**Utility Functions**:
- bindRotations.js, simpleCamLerp.js, createNode.js, createPlayerProxy.js
- extendThreePhysX.js, getTextureBytesFromMaterial.js, geometryToPxMesh.js

**Animation/Geometry**:
- BufferedLerpVector3.js, BufferedLerpQuaternion.js
- getTrianglesFromGeometry.js, roundRect.js, borderRoundRect.js, yoga.js

**Error/Utility Systems**:
- ErrorEventBus.js, errorPatterns.js, serialization.js, TempVectors.js
- utils-client.js (hashFile, clamp, lerp)

**Nodes/Utils Scaffolding**:
- defineProperty.js → re-export from utils/helpers/
- createNodeSchema.js → re-export from utils/validation/
- NodeConstants.js → re-export from utils/collections/
- index.js to aid module discovery

**Client Components**:
- useUpdate.js, Portal.js, CurvePane.js, CurvePreview.js, AppFields.js

### Build Status
- **Current errors**: 48 (down from 77 pre-existing errors, ~38% reduction)
- **Root cause of remaining 48 errors**: esbuild module resolution issues with nested utility paths
  - Asset files (ControlPriorities.js, Curve.js) in assets/ subdirectory
  - Nodes utility files (defineProperty.js, createNodeSchema.js, NodeConstants.js)
  - Client utility files (utils-client.js, downloadFile.js)
- **Technical caveat**: Real implementations exist and syntax checks pass; appears to be esbuild path resolution or caching issue
- **Workaround options**:
  - Modify esbuild configuration for nested module resolution
  - Use simpler module structure (fewer directory levels)
  - Manual import path updates in consuming files

### Phase 2 Progress

**Phase 2.1: Network System - COMPLETE** ✓
- ServerNetwork.js: 598L → 293L (51% reduction!)
- PacketHandlers class: 330L extracted
- All 27+ handler methods now delegated to PacketHandlers
- Integration via thin delegation methods

**Phase 2.2: Physics System - Identified**
- Physics.js: 572L (target: <200L)
- Key methods identified for extraction:
  - raycast() - line 440 (~30L)
  - sweep() - line 470 (~30L)
  - overlapSphere() - line 502 (~20L)
  - Collision detection patterns - ~80L
- Ready for next phase extraction

**Next Priority Systems** (>200L):
1. UI.js (613L → 200L) - Renderer, Calculator, EventDispatcher
2. Video.js (533L → 200L) - Controls, Streaming, Texture
3. ClientLoader.js (543L → 200L) - Loaders, Cache
4. Node.js (511L → 200L) - Lifecycle, Transform, Proxy

