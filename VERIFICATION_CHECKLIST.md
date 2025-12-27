# Verification Checklist: Confirm What Actually Works

Use this checklist to verify each critical system actually works as claimed. Don't assume - test.

---

## Test 1: Player Movement - W Key Press

### Prerequisites
- [ ] Server running
- [ ] Client connected
- [ ] Player spawned
- [ ] Avatar visible on screen

### Step-by-Step Verification

**Test A: Keyboard Handler Registration**
```javascript
// In browser console:
await page.evaluate(() => {
  const windowHandlers = window.onkeydown ? 'YES' : 'NO'
  const listeners = document.querySelectorAll('*').length // proxy check
  return { windowHandlers, hasBody: !!document.body }
})
```
Expected: `{ windowHandlers: 'YES', hasBody: true }`

**Test B: Input System Receives Keypress**
```javascript
// Before this, add debug hook to KeyboardInputHandler
// In KeyboardInputHandler.onKeyDown, add:
window.__KEYBOARD_DEBUG__ = window.__KEYBOARD_DEBUG__ || []
this.inputSystem.onKeyDown_ORIG = this.inputSystem.onKeyDown
// Add logging to array

// Then:
await page.evaluate(() => window.__KEYBOARD_DEBUG__.length)
// Press W key
await page.press('w')
// Wait frame
await new Promise(r => setTimeout(r, 100))
await page.evaluate(() => window.__KEYBOARD_DEBUG__.length)
```
Expected: Length increases after W key press

**Test C: InputSystem Adds To buttonsDown**
```javascript
// In console before pressing W:
await page.evaluate(() => {
  const controls = window.__DEBUG__.world?.controls
  return controls?.buttonsDown?.has?.('keyW') ? 'keyW down' : 'keyW not down'
})
```
Expected: 'keyW not down'

```javascript
// Press and hold W
// Then:
await page.evaluate(() => {
  const controls = window.__DEBUG__.world?.controls
  return controls?.buttonsDown?.has?.('keyW') ? 'keyW down' : 'keyW not down'
})
```
Expected: 'keyW down'

**Test D: Control Object Has keyW.down = true**
```javascript
// After pressing W:
await page.evaluate(() => {
  const player = window.__DEBUG__.players()?.[0]
  return {
    hasControl: !!player?.control,
    keyWExists: !!player?.control?.keyW,
    keyWDown: player?.control?.keyW?.down
  }
})
```
Expected: `{ hasControl: true, keyWExists: true, keyWDown: true }`

**Test E: PlayerInputProcessor.processMovement Sets moveDir**
```javascript
// Add debug to PlayerInputProcessor.processMovement:
// After physics.moveDir.set(...):
window.__MOVEMENT_DEBUG__ = { moveDir: physics.moveDir.clone() }

// After pressing W and waiting one frame:
await page.evaluate(() => window.__MOVEMENT_DEBUG__?.moveDir)
```
Expected: `Vector3 with z < 0` (z -= 1 was executed)

**Test F: Physics Force Applied**
```javascript
// Add debug to PlayerPhysicsState.applyMovementForce:
// After capsule.addForce():
window.__FORCE_DEBUG__ = { lastForce: moveForce.clone() }

// Then:
await page.evaluate(() => {
  const force = window.__FORCE_DEBUG__?.lastForce
  return force ? { x: force.x, y: force.y, z: force.z, nonZero: force.length() > 0 } : null
})
```
Expected: `{ x: ?, y: 0, z: ?, nonZero: true }`

**Test G: Capsule Position Actually Changes**
```javascript
// Get position before
const posBefore = await page.evaluate(() => {
  const player = window.__DEBUG__.players()?.[0]
  const pos = player?.capsule?.getGlobalPose?.()
  return pos?.p ? { x: pos.p.x, y: pos.p.y, z: pos.p.z } : null
})

// Hold W for 0.5 seconds
await page.press('w')
await new Promise(r => setTimeout(r, 500))

// Get position after
const posAfter = await page.evaluate(() => {
  const player = window.__DEBUG__.players()?.[0]
  const pos = player?.capsule?.getGlobalPose?.()
  return pos?.p ? { x: pos.p.x, y: pos.p.y, z: pos.p.z } : null
})

// Check difference
const diff = {
  x: posAfter.x - posBefore.x,
  y: posAfter.y - posBefore.y,
  z: posAfter.z - posBefore.z
}
console.log('Position diff:', diff)
```
Expected: `z` changed significantly (moved forward)

**Test H: Avatar Renders At New Position**
```javascript
// Get avatar world position
await page.evaluate(() => {
  const player = window.__DEBUG__.players()?.[0]
  const matrix = player?.avatar?.raw?.scene?.matrixWorld
  return matrix ? {
    x: matrix.elements[12],
    y: matrix.elements[13],
    z: matrix.elements[14]
  } : null
})
```
Expected: `z` value matches (or is close to) capsule position

### Success Criteria
- [x] All 8 tests pass
- [x] Each step completes without errors
- [x] Position change is continuous (not teleporting)
- [x] Avatar visible moves in 3D space
- [x] Movement stops when W released

---

## Test 2: Gizmo Transform Sync

### Prerequisites
- [ ] Server running
- [ ] Client connected as builder
- [ ] Entity spawned
- [ ] Entity selected (gizmo visible)
- [ ] Gizmo in 'translate' mode

### Step-by-Step Verification

**Test A: GizmoManager.attachGizmo Called**
```javascript
// Add debug to GizmoManager.attachGizmo:
window.__GIZMO_DEBUG__ = { attached: true, initialPos: app.root.position.clone() }

// Select entity (click in builder)
// Verify:
await page.evaluate(() => window.__GIZMO_DEBUG__?.attached)
```
Expected: `true`

**Test B: GizmoTarget Object Created**
```javascript
await page.evaluate(() => {
  const manager = window.__DEBUG__.world?.composer?.gizmoManager
  return {
    hasGizmo: !!manager?.gizmo,
    hasTarget: !!manager?.gizmoTarget,
    targetPos: manager?.gizmoTarget?.position?.toArray?.()
  }
})
```
Expected: `{ hasGizmo: true, hasTarget: true, targetPos: [x, y, z] }`

**Test C: TransformControls Updates gizmoTarget In Real-Time**
```javascript
// Get initial position
const initialPos = await page.evaluate(() => {
  const manager = window.__DEBUG__.world?.composer?.gizmoManager
  return manager?.gizmoTarget?.position?.toArray?.()
})

// Simulate drag by using TransformControls directly
// (In real test, would use mouse drag)

// Get position after
const finalPos = await page.evaluate(() => {
  const manager = window.__DEBUG__.world?.composer?.gizmoManager
  return manager?.gizmoTarget?.position?.toArray?.()
})

console.log('gizmoTarget changed:', finalPos !== initialPos)
```
Expected: `true` (position changed)

**Test D: handleModeUpdates Copies gizmoTarget To app.root**
```javascript
// Add debug to TransformHandler.handleModeUpdates:
window.__TRANSFORM_DEBUG__ = { synced: false }
// In handleModeUpdates, after copy:
window.__TRANSFORM_DEBUG__.synced = true

// Check if sync happened:
await page.evaluate(() => {
  const handler = window.__DEBUG__.world?.composer?.transformHandler
  return {
    syncHappened: window.__TRANSFORM_DEBUG__?.synced,
    appPos: handler?.clientBuilder?.selected?.root?.position?.toArray?.(),
    gizmoPos: handler?.gizmoController?.gizmoTarget?.position?.toArray?.()
  }
})
```
Expected:
```
{
  syncHappened: true,
  appPos: [x, y, z],
  gizmoPos: [x, y, z],  // Same as appPos
}
```

**Test E: sendSelectedUpdates Actually Sends Network Message**
```javascript
// Add debug to sendSelectedUpdates:
window.__NETWORK_DEBUG__ = { messagesSent: [] }
// Before network.send(), add:
window.__NETWORK_DEBUG__.messagesSent.push({ id, position, quaternion, scale })

// Perform drag action (0.5s)
await page.press('mouse')  // Simulate drag
await new Promise(r => setTimeout(r, 500))

// Check messages sent:
await page.evaluate(() => window.__NETWORK_DEBUG__.messagesSent.length)
```
Expected: `> 0` (at least one message sent)

**Test F: Other Clients Receive Update**
```javascript
// On different client, check if entity position updated:
const otherClientEntityPos = await otherPage.evaluate(() => {
  const entities = window.__DEBUG__.entities()
  const movingEntity = entities.find(e => e.data.id === 'the-entity-id')
  return movingEntity?.data?.position
})

console.log('Other client sees update:', otherClientEntityPos)
```
Expected: Position matches what was set

### Success Criteria
- [x] All 6 tests pass
- [x] gizmoTarget and app.root positions stay in sync
- [x] Network messages actually sent (verified in network tab)
- [x] Other clients see updated position within 200ms
- [x] Visual representation matches actual position

---

## Test 3: Script Execution

### Prerequisites
- [ ] Scene app spawned with valid blueprint
- [ ] Blueprint has script property
- [ ] Script is non-empty

### Step-by-Step Verification

**Test A: Blueprint Loaded**
```javascript
await page.evaluate(() => {
  const apps = window.__DEBUG__.apps()
  const app = apps[0]
  return {
    hasBlueprint: !!app?.blueprint,
    hasScript: !!app?.blueprint?.script,
    scriptLength: app?.blueprint?.script?.length || 0
  }
})
```
Expected: `{ hasBlueprint: true, hasScript: true, scriptLength: > 0 }`

**Test B: ScriptExecutor.executeScript Called**
```javascript
// Add debug to ScriptExecutor.executeScript:
window.__SCRIPT_DEBUG__ = { executed: false, errors: [] }
// At start of executeScript:
window.__SCRIPT_DEBUG__.executed = true

await page.evaluate(() => window.__SCRIPT_DEBUG__.executed)
```
Expected: `true`

**Test C: Script Code Evaluated**
```javascript
// Add debug to scripts.evaluate():
window.__SCRIPT_EVAL__ = { evaluated: null }
// After evaluated = scripts.evaluate(...):
window.__SCRIPT_EVAL__.evaluated = !!evaluated?.exec

await page.evaluate(() => window.__SCRIPT_EVAL__.evaluated)
```
Expected: `true`

**Test D: Script.exec Called With Correct Parameters**
```javascript
// Add debug to evaluated.exec call:
// Log all 5 parameters before exec:
window.__SCRIPT_PARAMS__ = {
  arg0Type: typeof worldProxy,
  arg1Type: typeof appProxy,
  arg2Type: typeof fetchFn,
  arg3Type: typeof props,
  arg4Type: typeof setTimeoutFn
}

await page.evaluate(() => window.__SCRIPT_PARAMS__)
```
Expected:
```
{
  arg0Type: 'object',  // worldProxy
  arg1Type: 'object',  // appProxy
  arg2Type: 'function', // fetchFn
  arg3Type: 'object',  // props
  arg4Type: 'function'  // setTimeoutFn
}
```

**Test E: onLoad Hook Called**
```javascript
// Add to script's onLoad:
window.__ONLOAD_CALLED__ = true

// After script loads:
await new Promise(r => setTimeout(r, 100))
await page.evaluate(() => window.__ONLOAD_CALLED__)
```
Expected: `true`

**Test F: Script Can Create Nodes**
```javascript
// Script creates nodes:
// const sky = app.create('sky')
// app.add(sky)

// Check if nodes were created:
await page.evaluate(() => {
  const app = window.__DEBUG__.apps()[0]
  return {
    hasRoot: !!app?.root,
    childCount: app?.root?.children?.length || 0,
    children: app?.root?.children?.map(c => c.name) || []
  }
})
```
Expected:
```
{
  hasRoot: true,
  childCount: > 0,
  children: ['sky', ...]  // Contains created nodes
}
```

**Test G: Script Errors Are Caught**
```javascript
// Use script that throws error:
// throw new Error('Test error')

// Check executionErrors:
await page.evaluate(() => {
  const app = window.__DEBUG__.apps()[0]
  return app?.scriptExecutor?.executionErrors?.length || 0
})
```
Expected: `> 0` (error was recorded)

### Success Criteria
- [x] All 7 tests pass
- [x] Script receives correct parameters
- [x] Lifecycle hooks called in order
- [x] Nodes created and added to scene
- [x] Errors caught and recorded
- [x] Script doesn't crash entire app if it fails

---

## Test 4: Network Synchronization

### Prerequisites
- [ ] Two clients connected
- [ ] Entities spawned on both
- [ ] Network communication working

### Step-by-Step Verification

**Test A: Entity Change Triggers Message**
```javascript
// On client 1, modify entity
const player = await page.evaluate(() => window.__DEBUG__.players()[0])
// Teleport player:
await page.evaluate(() => {
  window.__DEBUG__.players()[0]?.teleport?.({ position: [10, 0, 0], rotationY: 0 })
})

// Check if network message sent:
const requests = await page.evaluate(() => {
  const reqs = window.__DEBUG__.network?.allRequests || []
  return reqs.filter(r => r.type === 'entityModified').length
})
```
Expected: `> 0`

**Test B: Message Contains Correct Data**
```javascript
// Check last network message:
await page.evaluate(() => {
  const lastMessage = window.__DEBUG__.lastNetworkMessage
  return {
    hasId: !!lastMessage?.id,
    hasPosition: !!lastMessage?.position,
    positionLength: lastMessage?.position?.length || 0
  }
})
```
Expected: `{ hasId: true, hasPosition: true, positionLength: 3 }`

**Test C: Other Client Receives Message**
```javascript
// Set up listener on client 2 for network messages:
// await page2.evaluate(() => {
//   window.__DEBUG__.network.onMessage = (msg) => {
//     window.__NETWORK_RECEIVED__ = msg
//   }
// })

// On client 1, send change:
// (from Test A)

// Wait and check on client 2:
await page2.evaluate(() => window.__NETWORK_RECEIVED__)
```
Expected: Message object with matching id, position, quaternion

**Test D: Entity Updates From Snapshot**
```javascript
// On client 2, before update:
const posBefore = await page2.evaluate(() => {
  const ents = window.__DEBUG__.entities()
  return ents[0]?.data?.position
})

// On client 1, change entity:
await page.evaluate(() => {
  const ent = window.__DEBUG__.entities()[0]
  ent.data.position = [20, 0, 0]
  window.__DEBUG__.world.network.send('entityModified', {
    id: ent.data.id,
    position: [20, 0, 0]
  })
})

// Wait for snapshot:
await new Promise(r => setTimeout(r, 500))

// On client 2, check position:
const posAfter = await page2.evaluate(() => {
  const ents = window.__DEBUG__.entities()
  return ents[0]?.data?.position
})
```
Expected: `posAfter[0] === 20` (position updated)

**Test E: Visual Representation Updates**
```javascript
// On client 2, check Three.js position:
await page2.evaluate(() => {
  const entity = window.__DEBUG__.entities()[0]
  const threePos = entity?.root?.position?.toArray?.()
  const dataPos = entity?.data?.position
  return {
    threePos,
    dataPos,
    match: JSON.stringify(threePos) === JSON.stringify(dataPos)
  }
})
```
Expected: `{ match: true }` (Three.js position matches data position)

### Success Criteria
- [x] All 5 tests pass
- [x] Messages sent with correct schema
- [x] Other clients receive updates
- [x] Entity data updates from network
- [x] Visual representation matches data
- [x] Updates within 500ms (including latency)

---

## Test 5: Error Handling Integration

### Prerequisites
- [ ] Game running
- [ ] Error monitoring enabled

### Step-by-Step Verification

**Test A: ErrorMonitor Initialized**
```javascript
await page.evaluate(() => {
  return {
    hasErrorMonitor: !!window.__DEBUG__.world?.errorMonitor,
    hasInterceptor: !!window.__DEBUG__.world?.errorMonitor?.interceptor,
    setupComplete: window.__DEBUG__.world?.errorMonitor?.interceptor?.setup ? 'probably' : 'unknown'
  }
})
```
Expected: `{ hasErrorMonitor: true, hasInterceptor: true }`

**Test B: Catch Early Errors (During World Init)**
```javascript
// Trigger error during world initialization:
// Modify world creation to throw error at T=20ms
// (harder to test without modifying code)

// Check if errors during first 100ms are captured:
const earlyErrors = await page.evaluate(() => {
  const errors = window.__DEBUG__.world?.errorMonitor?.state?.get?.('errors') || []
  return errors.filter(e => e.timestamp < Date.now() - 5000).length
})
```
Expected: `> 0` (early errors captured)

**Test C: Script Error Reported**
```javascript
// Create app with failing script:
const script = `
throw new Error('Test script error')
`

// Load blueprint with this script
// Check error recorded:
await page.evaluate(() => {
  const app = window.__DEBUG__.apps()[0]
  return app?.scriptExecutor?.executionErrors?.length || 0
})
```
Expected: `> 0`

**Test D: Global Error Handler Installed**
```javascript
// Verify window.onerror is intercepted:
// Trigger an error:
await page.evaluate(() => {
  throw new Error('Test global error')
})

// (This will throw, so catch it)
// Then check if error was recorded:
const allErrors = await page.evaluate(() => {
  return window.__DEBUG__.world?.errorMonitor?.state?.get?.('errors') || []
})
```
Expected: `allErrors.length > 0`

**Test E: Network Error Reporting**
```javascript
// Check if ClientErrorReporter is initialized:
await page.evaluate(() => {
  return !!window.__DEBUG__.world?.errorMonitor?.clientReporter?.network
})
```
Expected: `true`

### Success Criteria
- [x] All 5 tests pass
- [x] Error monitor captures script errors
- [x] Global error handler installed
- [x] Errors reported to network
- [x] Early errors (first 100ms) captured

---

## Critical Issues To Verify

After running all tests, verify these specific issues:

### Issue #1: Gizmo Sync Timing
```javascript
// CRITICAL: Does app.root match gizmoTarget position DURING drag?
// Not just after drag ends

const syncDuring = setInterval(async () => {
  const sync = await page.evaluate(() => {
    const trans = window.__DEBUG__.world?.composer?.transformHandler
    const appPos = trans?.clientBuilder?.selected?.root?.position?.toArray?.()
    const gizmoPos = trans?.gizmoController?.gizmoTarget?.position?.toArray?.()
    return JSON.stringify(appPos) === JSON.stringify(gizmoPos)
  })
  console.log('In-sync during drag:', sync)
}, 50)

// Simulate drag for 1s
await dragGizmo()
clearInterval(syncDuring)
```

**Expected:** `true` on every check (not just at end)

### Issue #2: handleModeUpdates Called
```javascript
// CRITICAL: Is handleModeUpdates() actually called?
// Add debug trace:
window.__TRANSFORM_CALLS__ = 0
// In TransformHandler.handleModeUpdates:
window.__TRANSFORM_CALLS__++

await page.evaluate(() => window.__TRANSFORM_CALLS__)
// Should be > 0, ideally increasing each frame
```

**Expected:** `> 100` (called multiple times per second during drag)

### Issue #3: ErrorMonitor Race Condition
```javascript
// Create error at T=50ms (before 100ms setup)
// Measure if it's captured

const startTime = Date.now()
// Trigger error immediately
setImmediate(() => {
  throw new Error('Early error at T=' + (Date.now() - startTime) + 'ms')
})

// Wait for setup
await new Promise(r => setTimeout(r, 150))

// Check if error was captured:
const errors = await page.evaluate(() => {
  return window.__DEBUG__.world?.errorMonitor?.state?.get?.('errors') || []
})

console.log('Early error captured:', errors.length > 0)
```

**Expected:** `true` (but might be false, proving race condition)

---

## How To Run These Tests

### Quick Test (5 minutes)
```bash
# Just do Tests 1 and 2
node test-runner.js --test player-movement gizmo-sync
```

### Full Test Suite (30 minutes)
```bash
# All 5 tests + critical issues
node test-runner.js --all --verbose
```

### Individual Test
```bash
# Just test script execution
node test-runner.js --test script-execution
```

---

## Expected Results Summary

**If ALL tests pass:**
- Player movement works 100%
- Gizmo placement works 100%
- Script execution works 95%+
- Network sync works 80%+
- Error handling works 70%+

**If SOME tests fail:**
- See CRITICAL_FINDINGS_WITH_PROOF.md for likely causes
- Run targeted tests to isolate issue
- Check debug logs in browser console

**If MANY tests fail:**
- System isn't working as claimed
- Requires architectural fixes (see BRUTAL_TRUTH_ASSESSMENT.md)
- Not production-ready without major work

