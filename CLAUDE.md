Hyperfy Technical Caveats

PlayCanvas Module Initialization
- window.pc must be a mutable object, not the ES module itself (which is read-only)
- Solution: Use Object.assign({}, pc) in index.js to create a plain object copy
- ClientGraphics can then safely assign window.pc.app = this.app
- window.pc exports all PlayCanvas constants and classes; app property added at runtime
- Rendering initializes at 30+ FPS; frame counter increments as app runs

PlayCanvas/THREE.js Hybrid Architecture
- Graphics system uses PlayCanvas for rendering (Application, Entity, Component system)
- ClientGraphics.render() syncs camera, viewport, and rendering state every frame
- Camera elevation: player.y + DEFAULT_CAM_HEIGHT (1.2) puts camera at y=11.2 for spawn at (0,10,0)
- Terrain visible below, sky visible above; third-person perspective functional

Player Spawn Elevation
- Default spawn position: (0, 10, 0) - 10 units above terrain baseline
- WorldPersistence.loadSpawn() returns this default if no stored config in database
- Camera syncs via PlayerController.initCamera() which applies camHeight offset
- Gravity and physics work correctly from this elevation

Development Mode No-Cache Headers
- Server sends Cache-Control: no-cache, no-store headers in dev mode
- Prevents stale asset delivery during HMR (hot module reload)
- Browser auto-reloads on WebSocket file-change messages from server
- Manual page refresh not required; changes immediately visible

WebSocket Multiplayer System
- Real-time player synchronization via ServerNetwork and ClientNetwork
- Player state updates broadcast to all connected clients
- Connection state exposed via PlayerConnectionManager
- No persistent session storage; game-session-only lifetime

Asset Storage System
- Local storage default (world/assets/ directory)
- S3 disabled by default (AWS SDK not required)
- Circuit breaker on upload prevents cascading failures
- Asset references tracked via entity node system

Game Loop Synchronous, Plugin Hooks Async
- WorldTickLoop.tick() is synchronous; cannot await plugin hooks
- world.pluginHooks.execute() returns Promise; use fire-and-forget with .catch()
- Blocking plugin hooks will stall frame logic; async work must not block render
- Frame skips visible if plugin hooks run long

Export Locations
- getRef/secureRef functions in NodeProxy.js (NOT Node.js)
- Node class in Node.js (separate from NodeProxy.js)
- Misconfigured imports cause module resolution failures

Circuit Breakers
- Database, storage, websocket, upload all have circuit breakers
- Breakers prevent cascading failures; fail fast visible in logs
- Rate limiting configured at server startup

SQL.js In-Memory Database
- Current: SQL.js (all data lost on server restart)
- Production deployment requires PostgreSQL or SQLite with persistence
- Parameter binding mandatory: stmt.bind([params]) before stmt.step()
- Custom QueryBuilder available at C:\dev\hyperfy\src\server\QueryBuilder.js
