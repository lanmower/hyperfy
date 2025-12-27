# Quick Start: Model Placement Regression Tests

Get started running tests in 2 minutes.

## Installation

Install Playwright test dependency:
```bash
npm install
```

## Run Tests

### Basic Usage
```bash
# Run all model placement tests
npm run test:playwright

# Run with interactive UI (recommended for debugging)
npm run test:playwright:ui

# Debug mode with step-through execution
npm run test:playwright:debug

# View HTML report of last test run
npm run test:playwright:report
```

### Specific Tests
```bash
# Run only model-placement.spec.js tests
npx playwright test tests/playwright/models/model-placement.spec.js

# Run only a single test by name
npx playwright test -g "should spawn model at correct position"

# Run only advanced tests
npx playwright test tests/playwright/models/model-placement-advanced.spec.js

# Run with verbose output
npx playwright test --verbose
```

## What Gets Tested

### Core Workflow (model-placement.spec.js)
- Model spawning and positioning
- Selection and mover assignment
- Grab mode movement and rotation
- Placement finalization
- Network message broadcasting

### Advanced Scenarios (model-placement-advanced.spec.js)
- Edge cases (invalid surfaces, overlaps)
- Three.js scene graph verification
- Builder system integration
- Performance and stability
- Error handling and debugging

## Test Results

Test reports are generated in multiple formats:

- **HTML Report**: `test-results/index.html` - Visual report with screenshots
- **JSON Report**: `test-results/results.json` - Structured data
- **Console Output**: Terminal summary

View HTML report:
```bash
npm run test:playwright:report
```

## Prerequisites

Before running tests:

1. **Node 22.11.0+** is installed
2. **Dev server is running**: `npm run dev`
   - OR let Playwright start it (set `reuseExistingServer: false` in config)
3. **Port 3000 is available**
4. **Browser needs download**: First run downloads Chromium (~150MB)

## Common Workflows

### Debug a Failing Test

```bash
# Run in UI mode - allows pausing, stepping, inspecting
npm run test:playwright:ui

# In UI:
# 1. Click test to run
# 2. Use "Step" button to execute line by line
# 3. Inspect page state in DevTools
# 4. See live DOM and network activity
```

### Check Specific Regression

```bash
# Run selection tests only
npx playwright test -g "Model Placement: Selection"

# Run grab mode tests only
npx playwright test -g "Model Placement: Grab Mode"

# Run network sync tests only
npx playwright test -g "Network Synchronization"
```

### Continuous Testing

```bash
# Watch mode - re-run on file changes
npx playwright test --watch

# Keep server running between runs
# Set reuseExistingServer: true in playwright.config.js
```

### Generate Video for Failed Tests

```bash
# Videos saved to test-results/video/
npx playwright test --video=retain-on-failure
```

## Understanding Test Output

### Passing Test
```
✓ Model Placement: Core Workflow › should spawn model at correct position (1.2s)
```

### Failing Test
```
✗ Model Placement: Selection › should attach gizmo at model location

  Error: expect(received).toBe(expected)
  Expected: true
  Received: false

  Call log:
    → locator.waitForElementState('stable')
    → locator.click()
```

### Flaky Test
```
✓ [flaky] Model Placement: Grab Mode › should detect ground collision (3 flaky)
```

## File Structure

```
tests/
└── playwright/
    ├── README.md                          # Full documentation
    ├── QUICKSTART.md                      # This file
    ├── examples.md                        # Real-world examples
    ├── models/
    │   ├── model-placement.spec.js       # Core workflow tests
    │   └── model-placement-advanced.spec.js  # Edge cases & integration
    └── fixtures/
        └── model-placement-helpers.js     # Test helper functions
```

## Configuration

### playwright.config.js

Key settings:

```javascript
baseURL: 'http://localhost:3000'  // Where tests connect
timeout: 60000                     // Max test duration (ms)
retries: 2                        // Retry failed tests (CI only)
workers: 1                        // Run tests sequentially
```

Modify for your environment:
```bash
# Run in parallel on fast machine
workers: 4

# Increase timeout for slow network
timeout: 120000

# Keep browser open after failure for inspection
--headed

# Disable video for faster runs
video: 'off'
```

## Troubleshooting

### "Failed to connect" or "ECONNREFUSED"
Server not running. Either:
- Manually run: `npm run dev`
- Or let Playwright start it (default)

### Tests timeout waiting for model
- Increase `timeout` in playwright.config.js
- Check browser console for JavaScript errors: `npm run test:playwright:ui`
- Verify model file exists and is valid

### "browser launch failed" (first run only)
```bash
# Playwright needs to download Chromium
npx playwright install

# Then try again
npm run test:playwright
```

### Can't select model / gizmo not attaching
- Check debug globals available: Are you in build mode?
- Run in UI mode to inspect: `npm run test:playwright:ui`
- Check console errors: Look at test-results HTML report

### Network messages not being sent
- Verify network system initialized
- Check ClientBuilder is enabled
- Look at entityModified handler in network system
- See "Debug Globals" in main README for inspection

## Helper Functions Quick Reference

```javascript
// Import helpers (in your test)
import helpers from '../fixtures/model-placement-helpers'

// Common operations
await helpers.setupDebugEnvironment(page)
await helpers.selectModel(page, appId)
await helpers.deselectModel(page)
await helpers.setMode(page, 'grab')
await helpers.moveModel(page, appId, [x, y, z])

// Verification
const selected = await helpers.getSelectedModel(page)
const inScene = await helpers.verifyModelInScene(page, appId)
const hasGizmo = await helpers.verifyGizmoAttached(page)

// Debugging
const messages = await helpers.getNetworkMessages(page)
const errors = await helpers.getConsoleErrors(page)
```

See `tests/playwright/examples.md` for full examples.

## Performance Tips

- Tests run sequentially by default (safer, predictable)
- Each test starts fresh browser context
- Can be parallelized: set `workers: 4` in config
- Reduce for CI: disable video, screenshots on success only

## Next Steps

1. **Run basic tests**: `npm run test:playwright`
2. **View results**: `npm run test:playwright:report`
3. **Understand failures**: `npm run test:playwright:ui`
4. **Add your tests**: Copy examples from `examples.md`
5. **Check documentation**: See `README.md` for full details

## CI/CD Integration

For GitHub Actions / GitLab CI:

```yaml
# .github/workflows/test.yml
- name: Run Playwright Tests
  run: npm run test:playwright

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: test-results/
```

## Support

- **Full Documentation**: See `README.md`
- **Real Examples**: See `examples.md`
- **Helper Functions**: See `fixtures/model-placement-helpers.js`
- **Test Files**: See `models/*.spec.js`

## Questions?

Check:
1. Full README.md for comprehensive documentation
2. examples.md for real test scenarios
3. Model placement code in `src/core/systems/builder/`
4. Browser console during `npm run test:playwright:ui`
