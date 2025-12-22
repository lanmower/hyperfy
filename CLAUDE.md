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
- **Monolithic Systems** >600 LOC: ClientBuilder (676)
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

## Debugging & Troubleshooting Guide

### Script Execution & API Configuration

**Critical Issue: ProxyFactory Parameter Passing**
- **Problem**: ProxyFactory was passing only `entity` to API methods, but AppAPIConfig and WorldAPIConfig methods expect `(apps, entity, ...args)`
- **Fix**: Updated ProxyFactory to pass both `apps` and `entity`: `apps.appMethods[key](apps, entity, ...args)`
- **Files Affected**: `src/core/entities/app/ProxyFactory.js`
- **Lesson**: API method signatures must match proxy invocation signatures exactly

**Critical Issue: CommonJS require() in Browser Context**
- **Problem**: WorldAPIConfig and AppAPIConfig were using CommonJS `require()` which doesn't work in SES compartment or browser
- **Examples**: `require('../../extras/three.js')`, `require('lodash-es')`, etc.
- **Fix**: Convert all requires to ES6 imports at module level
- **Files Affected**: `src/core/systems/apps/WorldAPIConfig.js`, `src/core/systems/apps/AppAPIConfig.js`
- **Lesson**: Browser code cannot use require(), must use ES6 imports

**Blueprint Data Flow (Client-Side)**
1. Server sends snapshot with blueprints array
2. ClientNetwork.onSnapshot() → SnapshotProcessor.process() → SnapshotCodec.deserializeState()
3. Blueprints.deserialize() stores in `world.blueprints.items` Map
4. Entities.deserialize() → EntitySpawner.spawn() → App constructor
5. App.build() → BlueprintLoader.load() retrieves blueprint from `world.blueprints.get(blueprintId)`
6. BlueprintLoader sets `this.app.blueprint = blueprintData`
7. ScriptExecutor receives `blueprint.props` as 4th parameter to script
8. Script accesses props via function parameter: `(world, app, fetch, props, setTimeout) => { ... }`

**Script Parameter Order (CRITICAL)**
```javascript
// Script wrapper signature:
(world, app, fetch, props, setTimeout) => { ... }

// ScriptExecutor.executeScript() call order MUST match:
evaluated.exec(
  getWorldProxy(),        // 1st: world
  getAppProxy(),          // 2nd: app
  fetchFn,                // 3rd: fetch
  blueprint.props,        // 4th: props
  setTimeoutFn            // 5th: setTimeout
)

// App.build() call order MUST match ScriptExecutor signature:
this.scriptExecutor.executeScript(
  script,                               // scriptCode
  blueprint,                            // blueprint
  blueprint.props,                      // props
  this.setTimeout,                      // setTimeoutFn
  this.getWorldProxy.bind(this),       // getWorldProxy
  this.getAppProxy.bind(this),         // getAppProxy
  this.fetch                           // fetchFn
)
```

**SES Compartment Globals**
Available in script context (defined in Scripts.js constructor):
- console (log, warn, error, time, timeEnd)
- Date.now
- URL.createObjectURL
- Object methods (keys, values, entries, assign, create, defineProperty, getOwnPropertyNames, getOwnPropertyDescriptor)
- Math
- THREE classes: Object3D, Quaternion, Vector3, Euler, Matrix4
- Utilities: BufferedLerpVector3, BufferedLerpQuaternion, Curve, DEG2RAD, RAD2DEG, uuid, num, prng, clamp
- Blocked: eval, harden, lockdown (explicitly set to undefined)

**API Configuration Getters with Undefined Handling**
- Always use optional chaining for blueprint access: `entity.blueprint?.props`
- Provide default values: `entity.blueprint?.props || {}`
- AppAPIConfig getters: instanceId, version, modelUrl, state, props, keepActive
- WorldAPIConfig getters: networkId, isServer, isClient, props

**Script Execution Error Handling**
- Scripts wrapped in try-catch to handle runtime errors gracefully
- Errors logged as: `[Script] Error executing app script: <message>`
- Partial execution allowed: nodes created before error remain in scene
- Critical for production: scripts should not crash if props/world state incomplete

### Node Creation & Management

**AppAPIConfig.create() Method**
- Signature: `create: (apps, entity, name, data) => { ... }`
- Creates Three.js node via `entity.createNode(name, data)`
- Calls `node.getProxy?.() || node` to return node or proxy
- Must handle nodes without getProxy() method

**World Node Management**
- `world.add(node)`: Adds node to world, activates it
- `world.remove(node)`: Removes from world, deactivates it
- `world.attach(node)`: Detaches from parent, preserves world transform
- Nodes stored in `entity.worldNodes` Set
- All manipulations trigger node.activate/deactivate lifecycle

### Development Workflow

**File Changes & Hot Reload**
- Client code changes trigger client rebuild (~30s)
- Server code changes trigger server restart (~20s)
- Watch for ENOENT errors during builds (file lock issues on Windows)
- If server crashes with "EADDRINUSE", old process still holding port - restart manually

**Playwright MCP Debugging**
- Use `browser_console_messages()` to check errors/warnings
- Log important values in code before errors occur
- Check for undefined parameters: `console.log('[Module] Param:', typeof value, value)`
- Avatar rendering confirms Three.js rendering works; black screen = content not added to scene

**Blueprint Props Access Pattern**
- Props must be passed explicitly to script via parameter
- Script cannot rely on global world.props unless explicitly exposed
- Each app sees only its own blueprint.props
- Props deserialized from snapshot must include all expected fields

### Live Debugging with Playwright MCP

**Debug Globals Setup**
- All critical world objects exposed to `window.__DEBUG__` after world initialization
- Automatically hooked via `setupDebugGlobals()` in `src/client/world-client.js`
- Console.log/warn/error captured with timestamps in `window.__DEBUG__.logs`

**Available Debug Commands in Playwright**
```javascript
// Get all entities
await page.evaluate(() => window.__DEBUG__.entities())

// Get specific entity by ID
await page.evaluate(() => window.__DEBUG__.getEntity("entity-id"))

// Get all blueprints
await page.evaluate(() => window.__DEBUG__.blueprints())

// Get specific blueprint
await page.evaluate(() => window.__DEBUG__.getBlueprint("blueprint-id"))

// Get all apps
await page.evaluate(() => window.__DEBUG__.apps())

// Get all players
await page.evaluate(() => window.__DEBUG__.players())

// Check network status
await page.evaluate(() => window.__DEBUG__.network)

// Access world directly
await page.evaluate(() => window.__DEBUG__.world)

// View captured logs
await page.evaluate(() => window.__DEBUG__.logs.errors)
await page.evaluate(() => window.__DEBUG__.logs.warnings)
await page.evaluate(() => window.__DEBUG__.logs.info)
```

**Debugging Example: Check if Meadow Script Props**
```javascript
// Get scene app
const sceneApp = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  return apps.find(app => app.data.id.includes('scene')).blueprint?.props
})
console.log('Scene props:', sceneApp)
```

**Capturing App State During Debugging**
```javascript
// Get app with specific blueprint
const app = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const targetApp = apps.find(app => {
    const blueprint = window.__DEBUG__.getBlueprint(app.data.blueprint)
    return blueprint?.name === 'The Meadow'
  })
  return {
    id: targetApp.data.id,
    blueprintId: targetApp.data.blueprint,
    mode: targetApp.mode,
    blueprint: window.__DEBUG__.getBlueprint(targetApp.data.blueprint)
  }
})
```

**Console Output Tracking**
- Last 100 errors, warnings, and info logs stored with timestamps
- Use for post-mortem debugging without browser console
- Can be exported and analyzed programmatically

### Meadow Script Execution Status

**Current State (Dec 22, 2025)**
- ✅ Script loads and executes
- ✅ app.config exposes blueprint properties
- ✅ app.add() and app.remove() methods available
- ✅ Avatar renders correctly (Three.js rendering works)
- ❌ Meadow environment not rendering (script fails during node property assignment)

**Blocking Issue: Node Property Assignment**
- Error: `node2.position._onChange is not a function`
- Occurs when script sets properties on nodes created by `app.create('sky')`
- Script calls: `sky.bg = app.config.sky?.url`, `sky.hdr = ...`, etc.
- Conflict between plain object property assignment and Node class property setters
- **Root Cause**: Plain objects from createNode() don't have proper Node initialization when script sets properties before app.add() mounts them

**Meadow Script Flow:**
1. `app.create('sky')` returns plain object with { type: 'sky', props: {}, children: [] }
2. Script sets properties: sky.bg, sky.hdr, sky.rotationY, sky.sunDirection, etc.
3. Script calls `app.add(sky)` to mount the node
4. **Issue**: During step 2, property assignment conflicts with position property handler

**Files Involved in Issue:**
- `src/core/extras/createNode.js` - creates plain objects
- `src/core/systems/apps/AppAPIConfig.js` - implements create() and add() methods
- `src/core/nodes/Sky.js` - actual Sky class with property handlers
- `src/core/entities/app/ScriptExecutor.js` - executes script code

**Next Steps to Resolve:**
1. Option A: Delay Node instantiation until script completes (would require script context changes)
2. Option B: Create a proxy object that defers property setting until mount
3. Option C: Modify plain object creation to pre-initialize Node properties
4. Option D: Make Node setters more defensive against partial initialization

**For Production:**
Once resolved, the meadow environment should render with:
- Sky texture from props.sky
- HDR lighting from props.hdr
- Sun direction and intensity from props
- Fog configuration from props
