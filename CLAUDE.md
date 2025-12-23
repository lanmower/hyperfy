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

### Meadow Script Execution & Environment Rendering

**✅ FULLY RESOLVED - Dec 23, 2025**

The meadow script now executes successfully with **complete environment rendering including sky, ground, fog, and atmosphere!**

**Three Critical Fixes Required:**

**Fix #1: Schema Proxy `ref` Property (Sky Node Mounting)**
- **Problem**: When script calls `app.add(sky)`, the add() method does `const ref = node.ref || node`. The schema proxy had `_ref` (secure) but not `ref`, so it used the proxy itself instead of the real Sky instance. The proxy doesn't have `mount()` method, so Sky.mount() never called.
- **Solution**: Added `ref` property to schema proxy in `createPropertyProxy()` that returns the actual instance
- **File**: `src/core/utils/helpers/defineProperty.js` (lines 92-98)
- **Code**:
```javascript
Object.defineProperty(proxy, 'ref', {
  get() {
    return self  // Returns the real instance
  },
  enumerable: false,
  configurable: true,
})
```
- **Result**: app.add() now correctly mounts the real Sky instance with proper mount() lifecycle

**Fix #2: Server-Side Model Loading (BlueprintLoader)**
- **Problem**: BlueprintLoader.loadModel() tried to use `world.loader`, but ClientLoader only exists on client platform. Server tried to load 3D models, crashed with "Cannot read properties of undefined (reading 'get')"
- **Solution**: Added guard to skip model loading on server (loader doesn't exist server-side, 3D models only needed on client)
- **File**: `src/core/entities/app/BlueprintLoader.js` (lines 48-51)
- **Code**:
```javascript
if (!world.loader) {
  console.warn(`[BlueprintLoader] Loader not available (server-side model loading not supported)`)
  return null
}
```
- **Result**: Server no longer crashes; client can load models independently

**Fix #3: Client-Side Model Mounting (App.build)**
- **Problem**: BlueprintLoader.load() returned a `root` (model), but App.build() never used it. Model loaded on client but not added to app's scene for rendering
- **Solution**: Add loaded model root to app's scene: `if (root) { this.root.add(root) }`
- **File**: `src/core/entities/App.js` (lines 64-66)
- **Code**:
```javascript
if (root) {
  this.root.add(root)
}
```
- **Result**: Model renders as part of the app scene

**Complete Execution Flow (Now Working):**
1. ✅ Server creates scene app, blueprint loaded, script extracted
2. ✅ Server skips model loading (no loader), sends blueprint to client
3. ✅ Client creates App, calls build()
4. ✅ Client BlueprintLoader.load() succeeds, loads base-environment.glb model
5. ✅ Model root added to app.root via `this.root.add(root)`
6. ✅ Script executes: creates sky node via `app.create('sky')`
7. ✅ Script sets sky properties: bg, hdr, rotationY, sunDirection, etc.
8. ✅ Script calls `app.add(sky)` - now gets real Sky instance via `node.ref`
9. ✅ Sky.mount() called, calls SkyManager.addSky(), environment renders
10. ✅ Model (ground), sky, fog, avatar all visible

**Rendering Status:**
- ✅ Meadow script executes without errors
- ✅ Sky node created, mounted, and rendering (blue sky with clouds visible)
- ✅ Ground model renders (base-environment.glb - gray meadow visible)
- ✅ Fog atmosphere correctly applied
- ✅ Avatar renders with proper lighting from sky HDR
- ✅ **Full 3D environment is now visible in screenshot**

**Files Modified:**
- `src/core/utils/helpers/defineProperty.js` - Added `ref` property to schema proxy
- `src/core/entities/app/BlueprintLoader.js` - Added guard for missing loader
- `src/core/entities/App.js` - Added loaded model root to app scene
- `src/core/nodes/Sky.js` - Added debug logging to Sky.mount()

## Comprehensive Debugging Guide

### One-Command Diagnostics in Playwright MCP

**Global Inspection API (window.__DEBUG__)** - All available after world init:

```javascript
// === SCENE HEALTH CHECK ===
await page.evaluate(() => window.__DEBUG__.checkSceneApp())
// Returns: { appId, mode, blueprintName, childCount, hasErrors, lastError }

// === ENTITY & BLUEPRINT INSPECTION ===
await page.evaluate(() => window.__DEBUG__.entities())           // All entities
await page.evaluate(() => window.__DEBUG__.apps())               // All apps only
await page.evaluate(() => window.__DEBUG__.players())            // All players only
await page.evaluate(() => window.__DEBUG__.blueprints())         // All blueprints
await page.evaluate(() => window.__DEBUG__.getEntity('id'))      // Single entity
await page.evaluate(() => window.__DEBUG__.getBlueprint('id'))   // Single blueprint
await page.evaluate(() => window.__DEBUG__.getAppByBlueprint('The Meadow')) // Find app

// === APP STATE INSPECTION ===
await page.evaluate(() => window.__DEBUG__.getAppState('app-id'))
// Returns: { id, blueprint, mode, childCount, children[], scriptExecutor }

// === NODE & TRANSFORM DEBUGGING ===
await page.evaluate(() => window.__DEBUG__.findNodesByName('sky'))
// Returns: [{ appId, nodes[] }] - Find nodes by name across all apps

// === ERROR & LOG TRACKING ===
await page.evaluate(() => window.__DEBUG__.getScriptErrors())    // Script errors only
await page.evaluate(() => window.__DEBUG__.getScriptWarnings())  // Script warnings only
await page.evaluate(() => window.__DEBUG__.logs.errors)          // All errors (max 500)
await page.evaluate(() => window.__DEBUG__.logs.warnings)        // All warnings (max 500)
await page.evaluate(() => window.__DEBUG__.logs.info)            // All info logs (max 500)

// === PERFORMANCE METRICS ===
await page.evaluate(() => window.__DEBUG__.getPerformanceMetrics())
// Returns: { entitiesCount, blueprintsCount, appsCount, playersCount }

// === BLUEPRINT INVENTORY ===
await page.evaluate(() => window.__DEBUG__.getBlueprintStats())
// Returns: { total, byType: {apps, models, scenes}, list[] }

// === NETWORK STATUS ===
await page.evaluate(() => window.__DEBUG__.getNetworkStats())
// Returns: { id, isServer, isClient, connected }

// === DIRECT WORLD ACCESS ===
await page.evaluate(() => window.__DEBUG__.world)               // Full world object
await page.evaluate(() => window.__DEBUG__.systems)             // All systems
```

### Systematic Debugging Workflow

**Level 1: Initial Diagnostics (30 seconds)**
```javascript
// Step 1: Check if world initialized
const health = await page.evaluate(() => window.__DEBUG__.checkSceneApp())
console.log('Scene Health:', health)

// Step 2: Count errors
const errorCount = await page.evaluate(() => window.__DEBUG__.logs.errors.length)
console.log('Error Count:', errorCount)

// Step 3: Check entity counts
const metrics = await page.evaluate(() => window.__DEBUG__.getPerformanceMetrics())
console.log('Metrics:', metrics)
```

**Level 2: Script & Blueprint Debugging (2 minutes)**
```javascript
// Find the problematic app
const meadowApp = await page.evaluate(() => window.__DEBUG__.getAppByBlueprint('The Meadow'))
console.log('Meadow App:', meadowApp?.data?.id)

// Check app state
const appState = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const app = apps[0]
  return {
    id: app.data.id,
    mode: app.mode,
    hasBlueprint: !!app.blueprint,
    children: app.root?.children?.length || 0,
    scriptExecutor: app.scriptExecutor ? 'active' : 'inactive'
  }
})
console.log('App State:', appState)

// Check all errors
const errors = await page.evaluate(() => window.__DEBUG__.logs.errors.map(e => e.args[0]))
console.log('All Errors:', errors)
```

**Level 3: Node & Rendering Debugging (5 minutes)**
```javascript
// Find all nodes by type
const skyNodes = await page.evaluate(() => window.__DEBUG__.findNodesByName('sky'))
console.log('Sky Nodes:', skyNodes)

// Check Three.js scene
const scene = await page.evaluate(() => {
  const stage = window.__DEBUG__.systems.stage()
  return {
    childrenCount: stage?.scene?.children?.length || 0,
    hasFog: !!stage?.scene?.fog,
    hasEnvironment: !!stage?.scene?.environment,
    hasBackground: !!stage?.scene?.background,
  }
})
console.log('Scene State:', scene)

// Get last error details
const lastError = await page.evaluate(() => {
  const logs = window.__DEBUG__.logs.errors
  if (logs.length === 0) return null
  const lastLog = logs[logs.length - 1]
  return { time: lastLog.time, error: lastLog.args[0] }
})
console.log('Last Error:', lastError)
```

**Level 4: Live State Inspection (Advanced)**
```javascript
// Get complete app hierarchy
const hierarchy = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  return apps.map(app => ({
    id: app.data.id,
    blueprint: window.__DEBUG__.getBlueprint(app.data.blueprint)?.name,
    mode: app.mode,
    children: app.root?.children?.map(c => ({
      name: c.name,
      type: c.constructor.name,
      hasChildren: c.children?.length > 0
    })) || []
  }))
})
console.log('App Hierarchy:', JSON.stringify(hierarchy, null, 2))

// Monitor specific property
const monitor = () => {
  return page.evaluate(() => {
    const apps = window.__DEBUG__.apps()
    const app = apps[0]
    return {
      timestamp: new Date().toISOString(),
      appMode: app.mode,
      childCount: app.root?.children?.length || 0,
      errors: window.__DEBUG__.logs.errors.length,
      warnings: window.__DEBUG__.logs.warnings.length
    }
  })
}
// Call monitor() multiple times to track changes
```

### Common Issues & Solutions

**Issue: Black Screen (Nothing Renders)**
```javascript
// Diagnosis
const metrics = await page.evaluate(() => window.__DEBUG__.getPerformanceMetrics())
console.log('Entity Count:', metrics.entitiesCount) // Should be > 0

const health = await page.evaluate(() => window.__DEBUG__.checkSceneApp())
console.log('App Children:', health.childCount) // Should be > 0

const scene = await page.evaluate(() => {
  const stage = window.__DEBUG__.systems.stage()
  return stage?.scene?.children?.length || 0
})
console.log('Three.js Scene Children:', scene) // Should be > 0

// Solution: If all 0, world hasn't initialized properly
// If app has children but scene is empty, nodes aren't being added to Three.js scene
```

**Issue: Script Errors**
```javascript
// Get all script errors
const scriptErrors = await page.evaluate(() => window.__DEBUG__.getScriptErrors())
console.log('Script Errors:', scriptErrors)

// Get raw logs to see full error
const allErrors = await page.evaluate(() => window.__DEBUG__.logs.errors.slice(-5))
allErrors.forEach(log => console.log(log.time, log.args[0]))

// Check if app has blueprint
const hasBlueprint = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  return !!apps[0]?.blueprint
})
console.log('Blueprint Loaded:', hasBlueprint)
```

**Issue: Node Not Mounting**
```javascript
// Find the node
const nodes = await page.evaluate(() => window.__DEBUG__.findNodesByName('sky'))
console.log('Sky Nodes Found:', nodes)

// Check if node is mounted
const mounted = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const sky = apps[0]?.root?.children?.find(c => c.name === 'sky')
  return { mounted: !!sky?.mounted, hasMount: typeof sky?.mount === 'function' }
})
console.log('Mount Status:', mounted)

// Check if node has ref property (critical for app.add)
const hasRef = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const sky = apps[0]?.root?.children?.find(c => c.name === 'sky')
  return 'ref' in sky
})
console.log('Has Ref Property:', hasRef)
```

**Issue: Model Not Loading**
```javascript
// Check if blueprint has model
const blueprint = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const app = apps[0]
  return {
    hasBlueprint: !!app.blueprint,
    model: app.blueprint?.model,
    script: !!app.blueprint?.script
  }
})
console.log('Blueprint Model:', blueprint)

// Check app children count (model adds children)
const childCount = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  return apps[0]?.root?.children?.length || 0
})
console.log('App Children:', childCount) // Should be > 0 if model loaded
```

### Debugging Patterns & Examples

```javascript
// === Find specific apps ===
const meadow = await page.evaluate(() => window.__DEBUG__.getAppByBlueprint('The Meadow'))
const appsByType = await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  return apps.filter(a => a.blueprint?.script).map(a => a.data.id)
})

// === Track errors over time ===
const errorSnapshot = () => ({
  timestamp: new Date().toISOString(),
  total: window.__DEBUG__.logs.errors.length,
  recent: window.__DEBUG__.logs.errors.slice(-3).map(e => e.args[0])
})

// === Monitor script execution ===
const checkScript = () => {
  const apps = window.__DEBUG__.apps()
  return apps[0]?.scriptExecutor?.context ? 'running' : 'inactive'
}

// === Verify Three.js scene ===
const inspectScene = () => {
  const stage = window.__DEBUG__.systems.stage()
  const scene = stage?.scene
  return {
    children: scene?.children?.length || 0,
    fog: scene?.fog ? { near: scene.fog.near, far: scene.fog.far } : null,
    background: scene?.background ? 'set' : null,
    environment: scene?.environment ? 'set' : null,
  }
}
```

### Setting Custom Debug Hooks

Add these to any critical code path for live inspection:

```javascript
// In system initialization:
window.__DEBUG__.systemStates = {
  loader: () => ({ loading: world.loader?.loading || 0, cached: world.loader?.cache?.size || 0 }),
  network: () => ({ connected: world.network?.connected, id: world.network?.id }),
  entities: () => ({ total: world.entities?.items?.size || 0 })
}

// In app.build():
window.__DEBUG__.appBuildState = {
  lastApp: null,
  lastError: null,
  recordBuild: (app, result) => {
    window.__DEBUG__.appBuildState.lastApp = app.data.id
    window.__DEBUG__.appBuildState.lastError = result.error
  }
}

// In script execution:
window.__DEBUG__.scriptTrace = {
  lastScript: null,
  lastProps: null,
  traceExecution: (scriptName, props) => {
    window.__DEBUG__.scriptTrace.lastScript = scriptName
    window.__DEBUG__.scriptTrace.lastProps = props
  }
}

// Access with:
// await page.evaluate(() => window.__DEBUG__.systemStates.loader())
// await page.evaluate(() => window.__DEBUG__.appBuildState)
// await page.evaluate(() => window.__DEBUG__.scriptTrace)
```
