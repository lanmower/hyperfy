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
- All core files require `.js` extensions for ESM imports
- Import paths assume SDK and Hyperfy remain as sibling directories: `../../hyperfy/src/core/`
- SDK re-exports all systems directly from Hyperfy

## System Architecture
- **47 total systems**: 16 client-only, 8 server-only, 23 shared
- **Dynamic Registration**: NodeRegistry (src/core/nodes/NodeRegistry.js) provides centralized node type registration
- **DI Pattern**: ServiceContainer exists but underutilized - most systems directly access `this.world.<system>`
- **Performance**: PlayerPhysics maintains module-scoped vector/quaternion pools - CRITICAL, cannot be extracted
- **Vector Pooling**: Platform tracking vectors shared across all player instances must stay in PlayerPhysics scope

## Control System
- **Priority System**: ControlPriorities uses numeric scale (0-6, lower = higher priority)
  - PLAYER(0), ENTITY(1), APP(2), BUILDER(3), ACTION(4), CORE_UI(5), POINTER(6)
- **ControlBindingManager**: Manages control binding and priority-based resolution
- **ButtonStateManager**: Tracks button state across keyboard/pointer/XR input
- **XR Input**: Lower priority than pointer lock for camera control

## UI System
- **Yoga Layout**: All UI nodes use Yoga for layout with canvas-based rendering
- **UIPropertyFactory**: Common Yoga properties (display, positioning, margins) centralized in src/core/nodes/ui/UIPropertyFactory.js
- **Resolution Scaling**: All position/dimension values multiplied by `ui._res` for DPI awareness

## Code Style
- **NO COMMENTS** in src/ - code should be self-evident, clarity through naming
- **KISS Principles**: Minimal abstractions, avoid premature optimization
- **Module Resolution**: All paths use explicit `.js` extensions
