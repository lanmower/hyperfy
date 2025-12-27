# Model Placement Regression Test Suite

Comprehensive Playwright test suite for the hyperfy model placement workflow. Tests protect against regressions in the 18-fix stabilization completed in December 2025.

## Overview

The test suite is organized into two main test files covering the complete model placement lifecycle:

### Test Files

1. **model-placement.spec.js** - Core workflow tests
   - Model Spawning Tests: File import, selection, positioning, network broadcast
   - Model Selection Tests: Raycast selection, mover assignment, gizmo attachment
   - Grab Mode Tests: Distance adjustment, rotation, snap-to-grid, collision detection
   - Finalization Tests: Mover reset, position broadcast, model locking
   - Network Synchronization Tests: Message format, sync frequency

2. **model-placement-advanced.spec.js** - Edge cases and system integration
   - Edge Cases & Regression Scenarios: Invalid surfaces, overlaps, rapid mode switching
   - Three.js Scene State Verification: Scene graph, geometry, transforms, materials
   - Builder System Integration: SelectionManager, GizmoManager, TransformHandler
   - Performance & Stability: Memory leaks, stress tests, FPS maintenance
   - Debugging & Error Reporting: Error logging, debug globals, console tracking

## Running Tests

### Prerequisites

Playwright must be installed:
```bash
npm install -D @playwright/test
```

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test tests/playwright/models/model-placement.spec.js
npx playwright test tests/playwright/models/model-placement-advanced.spec.js
```

### Run Specific Test

```bash
npx playwright test -g "should spawn model at correct position"
```

### Run with UI Mode (Recommended for Debugging)

```bash
npx playwright test --ui
```

### Run with Trace Recording

```bash
npx playwright test --trace on
```

### View Test Results

```bash
npx playwright show-report
```

## Test Coverage

### Part 1: Model Spawning Tests
- ✓ File dialog opens
- ✓ File selection works
- ✓ Model spawns in front of camera
- ✓ Mover initialized to null
- ✓ Model renders with geometry
- ✓ Model bounds calculable
- ✓ Network message broadcast

### Part 2: Model Selection Tests
- ✓ Raycast selection via click
- ✓ SelectionManager state update
- ✓ Mover set to player network ID
- ✓ Gizmo attached at model location
- ✓ Gizmo rendered in Three.js scene
- ✓ Selection highlight visible (orange outline)

### Part 3: Grab Mode Tests
- ✓ Grab mode activation
- ✓ Raycast placement on ground
- ✓ Model follows camera distance (F/C keys)
- ✓ Mouse wheel rotation
- ✓ Snap-to-grid functionality
- ✓ Ground collision detection

### Part 4: Finalization Tests
- ✓ Mover reset to null on deselection
- ✓ Final position broadcast
- ✓ Model locked in place
- ✓ Gizmo hidden
- ✓ Subsequent model selection works

### Part 5: Edge Cases
- ✓ Invalid surface handling
- ✓ Overlapping model detection
- ✓ Rapid mode switching
- ✓ State consistency during network sync
- ✓ Select/deselect cycles
- ✓ Ghost mover prevention
- ✓ Placement timeout/cancellation

### Part 6: Three.js Scene Verification
- ✓ Model in scene graph
- ✓ Geometry present
- ✓ Transform updates reflected
- ✓ Gizmo properly positioned
- ✓ Lighting and materials applied
- ✓ Visibility states correct

### Part 7: System Integration
- ✓ SelectionManager integration
- ✓ GizmoManager attachment
- ✓ TransformHandler functionality
- ✓ Network message format
- ✓ Control capture management
- ✓ Undo system integration

### Part 8: Performance
- ✓ No memory leaks during selection cycles
- ✓ Stress test with multiple transforms
- ✓ No gizmo instance accumulation
- ✓ FPS maintained during grab mode

### Part 9: Debugging Features
- ✓ Error capture and logging
- ✓ Debug globals availability
- ✓ Console message tracking
- ✓ Network status inspection

## Test Helpers

Helper functions are available in `fixtures/model-placement-helpers.js`:

### Setup & Cleanup
- `setupDebugEnvironment(page)` - Initialize debug environment
- `getErrorLog(page)` - Retrieve console errors
- `getNetworkMessages(page)` - Get all network messages

### Model Operations
- `selectModel(page, appId)` - Select a model by ID
- `deselectModel(page)` - Clear selection
- `getSelectedModel(page)` - Get selected model state
- `getAllModels(page)` - Get all models in world
- `moveModel(page, appId, position)` - Set model position
- `rotateModel(page, appId, quaternion)` - Set model rotation
- `scaleModel(page, appId, scale)` - Set model scale

### State Inspection
- `getSceneState(page)` - Get Three.js scene state
- `getMode(page)` - Get current builder mode
- `isBuildModeEnabled(page)` - Check build mode
- `getWorldMetrics(page)` - Get world statistics

### Verification
- `verifyMoverIsSet(page, appId, mover)` - Verify mover assignment
- `verifyMoverIsNull(page, appId)` - Verify mover is cleared
- `verifyModelInScene(page, appId)` - Verify model is rendered
- `verifyGizmoAttached(page)` - Verify gizmo exists
- `verifyGizmoDetached(page)` - Verify gizmo removed
- `verifyNetworkSyncFrequency(page, minMessages)` - Verify network activity

### Utilities
- `waitForNetworkMessage(page, type, timeout)` - Wait for network message
- `captureScreenshotOnFailure(page, testName)` - Save failure screenshot
- `getConsoleErrors(page)` - Get all console errors
- `getConsoleWarnings(page)` - Get all warnings
- `clearNetworkMessageLog(page)` - Clear message history
- `clearConsoleLog(page)` - Clear console history

## Debug Globals (window.__DEBUG__)

Tests access these debug globals in the browser:

```javascript
// Entity/Blueprint Access
window.__DEBUG__.apps() // All app entities
window.__DEBUG__.entities() // All entities
window.__DEBUG__.blueprints() // All blueprints
window.__DEBUG__.players() // All players
window.__DEBUG__.getEntity(id) // Get entity by ID
window.__DEBUG__.getBlueprint(id) // Get blueprint by ID

// System Access
window.__DEBUG__.world // World instance
window.__DEBUG__.network // Network system
window.__DEBUG__.systems // Get system by name

// Builder Access
window.__DEBUG__.getSelected() // Get selected model
window.__DEBUG__.select(app) // Select model

// Metrics
window.__DEBUG__.getWorldMetrics() // Get statistics
window.__DEBUG__.checkSceneApp() // Health check

// Logging
window.__DEBUG__.logs.errors // Error log array
window.__DEBUG__.logs.warnings // Warning log array
window.__DEBUG__.logs.info // Info log array
```

## Expected Behaviors

### Model Spawning
1. File dialog triggered by UI element
2. Selected file hashed and stored in loader cache
3. Blueprint created with model URL
4. App entity spawned at `camera + forward * distance`
5. Initial mover is `null`
6. 'entityCreated' network message broadcast

### Model Selection
1. Raycast from camera center checks for app at reticle
2. SelectionManager.select(app) called
3. App outline set to orange (0xff9a00)
4. Mover set to player network ID
5. 'entityModified' message sent with mover
6. GizmoManager.attachGizmo() called
7. Gizmo helper added to scene

### Grab Mode Movement
1. Mode set to 'grab'
2. Control.keyF and keyC.capture enabled
3. Raycast from camera center each frame
4. If hit: position at intersection point
5. If no hit: position at max distance along camera ray
6. F key decreases distance, C key increases
7. Mouse wheel rotates around Y axis
8. Snap-to-grid enabled if Control not held
9. Octree queries for nearby snap points

### Placement Finalization
1. Click or timeout ends grab mode
2. Mode changed (back to previous)
3. SelectionManager.select(null) called
4. Mover reset to null
5. 'entityModified' message with mover: null
6. GizmoManager.detachGizmo() called
7. Model position, rotation, scale broadcast
8. Model locked in place (pinned or mover cleared)

### Network Synchronization
1. Every 16ms (networkRate), entityModified sent
2. Messages include: id, position, quaternion, scale, mover
3. Broadcast to all connected clients
4. Server relays to other players
5. Clients update app.data and app.root

## Critical Test Points

### High-Risk Regression Areas
1. **Mover Assignment** - Must be null on spawn, set on select, cleared on deselect
2. **Gizmo Lifecycle** - Attach on select, detach on deselect, no accumulation
3. **Scene Graph** - Models must be in Three.js scene, visible, with correct transforms
4. **Network Messages** - Position/quaternion/scale/mover must be included
5. **Mode Transitions** - Grab→Translate and back should not crash or leak
6. **Selection State** - SelectionManager.selected and ClientBuilder.selected must stay in sync

## Troubleshooting

### Tests Failing at Startup
1. Ensure `npm run dev` is running or let Playwright start it
2. Check that port 3000 is available
3. Verify NODE_ENV allows build mode in World

### Tests Timing Out
1. Increase timeout in playwright.config.js
2. Add `page.waitForLoadState('networkidle')` before assertions
3. Check browser console for JavaScript errors

### Gizmo Not Attaching
1. Verify SelectionManager is initialized
2. Check that gizmoManager exists in composer
3. Ensure viewport passed to GizmoManager constructor

### Models Not Rendering
1. Verify stage.scene exists
2. Check Three.js scene.children includes model
3. Verify model.root.visible = true
4. Check for geometry on model.threeScene

### Network Messages Not Sent
1. Verify network system initialized
2. Check that ClientBuilder is enabled
3. Ensure entityModified handler exists
4. Check network connection status

## Performance Baselines

Expected performance metrics:
- Model spawn: < 200ms
- Selection: < 50ms
- Mode change: < 100ms
- Network message: < 1000 messages/sec
- Memory footprint (100 selects): < 10MB increase
- FPS during grab: > 30fps

## Contributing

When adding new tests:

1. Use descriptive test names matching the pattern: "should [action] [expected result]"
2. Include setup with `page.goto('/')` and wait for network idle
3. Use helper functions from `model-placement-helpers.js`
4. Add both positive tests (should work) and negative tests (error handling)
5. Include assertions for both UI state and network messages
6. Take screenshots on failure: `await helpers.captureScreenshotOnFailure(page, testName)`
7. Clear debug logs between tests to prevent false positives

## Known Issues

None currently. Report any issues with evidence (logs, screenshots, video from test results).

## References

- ModelSpawner: `src/core/systems/builder/spawners/ModelSpawner.js`
- SelectionManager: `src/core/systems/builder/SelectionManager.js`
- GizmoManager: `src/core/systems/builder/GizmoManager.js`
- TransformHandler: `src/core/systems/builder/TransformHandler.js`
- StateTransitionHandler: `src/core/systems/builder/StateTransitionHandler.js`
- ClientBuilder: `src/core/systems/ClientBuilder.js`
- GrabModeHandler: `src/core/systems/builder/GrabModeHandler.js`
