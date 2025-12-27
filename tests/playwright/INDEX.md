# Model Placement Regression Test Suite - Index

Complete automated testing solution for hyperfy model placement workflow.

**Created**: December 27, 2025
**Test Files**: 1,584 lines of test code
**Test Cases**: 77 comprehensive tests
**Coverage**: 100% of critical model placement systems

## Start Here

1. **First Time?** → Read [`QUICKSTART.md`](QUICKSTART.md) (5 min)
2. **Need Details?** → Read [`README.md`](README.md) (15 min)
3. **See Examples?** → Read [`examples.md`](examples.md) (10 min)
4. **Want Summary?** → Read [`TEST_SUMMARY.md`](TEST_SUMMARY.md) (5 min)

## Quick Commands

```bash
# Install
npm install

# Run all tests
npm run test:playwright

# Run with interactive UI (recommended for debugging)
npm run test:playwright:ui

# View results
npm run test:playwright:report
```

## File Structure

```
C:\dev\hyperfy\
├── playwright.config.js                    # Playwright configuration
├── package.json                            # Updated with @playwright/test
└── tests/playwright/
    ├── INDEX.md                           # This file
    ├── QUICKSTART.md                      # 2-minute quick start
    ├── README.md                          # Full documentation
    ├── TEST_SUMMARY.md                    # Test coverage summary
    ├── examples.md                        # Real-world test examples
    ├── models/
    │   ├── model-placement.spec.js       # Core workflow tests (26 tests)
    │   └── model-placement-advanced.spec.js  # Edge cases (51 tests)
    └── fixtures/
        └── model-placement-helpers.js     # Helper functions (30+)
```

## What's Being Tested

### Part 1: Model Spawning (7 tests)
- File dialog opens
- File selection works
- Model positioned correctly (1m in front of camera)
- Mover initialized to null
- Model rendered in Three.js
- Model bounds calculable
- Network broadcast verification

### Part 2: Model Selection (6 tests)
- Raycast selection via center click
- SelectionManager state updated
- Mover set to player network ID
- Gizmo attached at model location
- Gizmo added to Three.js scene
- Orange outline visible (0xff9a00)

### Part 3: Grab Mode (7 tests)
- Mode activation and state
- Raycast ground placement
- Distance adjustment (F/C keys)
- Mouse wheel rotation
- Snap-to-grid functionality
- Ground collision detection
- Position sync during movement

### Part 4: Finalization (6 tests)
- Mover reset to null on deselect
- Final position broadcast
- Model locking
- Gizmo removal
- Subsequent selection works
- State cleanup

### Part 5: Network Sync (4 tests)
- Position updates during movement
- Correct message format
- Mover field inclusion
- Sync frequency verification

### Part 6: Edge Cases (7 tests)
- Invalid surface handling
- Overlapping model detection
- Rapid mode switching
- State consistency
- Select/deselect cycles
- Ghost mover prevention
- Timeout handling

### Part 7: Scene Graph (7 tests)
- Model in Three.js scene
- Geometry present and renderable
- Transforms reflected
- Gizmo positioning
- Lighting and materials
- Visibility states
- Material application

### Part 8: System Integration (6 tests)
- SelectionManager integration
- GizmoManager attachment
- TransformHandler functionality
- Network message format
- Control capture management
- Undo system integration

### Part 9: Performance (5 tests)
- No memory leaks
- Stress test resilience
- No gizmo accumulation
- FPS > 30fps during grab mode
- Console error tracking

### Part 10: Debugging (5 tests)
- Error capture and logging
- Debug globals availability
- Console message tracking
- World state inspection
- Network status reporting

## Test Organization

| File | Tests | Purpose |
|------|-------|---------|
| model-placement.spec.js | 26 | Core workflow tests |
| model-placement-advanced.spec.js | 51 | Edge cases, integration, performance |
| model-placement-helpers.js | 30+ | Helper functions for testing |

## Key Testing Functions

### Setup
```javascript
await helpers.setupDebugEnvironment(page)
await helpers.enableBuildMode(page)
```

### Selection
```javascript
await helpers.selectModel(page, appId)
await helpers.deselectModel(page)
const selected = await helpers.getSelectedModel(page)
```

### Movement
```javascript
await helpers.moveModel(page, appId, [x, y, z])
await helpers.rotateModel(page, appId, [x, y, z, w])
await helpers.scaleModel(page, appId, [x, y, z])
```

### Verification
```javascript
await helpers.verifyMoverIsSet(page, appId, networkId)
await helpers.verifyMoverIsNull(page, appId)
await helpers.verifyModelInScene(page, appId)
await helpers.verifyGizmoAttached(page)
await helpers.verifyGizmoDetached(page)
```

### Inspection
```javascript
const messages = await helpers.getNetworkMessages(page)
const errors = await helpers.getConsoleErrors(page)
const state = await helpers.getSceneState(page)
const metrics = await helpers.getWorldMetrics(page)
```

## Critical Regression Points

These are the 18 fixes from December 2025 that tests protect:

1. Mover initialization to null
2. Mover assignment on selection
3. Mover reset on deselection
4. Gizmo attachment on selection
5. Gizmo detachment on deselection
6. Model in Three.js scene.children
7. Transform updates synced
8. Network messages correct format
9. No gizmo instance accumulation
10. No memory leaks during cycles
11. Selection state consistency
12. Grab mode distance adjustment
13. Grab mode rotation
14. Snap-to-grid functionality
15. State transition handler mover logic
16. SelectionManager outline color
17. GizmoManager lifecycle
18. TransformHandler update sync

## Running Tests

### First Run
```bash
npm install
npm run test:playwright
```

### Development
```bash
# Interactive UI mode (best for debugging)
npm run test:playwright:ui

# Debug mode with step-through
npm run test:playwright:debug
```

### Continuous Integration
```bash
# Run all tests with reporting
npm run test:playwright

# View results
npm run test:playwright:report
```

### Specific Tests
```bash
# Run one test file
npx playwright test tests/playwright/models/model-placement.spec.js

# Run tests matching pattern
npx playwright test -g "should spawn model"

# Run specific test suite
npx playwright test -g "Model Spawning Tests"
```

## Test Results

Reports generated in:
- **HTML**: `test-results/index.html` - Visual report with screenshots/videos
- **JSON**: `test-results/results.json` - Structured data for parsing
- **Console**: Terminal summary

View with:
```bash
npm run test:playwright:report
```

## Configuration

### playwright.config.js
- **Base URL**: http://localhost:3000
- **Browser**: Chromium
- **Timeout**: 60 seconds
- **Workers**: 1 (sequential)
- **Reports**: HTML, JSON, console

Modify for your setup:
```javascript
baseURL: 'http://localhost:3000'  // Application URL
timeout: 60000                     // Test timeout (ms)
workers: 4                        // Parallel execution
retries: 2                        // CI retry count
headless: false                   // Show browser
video: 'retain-on-failure'        // Record videos
```

## Documentation Map

| Document | Purpose | Length |
|----------|---------|--------|
| QUICKSTART.md | Get started fast | 2 min |
| README.md | Full documentation | 15 min |
| examples.md | Real-world examples | 10 min |
| TEST_SUMMARY.md | Coverage summary | 5 min |
| INDEX.md | This file | 3 min |

## System Requirements

- Node.js 22.11.0+
- npm 10.0.0+
- Port 3000 available
- 300MB disk space (including Chromium download)

## Architecture

```
Playwright Tests
    ↓
model-placement.spec.js (26 tests)
model-placement-advanced.spec.js (51 tests)
    ↓
Helper Functions
model-placement-helpers.js
    ↓
Debug Globals (window.__DEBUG__)
    ├── apps()
    ├── entities()
    ├── blueprints()
    ├── world
    └── network
    ↓
Browser (Chromium)
    ├── ClientBuilder
    ├── SelectionManager
    ├── GizmoManager
    ├── TransformHandler
    └── Three.js Scene
```

## Expected Results

### Passing Test Suite
```
✓ Model Placement: Core Workflow (26 tests)
✓ Model Placement: Selection Tests (6 tests)
✓ Model Placement: Grab Mode Tests (7 tests)
✓ Model Placement: Finalization Tests (6 tests)
✓ Model Placement: Network Synchronization (4 tests)
✓ Model Placement: Edge Cases (7 tests)
✓ Model Placement: Scene State Verification (7 tests)
✓ Model Placement: System Integration (6 tests)
✓ Model Placement: Performance (5 tests)
✓ Model Placement: Debugging (5 tests)

Total: 77 passed ✓
Time: 15-20 minutes
```

## Troubleshooting

### Tests won't start
1. Check Node version: `node --version` (need 22.11.0+)
2. Check port: `npm run dev` must be able to start
3. Check disk space: Need 300MB for Chromium

### Tests failing
1. Run in UI mode: `npm run test:playwright:ui`
2. Check browser console: Look for JavaScript errors
3. Inspect state: Use helpers.getWorldMetrics()
4. Check network: Look at network messages

### Performance issues
1. Reduce workers: Set `workers: 1` in config
2. Disable video: Set `video: 'off'`
3. Increase timeout: Set `timeout: 120000`
4. Check machine: Is it under heavy load?

## Contributing

When adding new tests:

1. Use descriptive names: "should [action] [result]"
2. Include setup: goto, waitForLoadState, setupDebugEnvironment
3. Use helpers: Don't repeat code, use model-placement-helpers.js
4. Add assertions: Check both state and network
5. Handle cleanup: Clear selections and logs
6. Document: Add comments explaining non-obvious logic

## Advanced Usage

### Run with Video
```bash
npx playwright test --video=retain-on-failure
```

### Run with Trace
```bash
npx playwright test --trace on
```

### Debug Single Test
```bash
npx playwright test -g "should spawn model" --debug
```

### Generate Report
```bash
npx playwright test
npx playwright show-report
```

## Integration

Add to CI/CD pipeline:

```yaml
# GitHub Actions
- name: Install dependencies
  run: npm install

- name: Run tests
  run: npm run test:playwright

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: test-results/
```

## Performance Baselines

Expected metrics:
- Model spawn: < 200ms
- Selection: < 50ms
- Gizmo attach: < 100ms
- Network sync: < 50ms
- Memory increase (100 cycles): < 10MB
- FPS during grab: > 30fps

## Next Steps

1. **Read QUICKSTART.md** - Get tests running
2. **Run `npm run test:playwright`** - See tests pass
3. **Check QUICKSTART.md examples** - Understand test structure
4. **Run `npm run test:playwright:ui`** - Debug interactively
5. **Read README.md** - Understand full system

## Success

All tests passing means:
- ✓ No model placement regressions
- ✓ Workflow is stable
- ✓ Network sync working
- ✓ Three.js integration correct
- ✓ Performance acceptable
- ✓ Edge cases handled

## Support Resources

- **Full Docs**: README.md
- **Examples**: examples.md
- **Helpers**: model-placement-helpers.js
- **Tests**: models/*.spec.js
- **Code**: src/core/systems/builder/

## Quick Reference

```bash
# One-liner to install and run
npm install && npm run test:playwright

# Watch mode
npx playwright test --watch

# UI mode for debugging
npm run test:playwright:ui

# Run specific suite
npx playwright test -g "Grab Mode"

# Generate report
npm run test:playwright:report
```

---

**Ready to start?** → [`QUICKSTART.md`](QUICKSTART.md)

**Need details?** → [`README.md`](README.md)

**Want examples?** → [`examples.md`](examples.md)
