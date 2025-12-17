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
- All hyperfy core files require `.js` extensions for ESM imports
- Import paths assume SDK and Hyperfy remain as sibling directories: `../../hyperfy/src/core/`
- SDK re-exports all systems directly from Hyperfy

## System Architecture
- **DI Pattern**: ServiceContainer exists but underutilized - most systems directly access `this.world.<system>`
- **Coupling Risk**: Many systems access world properties directly instead of through dependency injection
- **God Objects**: World acts as service locator, Entities mixes entity management with network sync

## Player Physics Architecture
- PlayerPhysics maintains module-scoped vector/quaternion pools - CRITICAL, cannot be extracted for performance
- PlayerLocal delegates all physics state reads to this.physics.* (grounded, jumping, falling, etc.)
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
