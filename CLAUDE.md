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
- **Monolithic Systems** >600 LOC: ClientBuilder (676), ClientControls (729), Physics (pre-refactor was 611), ServerNetwork (607), ClientLoader (522), ErrorMonitor (475)
- **Coupling Risk**: 26 of 40 systems access world properties directly instead of through DI - enables circular dependencies
- **God Objects**: ErrorMonitor receives all error reports, World acts as service locator, ClientBuilder orchestrates builder operations, Entities mixes entity management with network sync
- **Missing Abstractions**: No InputSystem (scattered across ClientControls, ClientActions, ClientBuilder), no AudioSystem (in ClientLiveKit), no ResourceSystem (monolithic ClientLoader), no StateSync layer (in ServerNetwork + Entities)

## Phase 1 Refactoring: Player Physics & Control Extraction
- **PlayerLocal.js**: 834→696L (16.5% reduction via comment removal and physics state consolidation)
  - All physics state consolidated in PlayerPhysics - PlayerLocal reads state via this.physics.*
  - PlayerPhysics maintains 596L of physics calculations (ground detection, jump/fall state machine, velocity management)
  - PlayerInputHandler created but not yet fully integrated (existing logic still in PlayerLocal.update)
- **ClientControls.js**: 768→729L (5% reduction via comment removal)
  - ButtonStateManager extracted to `src/core/systems/controls/ButtonStateManager.js` (80L)
  - ControlBindingManager extracted to `src/core/systems/controls/ControlBindingManager.js` (~90L)
  - ClientControls still uses buttonsDown Set directly (managers exist but not yet integrated)
- **NO COMMENTS**: All player and control system files have comments removed per architecture directive
- **Vector Pooling**: PlayerPhysics maintains module-scoped vector/quaternion pools (CRITICAL - must not be extracted for performance)

